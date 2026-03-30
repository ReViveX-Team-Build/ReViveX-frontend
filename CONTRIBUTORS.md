# Contributors

This document summarises the work done by each contributor based on the repository's commit history.

---

## imashan

**Branch:** `imashan-feature-branch`  
**PRs merged:** [#42](https://github.com/ReViveX-Team-Build/ReViveX-frontend/pull/42), [#53](https://github.com/ReViveX-Team-Build/ReViveX-frontend/pull/53)

### Feature Work

#### AI Companion (`feat/fix – ai-companion`)
- **Hardware status integration** – Integrated hardware status data into the AI companion interface as part of a broader feature set that also covered analytics improvements and subscription management (merged via PR #42).
- **Removed duplicate message saves** – The `useAiCompanion` hook was persisting messages locally in addition to the API routes that already persisted both turns; removed the redundant saves to avoid duplicates (`307bad56`).
- **Inline error handling** – Replaced a locally-caught `throw` inside the hook with inline error handling so errors surface correctly without interrupting the call chain (`393a2ad7`).
- **Suppressed unhandled-promise warnings** – Added proper `.catch` / `void` handling on the `handleSend` click handlers to silence React/ESLint unhandled-promise warnings (`ec8bc4ba`).
- **Import path fix** – Replaced a relative import path for `useAiCompanion` with the project's `@` alias to stay consistent with the rest of the codebase (`112ee8f9`).

#### Stripe / Subscription Management (`feat – stripe`)
- **Manage Subscription button** – Added a *Manage Subscription* button to the *Current Plan* card so Pro users can reach the Stripe Customer Portal directly from the UI (`57a8203d`).
- **`/api/create-portal` route** – Created the backing API route that generates a Stripe Customer Portal session URL and returns it to the client (`63fe9f1e`).

#### Analytics (`fix – analytics`)
- **Grip trend chart label grammar** – Corrected the session-count label in the grip trend chart from incorrect grammar to the proper singular/plural form (`e66f7b32`).

### Cleanup & Maintenance

| Commit | Description |
|--------|-------------|
| `cf63987f` | `fix(llm-generate)`: removed an unused `messages` variable and an unused `getInboxMessages` import from the LLM-generate route |
| `bce4e738` | `chore(cleanup)`: resolved outstanding ESLint warnings and removed unused code across the feature branch (merged via PR #53) |
