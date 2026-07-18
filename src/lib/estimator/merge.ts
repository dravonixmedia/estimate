import type { ProjectScope } from "./schema";

/**
 * Merges a confirmed AI inference into canonical scope state. Used only
 * when the client clicks "Looks Correct" — never automatically. Merges
 * per service-section so an inferred `website.pageCount` doesn't wipe out
 * an already-answered `website.features`, etc.
 */
export function mergeScope(base: ProjectScope, patch: Partial<ProjectScope>): ProjectScope {
  const next: ProjectScope = { ...base };
  for (const key of Object.keys(patch) as (keyof ProjectScope)[]) {
    const patchSection = patch[key];
    if (!patchSection) continue;
    next[key] = { ...(base[key] as object | undefined), ...(patchSection as object) } as never;
  }
  return next;
}
