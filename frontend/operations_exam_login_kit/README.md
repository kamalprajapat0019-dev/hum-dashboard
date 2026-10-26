# Operations & Examination Management Portal — Login UI Kit

This kit contains reusable React + Tailwind CSS components to recreate the provided login-page reference.

## Components
- `src/components/PortalLoginPage.jsx` — full responsive page layout
- `src/components/BrandLogo.jsx` — compact layered logo mark
- `src/components/FeatureTile.jsx` — Projects/Centres/Audits/Documents/Finance/Reports tile
- `src/components/RoleBadge.jsx` — Admin/PM/Auditor/Operations/Finance/Centre badge
- `src/index.css` — background gradients, wave lines, glow, and form styling
- `ANTIGRAVITY_PROMPT.md` — ready-to-paste prompt for Claude Sonnet 4.6
- `reference.png` — the user's provided visual reference

## Dependencies
Use the existing project dependencies if present. The example expects:
- React
- Tailwind CSS
- `lucide-react`

If `lucide-react` is not installed, install it with:
`npm install lucide-react`

## Integration
1. Copy the `src/components` folder into your app's source tree.
2. Merge `src/index.css` into your global stylesheet, or import it from the page.
3. Render `<PortalLoginPage />` from your existing login route.
4. Replace the demo `onSubmit` with your existing authentication API and validation.
5. Keep your existing routing, auth provider, and environment configuration. Do not expose secrets in frontend code.

The components are UI scaffolding, not a complete authentication backend. The sign-in action currently validates that both fields are filled and displays a demo message.
