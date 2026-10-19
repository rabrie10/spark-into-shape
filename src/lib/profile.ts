import type { Profile } from "./evaluate";

export const FIELDS: { key: string; label: string; options: [string, string][] }[] = [
  { key: "location", label: "Where are you based?", options: [["oslo", "Oslo"], ["norway", "Elsewhere in Norway"], ["abroad", "Outside Norway"]] },
  { key: "focus", label: "Main field of work", options: [["integration", "Integration"], ["youth", "Youth"], ["poverty", "Poverty and social inclusion"], ["arts", "Arts and culture"], ["other", "Other"]] },
  { key: "scope", label: "Reach", options: [["local", "Local"], ["national", "National"]] },
  { key: "registered", label: "Registered in Frivillighetsregisteret?", options: [["yes", "Yes"], ["no", "No"], ["unsure", "Not sure"]] },
  { key: "membership", label: "Members", options: [["list", "Members, with a list"], ["nolist", "Members, no list yet"], ["no", "No members"], ["unsure", "Not sure"]] },
  { key: "immigrantOrg", label: "Founded by and for people with immigrant background?", options: [["yes", "Yes"], ["no", "No"], ["unsure", "Not sure"]] },
  { key: "userRun", label: "Run by the people it serves?", options: [["yes", "Yes"], ["no", "No"], ["unsure", "Not sure"]] },
  { key: "youth", label: "Youth work is a core activity?", options: [["yes", "Yes"], ["no", "No"], ["unsure", "Not sure"]] },
  { key: "statutes", label: "Statutes ready?", options: [["yes", "Yes"], ["no", "No"], ["unsure", "Not sure"]] },
  { key: "accounts", label: "Last year’s accounts and report ready?", options: [["yes", "Yes"], ["no", "No"], ["unsure", "Not sure"]] },
  { key: "partners", label: "Partners outside the EU and EEA", options: [["none", "None"], ["one", "One country"], ["two", "Two or more countries"], ["unsure", "Not sure"]] },
];

export const EXAMPLES: { label: string; facts: Profile }[] = [
  { label: "Oslo integration association", facts: { name: "Example integration association", location: "oslo", focus: "integration", scope: "local", registered: "yes", membership: "list", immigrantOrg: "yes", userRun: "yes", youth: "no", statutes: "yes", accounts: "yes", partners: "none" } },
  { label: "Youth network with partners abroad", facts: { name: "Example youth network", location: "oslo", focus: "youth", scope: "national", registered: "yes", membership: "list", immigrantOrg: "no", userRun: "no", youth: "yes", statutes: "yes", accounts: "yes", partners: "one" } },
  { label: "Community arts group", facts: { name: "Example community arts group", location: "norway", focus: "arts", scope: "local", registered: "unsure", membership: "nolist", immigrantOrg: "no", userRun: "unsure", youth: "unsure", statutes: "no", accounts: "no", partners: "none" } },
];

export function labelFor(key: string, value: string) {
  return FIELDS.find((f) => f.key === key)?.options.find((o) => o[0] === value)?.[1] ?? value;
}
