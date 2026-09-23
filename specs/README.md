# Plans

Every spec in `tests/` is generated from a plan in this directory. A plan is the written
record of what a TestCollab case says, what the live site actually does, and where those two
disagree — produced by the Planner agent, reviewed by QA, and consumed by Engineer.

## Naming

```
tc-<id>-<slug>-plan.md          one case          tc-1578349-generic-page-delete-plan.md
tc-<id>-<id>-<slug>-plan.md     a range of cases  tc-1578356-1578402-content-types-plan.md
```

**A plan named for one case routinely covers many.** `tc-1578356-1578402-content-types-plan.md`
alone covers 27. The filename is a convenience, not an index, so it cannot tell you which case
a given spec automates.

That is what the `// case: TC-<id>` header at the top of each spec is for:

```js
// case: TC-1578397                                    <- the one case this spec automates
// spec: specs/tc-1578395-1578398-landing-page-plan.md  <- the plan it came from
```

The `// case:` line is the only reliable link from a spec back to a case. The burndown count
and QA's `automated` tagging both read it, and `tests/guards/spec-traceability.spec.js` fails
the build if one is missing or two specs claim the same id. Specs that genuinely automate no
case — repo guards, ad-hoc checks — say `// case: none (<reason>)`.

## What a plan contains

| Section | What it's for |
|---|---|
| **Application Overview** | Source project, how many cases were fetched, planned and deferred, and why |
| **Coverage summary** | One row per case: id, title, verdict (Automate / Automate with setup / Not worth automating / Blocked), existing spec, notes. This table is what maps a case id to a spec title |
| **Drift found** | Where the case and the live site disagree |
| **Test Scenarios** | The steps as the app actually behaves, with concrete expected results |

**Drift found is the part worth reading.** A manual case can be months out of date — a field
that became mandatory, a button that was renamed, a redirect that no longer happens. The
planner records the disagreement instead of quietly picking a side, so a human decides whether
the case or the app is wrong. Real examples in here: the News/Blog form makes Image mandatory
although the case calls it optional; the Landing and Homepage forms have no image caption
though three cases expect one; saving an edit returns to `/admin/content` rather than the
front end; and there is no "Project" content type at all, which blocks six cases outright.

## Who does what

| Agent | Role | Writes |
|---|---|---|
| [Planner](../.github/agents/Planner.agent.md) | Fetches cases, walks every step live, records drift | The plan in this directory |
| [QA](../.github/agents/QA.agent.md) | Re-verifies the plan's claims independently; approves or requests changes. Also tags the case `automated` once its spec passes | TestCollab (tags and description pointers) |
| [Engineer](../.github/agents/Engineer.agent.md) | Turns an approved plan into specs, reusing existing helpers | `tests/**/*.spec.js` |
| [Dr.Git](../.github/agents/DrGit.agent.md) | All git work, with secret scanning before every commit | Commits, branches, pushes |

No plan reaches Engineer without QA's approval, and no case is tagged `automated` until its
spec has actually passed.

## Related

- [`../reports/`](../reports/) — run history, the HTML report, and the automation burndown
  (recomputed from the specs' `// case:` headers on every run).
- [`../README.md`](../README.md) — the suite itself: how to run it, the folder layout, and the
  smoke/regression split.
