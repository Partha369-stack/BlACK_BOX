# Black Box Project Report

## 1. Executive Summary
**Black Box** is a comprehensive vending machine management application that bridges the physical and digital worlds. It provides a dual-interface system: a **Consumer Interface** for users to browse and purchase items from specific machines, and an **Admin Dashboard** for data-driven management of inventory, machines, and sales. The project leverages **React** for a responsive frontend and **Back4App (Parse)** for a robust, serverless backend.

## 2. Technical Architecture

### 2.1 Frontend
- **Framework**: React (v19) with Vite (v6) for build optimization.
- **Languages**: TypeScript (Types enforced for Products, Cart items).
- **Styling**: Tailwind CSS for a utility-first, modern, and responsive design (Dark mode default "Brand Black").
- **Routing**: React Router DOM (v7) for client-side navigation.
- **Barcode Scanning**: `html5-qrcode` integration for QR code interactions.

### 2.2 Backend (Back4App / Parse)
- **Platform**: Back4App (Managed Parse Server).
- **SDK**: `parse` JavaScript SDK.
- **Database**: MongoDB (hosted via Back4App).
- **Authentication**: Built-in Parse User session management.
- **Services**: Centralized logic in `services/parseService.ts` to handle API calls (CRUD for Products, Machines, Orders).

### 2.3 Key Dependencies
- `react-router-dom`: Navigation and protected routes.
- `@react-oauth/google`: Google OAuth integration.
- `jwt-decode`: Token handling.
- `html5-qrcode`: In-browser QR code scanner.

---

## 3. Comprehensive Feature List

### 3.1 Consumer Interface
The consumer-facing side is designed for speed and ease of use, often triggered via scanning a QR code on a physical machine.

*   **Landing Page**: A high-impact graphical introduction to the brand with "Scan Now" call-to-actions.
*   **QR Scanner Module**: A dedicated camera interface to scan machine QR codes, redirecting users to the specific machine's inventory (Route: `/scanner`).
*   **Digital Product Catalog**:
    *   **Machine-Specific View**: Users see only products available in the specific machine they are interacting with (`/machine/:id`).
    *   **Live Stock Logic**: Prevents adding out-of-stock items; displays "Unavailable" for empty slots.
    *   **Dynamic Cart**: Manages items locally before checkout.
*   **Checkout Flow**: Secure checkout process that validates stock and creates Orders in the database.

### 3.2 Authentication & User Profile
*   **Registration/Login**: Email/Password and Google OAuth support.
*   **Protected Routes**: Security wrappers ensuring only authenticated users access the Profile or Admin sections.
*   **User Profile**:
    *   Personal details management.
    *   **Order History**: View past purchases with status updates.
    *   **Wallet/Payment Methods**: integration points for stored payment details.

### 3.3 Admin Dashboard
A powerful command center for business owners (`/admin`).

*   **Analytics & Overview**: Visual charts (Sales Trends) and KPI cards (Total Revenue, Active Machines, Low Stock Alerts).
*   **Inventory Management**:
    *   Add/Edit/Delete products globally.
    *   Assign products to specific machines.
    *   Stock level adjustments.
*   **Machine Management**:
    *   Monitor status of physical machines (Active/Maintenance/Offline).
    *   View specific sales data per machine.
*   **Sales History**: Comprehensive log of all transactions with filtering capabilities.

### 3.4 Static & informational Pages
Professional standard pages for corporate identity and legal compliance:
*   **Company**: About Us, Careers, Press.
*   **Support**: Help Center (FAQ), Terms of Service, Privacy Policy.

---

## 4. Database Schema (Data Models)

The application uses the following primary Classes in Back4App:

### `User` (Standard Parse User)
*   **Fields**: `username`, `email`, `password`, `is_admin` (boolean), `createdAt`.
*   **Purpose**: Authentication and role management.

### `Product`
*   **Fields**:
    *   `name` (String)
    *   `price` (Number)
    *   `description` (String)
    *   `image` (File/String URL)
    *   `category` (String)
    *   `stock` (Number) - Global or default stock.
*   **Purpose**: Master catalog of all sellable items.

### `Machine`
*   **Fields**:
    *   `location` (String/GeoPoint)
    *   `status` (String: "active", "maintenance")
    *   `machine_id` (String: Unique Identifier e.g., "VM-001")
*   **Purpose**: Represents physical vending units.

### `Order`
*   **Fields**:
    *   `user` (Pointer to User)
    *   `items` (Array of Objects/Pointers)
    *   `total` (Number)
    *   `status` (String: "completed", "pending")
    *   `machine_id` (String)
*   **Purpose**: Transactional records for sales history.

---

## 5. Directory Structure & Key Files

```text
/
├── components/          # React Components
│   ├── AdminDashboard.tsx   # Main Admin Logic
│   ├── ProductCatalog.tsx   # Consumer Shopping Interface
│   ├── Scanner.tsx          # QR Code Scanner
│   ├── services/            # Custom Services
│       └── parseService.ts  # Backend API bridge
├── App.tsx              # Main Routing & Layout
├── tailwind.config.js   # Design System Configuration
└── index.css            # Global Styles & Tailwind Imports
```

## 6. Future Roadmap (Recommended)
*   **Payment Gateway Integration**: Stripe or PayPal integration for real money processing.
*   **Hardware Integration**: API endpoints to signal physical motors in the vending machine to dispense products upon successful backend order creation.
*   **Mobile App**: Wrapping the web app in React Native or Capacitor for store deployment.
