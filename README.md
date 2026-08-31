<div align="center">

# 🚗 AutoGenuine — Genuine OEM Parts & E-Commerce Platform

**A Next-Generation OEM Automotive Parts E-Commerce Platform & Autonomous AI Store Management System**

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg?style=flat-square&logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v18.3-blue.svg?style=flat-square&logo=react)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green.svg?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![Stripe](https://img.shields.io/badge/Stripe-Live%20Payments-purple.svg?style=flat-square&logo=stripe)](https://stripe.com)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-AI%20Assistant-orange.svg?style=flat-square&logo=google)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-MIT-brightgreen.svg?style=flat-square)](LICENSE)

---

</div>

## 📌 Overview

**AutoGenuine** is an enterprise-grade, full-stack e-commerce platform and store management suite built specifically for local and nationwide automotive spare parts distributors. 

It pairs a high-performance **React + Vite** customer storefront with a real-time **Node.js / Express / MongoDB** backend, featuring an **AI-powered Store Manager**, **AutoPilot order verification**, **1-Click storewide flash sales**, **live Socket.IO updates**, and **Stripe card payments**.

---

## ✨ Key Features

### 🛍️ Customer Storefront & Vehicle Finder
- **🚗 Year-Make-Model Vehicle Compatibility Finder:** Live autocomplete search matching exact vehicle models (e.g. *Toyota Camry 2015–2020*, *Suzuki Alto 660cc*).
- **🏷️ Strikethrough Promotional Pricing:** High-visibility MSRP cutoff pricing (`~Rs 25,000~` **Rs 21,250**) with animated discount badges (`-15% OFF`).
- **🌐 Multi-Currency & Regional Localization:** Real-time price formatting supporting PKR (`Rs`), USD (`$`), and multi-regional currencies.
- **🛒 Interactive Cart & Checkout:** Floating cart drawer with live stock validation, itemized discount summaries, and instant checkout.

### 💳 Payments & Order Management
- **💳 Stripe Payment Gateway:** Secure 3D-Secure credit/debit card checkout via Stripe PaymentIntents & Webhooks.
- **💵 Local Payment Support:** Cash on Delivery (COD), Direct Bank Transfers, EasyPaisa, and JazzCash workflows.
- **🧾 Instant PDF Invoicing & Receipts:** Automated vector PDF generation for invoices, order slips, and executive summaries.

### 🤖 AI Store Manager & AutoPilot Operations
- **🤖 Autonomous Customer Concierge:** Google Gemini AI assistant providing 24/7 technical compatibility support in English & Urdu.
- **📊 Executive AI Store Manager:** Virtual COO for store owners—analyzes inventory, detects low stock, and suggests price updates via 1-tap **[Approve]** / **[Reject]** proposal cards.
- **⚡ AutoPilot Away Mode:** Autonomous order verification and dispatch alerts for pending orders when staff are offline.

### ⚡ Staff Operations & Real-Time Dashboard
- **🔔 Live Socket.IO Broadcasts:** Real-time sound chimes and header alerts when customers place orders or request live chat support.
- **🔥 1-Click Storewide Flash Sale Manager:** Store owners can launch or clear storewide promotional sales (10%, 12%, 15%, 20% OFF) with a single click.
- **👥 Role-Based Access Control (RBAC):** Tiered permissions for **Primary Owner**, **Admins**, and **Customers**.

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework:** React 18 (Vite 8 SPA)
- **Styling:** Tailwind CSS + Vanilla CSS Transitions
- **Icons:** Lucide React
- **Real-Time:** Socket.io Client
- **PDF Generation:** jsPDF + autoTable

### **Backend**
- **Runtime:** Node.js (ES Modules)
- **Web Framework:** Express.js
- **Database:** MongoDB + Mongoose ODM
- **Real-Time Engine:** Socket.IO
- **AI Integration:** Google Gemini API (`@google/genai`)
- **Payments:** Stripe Node SDK (`stripe`)
- **Email Dispatch:** Nodemailer (SMTP Gmail Integration)

---

## 🚀 Quick Start & Local Installation

### Prerequisites
- [Node.js](https://nodejs.org/) v18.0 or higher
- [MongoDB Atlas](https://www.mongodb.com/) cluster URI or local MongoDB instance

### 1. Clone Repository
```bash
git clone https://github.com/sammemon/AutoGenuine.git
cd AutoGenuine
```

### 2. Install Dependencies
Install both root frontend and server dependencies:
```bash
# Install frontend dependencies
npm install

# Install backend server dependencies
cd server
npm install
cd ..
```

### 3. Environment Setup
Create a `.env` file inside the `server/` directory:
```bash
cp server/.env.example server/.env
```

Configure your credentials inside `server/.env`:
```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?appName=Cluster0
JWT_SECRET=your_jwt_secret_key
PORT=5000
FRONTEND_URL=http://localhost:5173

# Staff Account Seeding Credentials
OWNER_NAME=Store Owner
OWNER_EMAIL=owner@example.com
OWNER_PASSWORD=your_owner_password

ADMIN_NAME=Store Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_admin_password

# Stripe Credentials
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3.5-flash

# SMTP Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASS="your_app_password"
EMAIL_FROM="AutoGenuine Parts <no-reply@example.com>"
```

### 4. Seed Initial Catalogue & Accounts
```bash
cd server
npm run seed
cd ..
```

### 5. Run Local Development Server
Start both backend API server and frontend SPA concurrently:

```bash
# Terminal 1: Backend API Server (Port 5000)
cd server
npm run dev

# Terminal 2: Frontend Vite App (Port 5173)
npm run dev
```

Open your browser at `http://localhost:5173`.

---

## 📁 Repository Structure

```
AutoGenuine/
├── public/                     # Static assets & OEM category images
├── src/                        # React Frontend Source
│   ├── auth/                   # RBAC permissions logic
│   ├── components/             # Reusable UI components & modals
│   │   ├── chat/               # Support chat workspace components
│   │   └── dashboard/          # Owner & Admin panel sections
│   ├── context/                # Multi-Context state providers
│   ├── data/                   # Initial fallback catalogues
│   ├── pages/                  # Route views (Home, Category, Dashboard)
│   ├── services/               # Frontend API client
│   └── utils/                  # Invoice PDF & Auth utilities
├── server/                     # Express Node.js Backend Source
│   ├── config/                 # DB connection configuration
│   ├── controllers/            # Business logic controllers
│   ├── middleware/             # Express Auth, Upload & Logger middleware
│   ├── models/                 # Mongoose schemas (Users, Orders, Parts)
│   ├── routes/                 # Express REST API routes
│   ├── services/               # Gemini AI, Stripe, Email & Notification services
│   ├── seed.js                 # Database seed script
│   └── server.js               # Express app entry point
├── .gitignore                  # Git exclusion rules
├── package.json                # Root package configuration
├── tailwind.config.js          # Tailwind CSS theme configuration
└── vite.config.js              # Vite build configuration
```

---

## 📑 Core API Reference Summary

| Domain | Route | Method | Description | Access |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | `/api/auth/login` | `POST` | User & Staff authentication | Public |
| **Auth** | `/api/auth/register` | `POST` | Customer registration | Public |
| **Catalog** | `/api/catalog/parts` | `GET` | List OEM parts with compatibility filter | Public |
| **Catalog** | `/api/catalog/categories` | `GET` | List catalog categories | Public |
| **Orders** | `/api/orders` | `POST` | Place a new parts order | Authenticated |
| **Orders** | `/api/orders/track/:ref` | `GET` | Live public order tracking | Public |
| **Payments** | `/api/payments/create-intent` | `POST` | Generate Stripe PaymentIntent | Authenticated |
| **Chat** | `/api/chat/support/message` | `POST` | Send message to AI Support Concierge | Authenticated |
| **Admin** | `/api/admin/orders` | `GET` | Staff order management | Admin/Owner |
| **Admin** | `/api/admin/promotions/apply-campaign` | `POST` | 1-Click Storewide Flash Sale launch | Admin/Owner |
| **AI Manager**| `/api/admin/ai-manager/chat` | `POST` | Executive AI Store Manager workspace | Owner Only |

---

## 🔒 Security & Privacy

- **Protected Secrets:** `.env` secret files are strictly excluded from version control.
- **Password Security:** Salted `bcryptjs` password hashing (10 rounds).
- **Session Security:** Stateless JWT authentication tokens.
- **Payment Compliance:** Stripe hosted & PaymentIntent elements ensuring zero PCI data touches local servers.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

Developed with ❤️ by **[sammemon](https://github.com/sammemon)**.
