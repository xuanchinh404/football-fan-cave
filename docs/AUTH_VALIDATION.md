# Authentication validation — 4 November 2026

## Passed locally

- `npm test`: 25/25 tests passed, including executable PostgreSQL migration/RLS tests and authenticated Socket.IO integration tests.
- `npm run test:auth`: 13/13 Playwright tests passed in Chromium.
- `npm run build`: frontend TypeScript/Vite and backend TypeScript passed. The current 3D physics bundle emits a size warning.
- Actual screenshots: `docs/auth-1440x900.png`, `docs/auth-1920x1080.png`, `docs/auth-1366x768.png`, `docs/auth-768x1024.png`, `docs/auth-390x844.png`, `docs/auth-360x800.png`, `docs/auth-430x932.png`.

PostgreSQL tests use PGlite and execute the SQL, role changes and row policies; they do not merely search SQL text. Cases cover ownership, column grants, forbidden wallet/ledger/payment writes, profile/wallet uniqueness, negative balances, exact bigint JSON, guest purchase rejection, payment replay/mismatch, purchase replay/conflicting keys, insufficient funds and rollback after a forced ledger error.

Socket tests use the real Socket.IO backend with a test-only Auth HTTP service: token requirement, forged/expired token rejection, identity immutability on refresh, server profile attribution, chat, reconnect, movement validation, rate limits and guest purchase restrictions.

Browser tests exercise the real SDK against a test-only HTTP contract fixture. They cover responsive views, registration password mismatch, confirmation instructions, wrong password errors, neutral reset responses, guest sign-in, profile persistence across reload, game entry/realtime connection, wallet restrictions, gated linking, logout, email login, expired recovery link, canceled OAuth and provider-disabled instructions. Fixture behavior is not evidence of real email delivery, provider approval or hosted Auth functioning.

## Not validated against a hosted project

No game-specific Supabase project/credentials were present. The connected account's NeoLao project was not modified. Docker daemon was unavailable; a local full Supabase stack was not started.

Pending target-project work: migrate database, run Supabase Security Advisors, verify actual Google/Facebook credentials and redirects, email confirmation and password-recovery delivery, anonymous configuration, and identity linking conflict/success cases. Identity linking stays gated by default. Real payments are not enabled.

## Visual comparison

The UI uses an original illustrated cavern, cyan/purple/gold lighting, fan silhouettes, fantasy sign, dark glass forms and purple gradient controls. Desktop presents both forms and mobile presents one form with tabs. React/CSS/SVG elements are interactive; the reference image is not used as a flattened background. The CSS sign is simpler than the reference's sculpted logo. A bespoke layered logo asset is the remaining artwork gap for closer matching.
