# CI/CD Integration Strategy — Roadpass Digital E2E Suite

## 1. Pipeline Configuration

### Triggers

| Event | Workflow | Scope |
|---|---|---|
| Every pull request / push to `main` or `develop` | `pr-checks` | Happy-path + edge/negative on **Chromium only** |
| Nightly scheduled run (e.g. 02:00 UTC) | `nightly-cross-browser` | Full suite on **Chromium + Firefox + WebKit** |

Running the full cross-browser suite on every PR would be too slow (~10–15 min per browser) and expensive. Chromium-only PR checks give fast feedback (target: < 5 min) while the nightly run catches cross-browser regressions without blocking developers.

### Job Structure (PR workflow)

```
test-happy-path  ──→  test-edge-and-negative
```

The happy-path job runs first. If it fails, the edge/negative job is still blocked — this avoids wasting executor minutes on tests that are lower priority than the critical path.

### Parallelization

- **Nightly job**: Uses `parallelism: 3` in CircleCI, with `CIRCLE_NODE_INDEX` (0, 1, 2) mapped to Chromium, Firefox, and WebKit respectively. Each browser runs in its own executor simultaneously, cutting total runtime by ~3×.
- **Within a browser**: `fullyParallel: true` in `playwright.config.ts` means individual spec files run concurrently within a single executor.
- **Workers on CI**: Set to `1` in `playwright.config.ts` when `CI=true` to prevent resource contention on shared executors. The parallelism comes from CircleCI containers, not Playwright's internal worker pool.

### Retries

`playwright.config.ts` already sets `retries: 2` when `CI=true`. This is the first line of defence against transient network failures (the app is a live third-party site). Retries are recorded in the JUnit output and surfaced in CircleCI test insights.

---

## 2. Test Failure Handling & Reporting

### Artifacts stored per run

| Artifact | What it contains | Who uses it |
|---|---|---|
| `test-results/junit/results.xml` | JUnit XML — machine-readable pass/fail, duration, retry count | CircleCI test insights, trend graphs, flake detection |
| `playwright-report/` | Full HTML report with screenshots, videos, and traces | Engineers debugging failures |
| `test-results/` | Raw trace files (`.zip`) for failed/retried tests | Engineers replaying failures locally with `npx playwright show-trace` |

Playwright captures a trace on first retry (`trace: 'on-first-retry'` in config). This means every retry produces a timeline you can scrub through — crucial for debugging intermittent UI failures.

### Failure notifications

**Recommended approach: Slack + PR status checks (not email).**

- **CircleCI → Slack**: Use the CircleCI Slack orb. Post to `#qa-alerts` on failure, include job name, branch, and a direct link to the HTML report artifact.
- **GitHub PR status check**: CircleCI sets a required status check (`pr-checks`) automatically. A failing test blocks merge without needing a separate integration.
- **PR comments**: Optionally use a GitHub Actions bot (or CircleCI's GitHub integration) to post a comment with a summary table of passed/failed/flaky tests directly on the PR. This is high-value for reviewers but requires additional setup (e.g. `playwright-github-action` or a custom script parsing the JUnit XML).

**Sample Slack message format:**
```
❌ E2E Tests Failed — roadpass/roadtrippers
Branch: feature/trip-planner-v2
Failed: test-edge-and-negative (Chromium)
Test: @edge-case Same origin and destination
📄 View report: https://circleci.com/...
```

---

## 3. Flaky Test Strategy

### Detection

CircleCI's **Test Insights** dashboard automatically surfaces flaky tests once JUnit XML is uploaded — it tracks pass/fail/retry history per test over time and flags tests that pass on retry after initially failing. No extra tooling needed.

Additionally, a test that fails on the first attempt but passes on retry is logged with `status: "flaky"` in the JUnit output. A weekly review of the Insights dashboard should be the team's first step.

### Quarantine

When a test is identified as flaky:

1. **Add a `@flaky` tag** to the test immediately (same-day).
2. **Exclude `@flaky` tests from the PR-blocking workflow** by adding `--grep-invert "@flaky"` to the CI command. This prevents flaky tests from blocking developers while the issue is investigated.
3. **Continue running `@flaky` tests in the nightly job** (without the grep-invert) so failures are still visible and tracked.

```typescript
// Example: quarantined test
test('@flaky @edge-case Same origin and destination', async ({ page }) => { ... });
```

The `@flaky` tag is a temporary state, not a permanent one. Every quarantined test should have a linked ticket with a resolution deadline (suggest: 2-week SLA).

### Retry Policy

| Scenario | Retry count | Rationale |
|---|---|---|
| PR workflow | 2 retries | Catches transient network issues without masking real bugs |
| Nightly cross-browser | 1 retry | Nightly run is for detection; too many retries hide cross-browser bugs |
| `@flaky` quarantined tests | 3 retries | Gives flaky tests maximum chance to pass while being investigated |

Retries should **never** be increased as a permanent fix for a flaky test. If a test still fails after 3 retries, it's a real issue.

### Ownership

Each test file or directory should have a clear owner. Suggested structure:

```
tests/
  fe-tests/        → Frontend QA team
  api-tests/       → Backend QA team
```

Use a `CODEOWNERS` file in the repo root:
```
tests/fe-tests/    @roadpass/frontend-qa
```

This means CircleCI's GitHub integration automatically requests a review from the owning team when tests in that directory fail on a PR. Ownership prevents the "everyone's problem = nobody's problem" failure mode.

---

## 4. Metrics to Track

### Metric 1: Pass Rate (by tag and browser)

**What**: Percentage of test runs that pass on first attempt, broken down by `@happy-path`, `@edge-case`, `@negative`, and by browser.

**Why**: The overall pass rate is too coarse. Segmenting by tag reveals whether core user flows are stable (happy-path should be ≥ 99%) while edge cases may have a lower acceptable bar. Segmenting by browser catches WebKit-specific regressions early.

**Target**: `@happy-path` on Chromium ≥ 99%; all tags cross-browser ≥ 95%.

---

### Metric 2: Flaky Test Rate

**What**: Percentage of tests that fail on first attempt but pass on retry, tracked weekly.

**Why**: Flakiness is the #1 destroyer of trust in a test suite. If engineers start ignoring red builds because "it's probably flaky," the suite loses its value entirely. A rising flaky rate is an early warning signal.

**Target**: < 5% of total test runs in any given week. Any test flaking on > 20% of its runs should be immediately quarantined.

---

### Metric 3: Mean Time to Feedback (MTTF)

**What**: Average time from a PR push to the first CI result being available on the PR.

**Why**: If feedback takes 20 minutes, developers have already context-switched. Sub-5-minute feedback keeps tests in the developer's mental loop and makes them act on failures. This metric drives decisions on parallelization and job splitting.

**Target**: ≤ 5 minutes for the PR workflow (Chromium, happy-path + edge/negative).

---

### Metric 4: Test Coverage of Critical User Journeys

**What**: Percentage of identified critical user journeys (CUJs) that have at least one automated `@happy-path` test.

**Why**: Pass rate and flakiness metrics tell you how the suite is performing but not whether you're testing the right things. Tracking CUJ coverage ensures the suite grows alongside the product. For Roadpass, a CUJ might be: plan trip → create trip → view trip → share trip.

**Target**: 100% of P0 CUJs covered; ≥ 80% of P1 CUJs covered.

---

## Summary

```
PR push
  └─► test-happy-path (Chromium, ~2 min)
        └─► test-edge-and-negative (Chromium, ~2 min)
              └─► ✅ Merge unblocked  /  ❌ Slack alert + PR status fail

Nightly (02:00 UTC)
  └─► test-cross-browser (Chromium + Firefox + WebKit, parallel, ~8 min)
        └─► ✅ Insights updated  /  ❌ Slack alert to #qa-alerts
```

The configuration file is at `.circleci/config.yml` in the repository root.
