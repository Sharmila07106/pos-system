# StoreFlow - Multi-Tenant Supermarket SaaS & POS System

StoreFlow is a multi-tenant retail point-of-sale (POS) and inventory management SaaS platform designed for modern supermarkets and retail stores. Built on the MERN stack (React 18 + Vite, Node.js + Express, MongoDB + Mongoose), StoreFlow features strict tenant isolation, role-based dashboards, high-speed barcode checkout, offline transaction resilience, and comprehensive store auditing.

---

## Architecture & System Overview

- **Multi-Tenant SaaS**: Every store operates in its own isolated tenant boundary. All product catalogs, inventory movements, sales transactions, and staff records are strictly scoped by `storeId` extracted securely from verified JWT tokens on the server.
- **Tenant Lifecycle**: Supermarket registration generates a store in `PENDING` status. Access is strictly blocked across all store APIs until approved by the Platform Super Admin (`ACTIVE`). Suspended or rejected stores are blocked immediately.
- **Atomic Stock Management**: Checkout transactions validate stock on the server and decrement inventory atomically with `findOneAndUpdate` conditional guards or MongoDB ACID transactions.

---

## Role Matrix & Access Control

| Feature / Permission | Platform Super Admin | Store Admin (`STORE_ADMIN`) | Cashier (`CASHIER`) |
| :--- | :---: | :---: | :---: |
| **Platform Store Approvals** |  Full Access |  Blocked (403) |  Blocked (403) |
| **Store KPI Dashboard & Revenue** |  Blocked (Tenant isolate) |  Full Access |  Blocked (403) |
| **Staff Invites & Staff Limits** |  Blocked |  Full Access |  Blocked (403) |
| **Product View / Add / Edit** |  Blocked |  Full Access |  Full Access |
| **Product Delete** |  Blocked |  Full Access |  Blocked (403) |
| **Stock Adjustments & Inward** |  Blocked |  Full Access |  Full Access |
| **POS Terminal & Checkout** |  Blocked |  Blocked |  Full Access |
| **Bill Hold / Resume (F4)** |  Blocked |  Blocked |  Full Access |
| **Sales History & Z-Report** |  Blocked |  Full Access + Refunds |  Own Bills Only |
| **Tax / GST & Receipt Settings** |  Blocked |  Full Access |  Blocked (403) |

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

## Run Locally

### 1. Prerequisites
- Node.js (v20+)
- MongoDB running locally on `127.0.0.1:27017` or a MongoDB Atlas URI

### 2. Install & Start
```bash
# Install all dependencies (root, server, and client)
npm run install:all

# Seed initial database (Super Admin, Ram Store, Cashier, Products, Bills)
npm run seed:all --prefix server

# Run backend (port 5090) and frontend (port 5190/5191) concurrently
npm run dev
```
- **Frontend App**: `http://localhost:5190`
- **Backend API**: `http://localhost:5090`
- **Health Check**: `http://localhost:5090/api/health`

---

## Free Cloud Deployment

StoreFlow is pre-configured for **100% free cloud deployment**:
- **Database**: MongoDB Atlas (Free M0 Cluster)
- **Backend API**: Render (Free Web Service via `render.yaml`)
- **Frontend SPA**: Vercel (Free Hobby Plan via `client/vercel.json`)

👉 **See the complete step-by-step click guide in [DEPLOY.md](DEPLOY.md)**.

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
