# Automated Accessibility CI Pipeline

Scans key pages with **axe-core + Playwright** on every pull request, **fails the build on serious or critical violations**, and publishes a **dashboard that tracks violations over time**.

```
sample-app/            Tiny static demo site (3 clean pages + 1 deliberately broken page)
tests/a11y.spec.js     One Playwright test per page; runs axe, writes JSON, asserts no blocking issues
a11y.config.json       Pages to scan, WCAG tags, impact levels that fail the build
scripts/build-report.js  Builds report/index.html + history.json + PR summary
.github/workflows/accessibility.yml   CI: scan, comment on PR, publish dashboard, gate
docs/sample-dashboard.html  Example of the generated dashboard
```

## Run locally

```bash
npm install
npx playwright install --with-deps chromium   # once
npm run a11y                  # scan + build dashboard
open report/index.html        # or xdg-open / start
npm run test:a11y:broken      # include the broken demo page to see the build fail
```

## How it works

1. **PRs and pushes to `main`** trigger the workflow. Playwright starts the sample app and axe scans each page in `a11y.config.json` (WCAG 2.0/2.1/2.2 A and AA rules plus best practices).
2. Any violation with impact in `failOn` (default `serious`, `critical`) fails that page's test. Moderate and minor findings are recorded but do not block.
3. The report step always runs, even when the scan fails. It posts a summary as a PR comment and in the job summary, and uploads the HTML dashboard as an artifact.
4. On `main`, the dashboard is published to the **`gh-pages` branch** together with `history.json`. Each run restores the previous history, appends one entry (commit, branch, counts per impact and page, last 100 runs kept), and republishes. That is how the trend chart accumulates.
5. The final step fails the job if the scan failed. Add the **Accessibility / axe** check as a *required status check* in branch protection to block merging.

### One-time GitHub setup
- Push the repo. In **Settings → Pages**, set source to the `gh-pages` branch (created on the first `main` run).
- In **Settings → Actions → General**, allow workflows read and write permissions.
- Branch protection on `main`: require the `axe` job to pass.

### Point it at your own app
Edit `a11y.config.json` for pages and `playwright.config.js` (`webServer` and `baseURL`) for how your app starts. For authenticated pages, log in in a `beforeEach` or use Playwright `storageState`.

## What automation can't catch (needs manual testing)

axe-core reliably detects roughly a third to half of WCAG failures by volume. It can tell that an `alt` attribute exists, not that it is *meaningful*. A green build means "no detectable violations," not "accessible."

**Keyboard and focus**
- Logical tab order and no keyboard traps
- Focus moves sensibly after opening dialogs, menus, route changes and inline errors
- Custom widgets (tabs, comboboxes, carousels) support expected arrow/Esc/Enter behaviour

**Screen readers** (test with NVDA/JAWS on Windows, VoiceOver on macOS/iOS, TalkBack on Android)
- Reading order and announcements make sense; live regions announce updates
- Link, button and form labels are clear out of context, not just present
- Dynamic content and error messages are conveyed

**Content quality**
- Alt text is accurate and appropriate (decorative vs informative images)
- Headings describe their sections; link text is understandable; plain-language writing
- Captions and transcripts are correct and synchronised; audio description exists where needed
- Instructions don't rely on sensory characteristics ("click the green button")

**Visual and sensory**
- Colour contrast over images, gradients and states axe marks "incomplete" (check the `incomplete` count in the JSON)
- Text resizes to 200% and reflows at 320px / 400% zoom without loss of content
- Content is understandable without colour, with forced-colors/high-contrast mode, and with reduced motion
- Animations, flashing and auto-playing media are controllable and safe

**Interaction and cognition**
- Touch target size and pointer gestures have simple alternatives (dragging, multi-finger)
- Timeouts, error prevention and recovery, consistent navigation, redundant entry
- Real-user testing with disabled people is the only way to find usability barriers

**Coverage gaps**
- Only pages and states the script visits are scanned: modals, menus, error states, logged-in views and mobile layouts need their own tests
- Third-party widgets and PDFs/documents are out of scope

A PR template with a manual checklist is included in `.github/pull_request_template.md`.

## Notes
- Chromium was not available in the authoring sandbox, so the Playwright run was not executed there. The sample pages and the report builder were verified by running axe-core in jsdom (color-contrast needs a real browser). Run `npm run a11y` locally once to confirm.
- Colour-contrast checks only run in a real browser, which is why CI uses Playwright.
