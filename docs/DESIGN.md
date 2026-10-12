# StoreFlow POS: Design Guide

Brand: StoreFlow POS. Tagline: "Scan. Bill. Grow."
Feel: professional, fresh, trustworthy, fast. A premium retail SaaS product. Bright and clean inside the app, bold and cinematic on the landing and login pages.

## Colors (define as CSS variables in client/src/styles/tokens.css, use only these)
- Page background: #F4F7FB. Surface (cards): #FFFFFF. Border: #E3E8F0. Subtle fill: #EEF2F8.
- Ink navy (sidebar, headings, hero background): #0B1B3A. Deep navy 2: #12274F.
- Text: primary #0B1B3A, secondary #53607A, muted #8B96AB.
- Primary teal: #0FA38F. Hover: #0B8A78. Soft tint: #E2F6F3. Glow: rgba(15,163,143,0.35).
- Accent amber/orange (key totals, low stock, highlights only): #FF8A1F. Soft tint: #FFF1E3.
- Status: success #16A34A, warning #F59E0B, danger #E5484D, info #2F6BFF (each with a soft tint background).
- Hero and login-left gradient: linear navy #0B1B3A to deep teal #0B3B4A with a teal radial glow.
- Never use pure gray Tailwind defaults or raw hex in components. Everything comes from tokens.

## Type, shape, depth
- Fonts via @fontsource: "Plus Jakarta Sans" (headings, numbers, 600 to 800) and "Inter" (body). Prices and totals use tabular numbers.
- Radius: 12px inputs and buttons, 18px cards, 24px modals. Shadows: soft layered (0 1px 2px rgba(11,27,58,.06), 0 8px 24px rgba(11,27,58,.08)). Hover shadow stronger with a 2px lift.
- Spacing on an 8px grid. Page padding 24 to 32px. Max content width on wide screens 1440px.
- Icons: lucide-react, 1.75 stroke.

## Logo (create as a reusable React SVG component and as client/public/storeflow-favicon.svg plus 32 and 180 px PNGs, link with ?v=3)
A rounded-square tile with a teal gradient (#14C4AD to #0B8A78), a white shopping bag inside, and the bag handle drawn as a checkmark. Wordmark "StoreFlow" in Plus Jakarta Sans 800, "Store" in navy, "Flow" in teal. A small "POS" badge in amber. Title: "StoreFlow POS | Scan. Bill. Grow."

## Motion rules
Smooth and purposeful (200 to 400ms, ease-out springs). Page transitions fade + rise. Lists stagger in. Buttons press down slightly. Numbers count up. Respect prefers-reduced-motion. The POS checkout screen stays fast: no heavy 3D there.

## 3D (react-three-fiber, lazy loaded, clamp pixel ratio, graceful fallback, simplified on mobile)
- Landing hero and login-left: floating glossy product boxes and a stylized POS terminal made from primitives, a teal laser scan beam sweeping across a barcode, soft particles, gentle bloom, mouse parallax.
- Dashboard stat cards and product cards: CSS 3D tilt on hover with a soft glare. No heavy WebGL inside the app pages.

## App shell (all logged-in pages)
- Sidebar (navy #0B1B3A, 264px, collapses to 80px): logo at top, nav items with icons (Dashboard, POS Checkout, Products, Inventory, Sales History, Users, Profile) filtered by role, active item = teal soft pill with a glowing left bar that glides between items, hover highlight, tooltips when collapsed, user card (avatar, name, role) above Logout at the bottom.
- Top bar (white, 72px, bottom border): page title with breadcrumb, live date and time, store name chip (from Settings API), avatar menu (Profile, Logout). Subtle shadow.
- Content area on #F4F7FB. Cards are white with soft shadows.

## Landing page (route "/")
1. Sticky navbar: logo, links (Home, Features, How it works, Contact), "Login" teal button. Becomes white glass with shadow after scrolling.
2. Hero (navy to teal gradient, full viewport): left = small pill "Retail checkout, simplified", headline "Checkout in seconds. Stock always right.", subtext explaining scan, bill, pay, live inventory, two buttons (Login primary, See features secondary). Right = the 3D scene. Scroll indicator.
3. Features: 4 glass-white cards with icons (Fast checkout, Live inventory, Sales insights, Secure roles), tilt on hover, reveal on scroll.
4. How it works: 3 steps (Scan, Bill and pay, Stock updates automatically) connected by an animated line.
5. Roles: Admin and Cashier cards listing what each can do (from the project requirements).
6. Contact section with a simple contact block (no fake testimonials, no fake statistics).
7. Footer: logo, links, "Built with the MERN stack".

## Login page (route "/login")
Split screen. Left 55% = navy-teal gradient with the 3D scene and brand copy ("Scan. Bill. Grow."). Right 45% = white background with a centered card (max 420px): logo, "Welcome back", subtitle, Email input (icon), Password input (icon, show/hide), "Remember me" checkbox, big teal "Sign in" button with loading spinner, validation messages under fields, backend error banner ("Invalid email or password"), note "Need access? Contact your store admin". On mobile the 3D panel collapses to a slim branded header.

## Dashboard (route "/dashboard")
- Greeting row: "Good morning, {name}" with date, and quick action buttons (New sale, Add product for admin).
- 4 stat cards (white, 18px radius, icon tile with soft color, big count-up number, small label): Total Products, Today's Sales (in rupees), Total Transactions, Low Stock Products (amber). 3D tilt on hover. Only show a trend if computed from real data.
- Row 2: Sales Overview area chart (teal line, soft teal gradient fill, 7 / 30 day switch, tooltips) taking 2/3 width; Payment methods donut (Cash, Card, UPI) taking 1/3.
- Row 3: Top Selling Products (horizontal bars, teal), Low Stock list (amber badges, "Restock" link for admin), Recent Transactions table (id, time, amount, method pill).
- All values from MongoDB aggregation endpoints. Skeleton loaders while loading. Empty states like "No sales yet" with a friendly SVG illustration. Cashier sees only their own stats.

## POS Checkout (route "/pos"), the hero screen
- Layout: left area (flex) for scanning and products; right fixed 400px "Current Sale" panel, full height, sticky.
- Left top: big scan bar (white, 56px high, barcode icon, teal focus ring, animated teal scan-line while focused, shortcut hint F2, camera button). Enter on a barcode adds the product via the barcode API. "Product not found" gives a gentle shake and a red toast.
- Category chips with counts and an animated sliding teal indicator.
- Product grid (4 columns desktop, 3 tablet, 2 mobile): white cards with image area (or colorful initial placeholder), name, price in teal bold, stock pill (In stock green, Low amber, Out red), round teal "+" button. Hover = lift + slight 3D tilt. Click = small image flies to the cart and the cart count bumps. Out-of-stock cards are dimmed.
- Right panel top: "Current Sale" with a live clock and cashier name. Middle: cart lines (thumbnail, name, unit price, quantity stepper, line total, remove), animated in/out; empty state with illustration "Scan a product to begin". Summary: Subtotal, Tax (rate from Settings), Discount (flat or percent input), a divider, GRAND TOTAL in large amber-accent navy numbers with a number ticker. Payment: three selectable tiles (Cash, Card, UPI) with a teal selected state; Cash shows amount received, quick chips (Exact, +100, +500, +2000) and live Change. Big full-width teal "Complete Sale  ₹total" button (disabled until valid, loading state, double-click protection). Secondary "Clear cart".
- Shortcuts: F2 focus scan, F8 clear cart, F9 complete sale, Esc close modal.
- After success: full-screen overlay with a drawing green checkmark and confetti, then the Receipt modal slides in like paper.
- Receipt modal: white paper look with zigzag top and bottom edges, store name and address, transaction id, date/time, cashier, items table, subtotal, tax, discount, grand total, payment method, amount received and change, barcode of the transaction id, thank-you line, Print and Close buttons, print-only stylesheet for receipt width.

## Products (route "/products", admin)
Page header (title, count, "Add product" teal button). Filter bar card (search, category select, status select). Table card: image, name, barcode (monospace), category pill, price, stock with status pill, actions (edit, delete). Pagination. "Add / Edit product" opens a right slide-over panel with the form (name, barcode with a Generate button, category, price, stock, low stock threshold, image upload with preview), inline validation, success toast. Delete uses a confirm dialog. Skeletons and empty state with "Add your first product".

## Inventory (route "/inventory", admin)
Top: 3 clickable summary cards (In stock, Low stock, Out of stock) that filter the table. Table: product, category, stock with a progress bar relative to threshold, status pill, last updated, "Adjust" button (modal: add, remove or set, required reason, never negative). Row click opens a drawer with the real stock movement history timeline.

## Sales History (route "/sales")
Filter bar: search by transaction id, date range, payment method, cashier (admin only). Table: transaction id (monospace), date and time, items count, total, payment pill, cashier. Row click opens a right drawer with the full receipt and a Reprint button. Cashiers only see their own sales. Pagination, skeletons, empty state.

## Users (route "/users", admin)
Header with "Add user" button. Table: avatar with initials, name, email, role pill (Admin navy, Cashier teal), status toggle (Active / Disabled), actions (edit, reset password). Add/Edit in a modal with validation. An admin cannot disable or demote themselves.

## Profile (route "/profile")
A banner card with a gradient header, large avatar with initials, name, email, role pill, member since. Two cards below: Edit profile and Change password (current password required). Logout button.

## 404 and Access Denied
Centered friendly SVG illustration, clear message, button back to dashboard.

## Responsive and accessibility
Desktop, tablet and mobile layouts. On mobile the sidebar becomes a slide-in drawer and the POS cart becomes a bottom sheet with a sticky total bar. Visible focus rings, labels, aria attributes, AA color contrast, keyboard navigation.
