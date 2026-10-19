import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import seed from "@/data/grants.json";
import type { Grant, Profile } from "./evaluate";
import { EXAMPLES } from "./profile";

export type AuditEvent = { at: string; type: string; detail: string };
export type Application = {
  checklist: Record<string, boolean>;
  status: "draft" | "verified";
  verified_at?: string | undefined;
  match_snapshot?: unknown;
  draft_text?: string;
};
type State = {
  profile: Profile;
  added: Grant[];
  applications: Record<string, Application>;
  audit: AuditEvent[];
};

const KEY = "grantastic-v1";
const initial = (): State => ({ profile: { ...EXAMPLES[0]!.facts }, added: [], applications: {}, audit: [] });

type Ctx = State & {
  grants: Grant[];
  ready: boolean;
  setProfile: (p: Profile, changed: string[]) => void;
  updateApp: (slug: string, patch: Partial<Application>) => void;
  log: (type: string, detail: string) => void;
  addGrant: (g: Grant) => void;
  reset: () => void;
};
const StoreCtx = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(initial);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState(JSON.parse(raw));
    } catch {
      /* ignore corrupt storage */
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(state));
  }, [state, ready]);

  const log = (type: string, detail: string) =>
    setState((s) => ({ ...s, audit: [{ at: new Date().toISOString(), type, detail }, ...s.audit].slice(0, 200) }));

  const value: Ctx = {
    ...state,
    ready,
    grants: [...(seed as Grant[]), ...state.added],
    setProfile: (p, changed) => {
      setState((s) => ({ ...s, profile: p }));
      if (changed.length) log("profile_updated", changed.join(", "));
    },
    updateApp: (slug, patch) =>
      setState((s) => {
        const cur = s.applications[slug] ?? { checklist: {}, status: "draft" as const };
        return { ...s, applications: { ...s.applications, [slug]: { ...cur, ...patch } } };
      }),
    log,
    addGrant: (g) => setState((s) => ({ ...s, added: [...s.added.filter((x) => x.slug !== g.slug), g] })),
    reset: () => {
      setState({ ...initial(), audit: [{ at: new Date().toISOString(), type: "demo_reset", detail: "Restored the first example profile" }] });
    },
  };
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("useStore must be used inside StoreProvider");
  return c;
}
