# iBadz — Badminton

Responsive Thai badminton app built with React, TypeScript, Vite and Tailwind CSS. The cyan/orange shader hero adapts the supplied reference with Paper Design and Framer Motion.

## Run

Requires Node.js 22+ and npm.

```sh
npm install
npm run dev
npm run build
```

## Features

- Create dated playing sessions; switch between sessions.
- Singles/doubles, optional team names (defaults: เหย้า / เยือน), custom target, single game with automatic win-by-two deuce and no score cap.
- Tap to score, undo, switch visual sides, cancel, save completed matches.
- Itemized expenses, equal split with exact satang allocation, participants and payment status. Changing expenses or participants resets payment statuses.
- Session history including match results, expenses, and payment status.
- API-backed session history, expenses, members and payment statuses in Neon PostgreSQL. In-progress games and a read cache remain in localStorage.

## Structure

- `src/components/app-layout.tsx`: shared background, header, navigation, page context and footer.
- `src/components/session-picker.tsx`: shared round selector for history and expenses.
- `src/components/section-heading.tsx`: page heading with an optional action.
- `src/components/history-session-card.tsx`: reusable session summary and match history card.
- `src/components/toast-notification.tsx`: accessible notifications, including fullscreen portals.
- `src/components/required-mark.tsx`: shared required-field indicator.
- `src/lib/format.ts`: shared money, satang and session-date formatting.
- `src/components/ui/hero.tsx`: reusable reference-inspired hero.
- `src/styles.css`: Tailwind entry and responsive theme.
- `src/lib/store.ts`: data types, persistence, scoring and allocation helpers. Includes browser cache and in-progress match persistence.
- `src/main.tsx`: app UI and workflows.
- `components.json`: shadcn-compatible aliases and CSS configuration. UI components belong in `src/components/ui` (aliased as `@/components/ui`) to keep reusable primitives separate from screens.

The API lives in the sibling `badminton-services` repository. No login or hosted deployment is included. Mesh shader animation needs WebGL; the CSS gradient remains behind it. Reduced-motion users receive the static background.

## UI system

UI primitives use shadcn/ui (Radix): Button, Input, Label, Card, Badge, Dialog, Checkbox, and Native Select. Components are owned in `src/components/ui`; semantic Tailwind tokens are defined in `src/styles.css`. Dialog handles focus trapping, Escape, outside click and focus restoration.

Kanit is self-hosted via `@fontsource/kanit` (weights 300–700 and 900), applied globally including scores and form controls. No Google Fonts request is needed.

## Quick scoring flow

Open scoring, choose 10 / 11 / 15 / 16 or Custom (integer 1–999). The board opens immediately with เจ้าบ้าน / ผู้มาเยือน; optional names and singles/doubles are available in Settings. Games require a two-point lead. At a tie one point below the target (for example 15–15 for a 16-point game), each side shows two deuce dots: one lights for a one-point lead and both light for a winning two-point lead. A tie clears both sides. Play continues beyond the target without a score cap. A custom one-point game ends on the first point. Scores can be undone and visual sides swapped.

At the target, the confirmation offers สิ้นสุดการแข่งขัน or ยังไม่สิ้นสุด. Returning to the board allows correction before saving. Confirmed matches create or append to `daily:YYYY-MM-DD` sessions using Asia/Bangkok completion dates and weekday names such as ก๊วนวันเสาร์. Separate calendar dates remain separate even when weekday names match. Incomplete games are not added to history. Legacy sessions and active games remain readable.

Run `node scripts/check-logic.mjs` for scoring, money allocation and daily grouping checks.

## API and database

Start the service in the sibling repository:

```sh
cd ../badminton-services
npm install
npm run dev
```

Then run `npm run dev` in this frontend repository. Vite proxies `/api` to `http://127.0.0.1:3001`, so phone clients on the same Wi-Fi use the same frontend URL without a separate API port. Use `/api/health` to check the database connection. Configure only the backend's ignored `.env` with DATABASE_URL; never put database credentials in Vite environment variables.

History reloads from PostgreSQL on startup, window focus, and every 15 seconds. Score tapping stays local; finishing a match saves to the API with a stable match UUID for safe retries. Expenses and participant mutations wait for the API before updating the UI; stale concurrent edits show a toast and refresh instead of overwriting another device's change.

Legacy `rally-v1` data is preserved. If old local history has not been imported, the History screen offers **นำเข้าประวัติเดิม**. Import merges missing IDs without overwriting existing entries. The online read cache and active game are stored separately under `rally-online-v1`.

For production hosting, proxy `/api` to the backend service (or configure an equivalent same-origin API). Vite's dev proxy is not bundled into static build output. The shared LAN version has no user accounts yet.

## Split-and-pay expenses

The expense screen has one **เพิ่มรายการ** action. Enter the total in THB, player count (1–500), and a PromptPay recipient. Requests are stored in Neon via `POST /api/payment-requests`. Each QR encodes the per-person amount, with separate amount groups when dividing leaves a satang remainder. Each request can be edited or deleted with confirmation. Editing recalculates per-person amounts and QR codes. Legacy expense records can also be edited or deleted.

Payload generation uses `@thai-qr-payment/payload` and rendering uses `qrcode.react`, with a transparent QR background. Run `node scripts/check-payments.mjs` to verify receiver validation, exact satang allocation, PromptPay/bank-account tags and CRC. The generated QR does not verify account ownership or confirm that anyone has paid. Bank-app compatibility and recipient names must be confirmed in the bank app; no real transfers are performed by the app or tests.

## Racket branding and PromptPay-only creation

The header uses `public/images/racket-head-short-shaft.png`; the score setup screen uses `public/images/racket-cutout.png`. Asset source information is in `public/images/README.md`.

New payment requests use PromptPay only: the expense form contains total, player count, and PromptPay number. Bank/method selectors are removed. Previously stored bank-account requests remain readable; no historical payment records are deleted.
