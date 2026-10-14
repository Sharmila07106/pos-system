# StoreFlow - Multi-Tenant Supermarket SaaS & POS System

StoreFlow is a multi-tenant retail point-of-sale (POS) and inventory management SaaS platform designed for modern supermarkets and retail stores. Built on the MERN stack (React 18 + Vite, Node.js + Express, MongoDB + Mongoose), StoreFlow features strict tenant isolation, role-based dashboards, high-speed barcode checkout, offline transaction resilience, and comprehensive store auditing.

---

## Architecture & System Overview

- **Multi-Tenant SaaS**: Every store operates in its own isolated tenant boundary. All product catalogs, inventory movements, sales transactions, and staff records are strictly scoped by `storeId` extracted securely from verified JWT tokens on the server.
- **Tenant Lifecycle**: Supermarket registration generates a store in `PENDING` status. Access is strictly blocked across all store APIs until approved by the Platform Super Admin (`ACTIVE`). Suspended or rejected stores are blocked immediately.
- **Atomic Stock Management**: Checkout transactions validate stock on the server and decrement inventory atomically with `findOneAndUpdate` conditional guards or MongoDB ACID transactions.

---

## Role Matrix & Access Control

| Feature / Permission | Platform Super Admin | Store Admin (`store_admin`) | Inventory Manager (`inventory_manager`) | Cashier (`cashier`) |
| :--- | :---: | :---: | :---: | :---: |
| **Platform Store Approvals** |  Full Access |  Blocked (403) |  Blocked (403) |  Blocked (403) |
| **Store KPI Dashboard & Revenue** |  Blocked (Tenant isolate) |  Full Access |  Blocked (403) |  Blocked (403) |
| **Staff Invites & Staff Limits** |  Blocked |  Full Access |  Blocked (403) |  Blocked (403) |
| **Product CRUD & Pricing** |  Blocked |  Full Access |  Full Access |  Read-Only (POS lookup) |
| **Stock Adjustments & Movements** |  Blocked |  Full Access |  Full Access |  Automatic via Sale |
| **POS Terminal & Checkout** |  Blocked |  Blocked |  Blocked |  Full Access |
| **Bill Hold / Resume (F4)** |  Blocked |  Blocked |  Blocked |  Full Access |
| **Sales History & Z-Report** |  Blocked |  Full Access + Refunds |  Blocked (403) |  Own Bills Only |
| **Tax / GST & Receipt Settings** |  Blocked |  Full Access |  Blocked (403) |  Blocked (403) |

---

## POS Keyboard Shortcuts (Cashier Terminal)

The Cashier POS terminal is optimized for high-speed counter checkout and USB barcode scanners:

| Shortcut | Action | Description |
| :--- | :--- | :--- |
| <kbd>F2</kbd> | **Focus Search** | Automatically focuses the barcode/search input for instant barcode scanning. |
| <kbd>F4</kbd> | **Hold / Resume Bill** | Holds current cart in local memory to serve next customer, or resumes held bills. |
| <kbd>F8</kbd> | **Quick Pay: Cash** | Selects Cash payment tender and opens checkout confirmation. |
| <kbd>F9</kbd> | **Quick Pay: UPI / Card** | Selects UPI / Card digital payment tender. |
| <kbd>Esc</kbd> | **Clear / Dismiss** | Dismisses open modals or prompts to clear active checkout cart. |

---

## Offline Resilience & Thermal Printing

- **Barcode Auto-Lookup**: USB barcode scanners inputting digits followed by `Enter` are intercepted to automatically look up products by barcode/SKU and increment quantities.
- **Offline Transaction Queue**: When network connectivity drops, pending sales are queued in `localStorage` and automatically synchronized when the connection returns.
- **Held Bills Buffer**: Multiple customer baskets can be held in local storage and resumed at any time without losing items or applied discounts.
- **Receipts & Z-Reports**: Supports both 58mm and 80mm thermal receipt formats, formatted text slips, and End-of-Day Daily Closing (Z-Report) audits.

---

## Setup Instructions

### 1. Prerequisites
- Node.js (v18+)
- MongoDB (Local instance or MongoDB Atlas cluster)

### 2. Install Dependencies
```bash
npm run install:all
```

### 3. Environment Variables
Create a `server/.env` file with the following variables:
```env
PORT=5090
MONGODB_URI=mongodb://localhost:27017/storeflow
JWT_SECRET=super_secret_jwt_key_storeflow_2026
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5190
PLATFORM_SUPER_ADMIN_PASSWORD=change_this_to_a_secure_password
```

Create a `client/.env` file (optional, defaults to port 5190):
```env
VITE_API_URL=http://localhost:5090/api
```

### 4. Running the Development Servers
```bash
npm run dev
```
- **Client**: `http://localhost:5190`
- **Backend API**: `http://localhost:5090`

---

## Test Verification

Run all multi-tenant security, authentication, and integration test suites:
```bash
npm test --prefix server
```

Run client production build verification:
```bash
npm run build --prefix client
```
