import { describe, expect, it } from "vitest";
import seed from "@/data/grants.json";
import { deadlineState, evaluateGrant, type Grant, type Profile } from "./evaluate";
import { EXAMPLES } from "./profile";

const grants = seed as Grant[];
const g = (slug: string) => grants.find((x) => x.slug === slug)!;
const [integration, youth, arts] = EXAMPLES.map((e) => e.facts) as [Profile, Profile, Profile];

describe("demo verdicts", () => {
  it("youth example vs Erasmus+ is possible with conditions", () => {
    expect(evaluateGrant(youth, g("erasmus-youth-cb").requirements).verdict).toBe("conditional");
  });
  it("integration example vs Oslo core funding has no not_met", () => {
    const { results } = evaluateGrant(integration, g("oslo-immigrant-orgs-core").requirements);
    expect(results.some((r) => r.status === "not_met")).toBe(false);
  });
  it("arts example vs NAV poverty is not a fit", () => {
    expect(evaluateGrant(arts, g("nav-poverty-user-orgs").requirements).verdict).toBe("notfit");
  });
});

describe("deadlines", () => {
  const today = new Date("2026-10-19T12:00:00Z");
  it("Erasmus+ inferred past date appears closed", () => {
    expect(deadlineState(g("erasmus-youth-cb").deadline, today).label).toBe("Appears closed");
  });
  it("Tønsberg next round is 15 February 2027", () => {
    expect(deadlineState(g("tonsberg-foundations").deadline, today).label).toBe("Next round expected 15 February 2027");
  });
});
