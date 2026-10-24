# Antigravity prompt — reproduce the exact login design

You are working in my existing Operations & Examination Management Portal codebase. I am using Claude Sonnet 4.6. The attached image `reference.png` is the source of truth for the login page design. I also provide a component kit in this ZIP.

## Goal
Recreate the reference as closely as possible in the existing app: a premium, futuristic, enterprise login page with a dark navy/teal background, cyan glow, India dotted-map illustration, animated-looking flowing wave lines along the bottom, a left-side branding/content area, and a large glassmorphism login card on the right.

## First: inspect, don't blindly replace
1. Inspect the repository and identify its framework, app-router/routing setup, styling system, global CSS, existing logo/assets, authentication flow, and current login route.
2. Reuse the project's existing stack and conventions. Do not migrate frameworks or replace authentication.
3. Inspect the supplied `src/components` and `src/index.css`; adapt them to the actual repo structure.
4. Before editing, briefly list the files you intend to change. Then implement the page.

## Visual requirements — match the reference
- Full-viewport desktop composition, approximately 16:9, no unwanted page scrollbar at 100% zoom.
- Background: deep midnight navy/teal gradient, subtle cyan/blue light bloom at upper corners.
- Left area:
  - Top-left compact layered geometric logo and text “Operations & Examination Management Portal”.
  - Large two-line heading: “Operations & Examination” in white and “Management Portal” in bright cyan.
  - Supporting copy: “A unified platform to manage projects, centres, bookings, audits, operations and financial workflows for examination operations.”
  - A luminous dotted map of India around the middle-left, with cyan network nodes and connecting arcs. Prefer a locally bundled SVG/CSS illustration or a suitable project asset; do not hotlink an image.
  - Six dark translucent rounded feature tiles: Projects, Centres, Audits, Documents, Finance, Reports, with thin cyan line icons.
- Right login card:
  - Tall, large, rounded glass panel with thin bright cyan outline and subtle outer glow; transparent dark navy fill and backdrop blur.
  - Centered logo at top and portal name.
  - “Welcome Back” heading and “Sign in to your account to continue”.
  - Username or Email input with user icon.
  - Password input with lock icon and functional show/hide toggle.
  - Remember me checkbox on left and Forgot Password? link on right.
  - Wide cyan gradient Sign In button with dark text and right arrow.
  - Divider and “Secure & Role-Based Access” note.
  - Six compact role badges: Admin, PM, Auditor, Operations, Finance, Centre; each with a suitable icon and restrained accent color.
- Use Lucide icons if already available; otherwise install `lucide-react` only if package policy allows, or use the existing icon library.
- Typography should be clean and modern, with strong hierarchy, readable contrast, consistent spacing, and no overly bulky elements.

## Responsive requirements
- Desktop: preserve the split composition and visual balance of the reference.
- Tablet: reduce spacing and card width gracefully.
- Mobile: stack branding and form, hide or simplify the map and wave decoration, keep form fields and buttons full width, prevent horizontal overflow, and ensure all controls remain usable.
- Respect `prefers-reduced-motion`.

## Functional requirements
- Inputs must be real controlled or properly managed form inputs.
- Password visibility toggle must work.
- Remember-me checkbox must work.
- Forgot Password must route to the existing reset-password flow if one exists; otherwise show a clear TODO without inventing a route.
- Submit should use the existing authentication provider/API and display loading and error states. Do not fake a successful login.
- Preserve existing role-based access control; role badges are informational only and must not allow users to select or spoof a role.
- Add keyboard focus states, accessible labels, appropriate autocomplete attributes, and semantic form markup.
- Never store raw passwords in localStorage/sessionStorage or logs. Do not hardcode credentials or secrets.

## Quality checks
- Run the project's lint/typecheck/build scripts if available and fix issues caused by your changes.
- Check desktop and mobile widths and confirm no horizontal overflow.
- Ensure there are no missing icon exports, broken imports, console errors, or placeholder API responses.
- Do not edit unrelated pages or business logic.
- When done, report exact changed files, how the auth submit connects to the existing backend, and any remaining TODOs.

The final result should be visually very close to `reference.png`, not merely a generic dark login page. Prioritize accurate layout, spacing, color, glowing border, map/network motif, cyan wave lines, and the exact wording above.
