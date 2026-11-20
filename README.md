# HamroGadget — Nepal's Premier Tech & Gadget Storefront

A modern, responsive consumer electronics storefront designed with a **Bento Grid** layout, comprehensive category filtering, real NPR pricing, and a secure admin management portal.

---

## 🚀 Quick Start / How to Run

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm (included with Node.js)

### Steps to Run

1. **Open your terminal or PowerShell** and navigate to the project folder:
   ```bash
   cd "c:\Users\aayus\Downloads\jarvis-main\hamrogadget"
   ```

2. **Install dependencies** (if not already installed):
   ```bash
   npm install
   ```

3. **Start the application server**:
   ```bash
   npm start
   ```
   *(or `node server.js`)*

4. **Open your browser** and visit:
   ```
   http://localhost:5000
   ```

---

## 🔐 Admin Portal Credentials

- **Admin URL**: Click the **"Admin"** button in the header or navigate directly to `http://localhost:5000/#/admin`
- **Email**: `admin12@gmail.com`
- **Password**: `admin12@`

> **Security Note**: Password is encrypted using **bcryptjs** on the server. Admin sessions are authenticated via JWT (JSON Web Tokens) with a 24-hour expiration and protected with rate-limiting on login attempts.

---

## 🌟 Key Features

### 1. Bento Grid Architecture
- **Hero Mosaic**: 12-column CSS Grid with modular 2x2 featured flagship card, staggered fade-up animations, and category spotlights.
- **Micro-interactions**: Subtle hover lifts, floating hero animation, smooth transitions, and skeleton/lazy loading.
- **Dark & Light Mode**: Persistent theme switcher with high-contrast WCAG AA palette.

### 2. Category Browsing & Real-time Filters
- Categories: **Laptops, Phones, Headphones, Smartwatches, Accessories, Other Tech**.
- Dynamic filters: Live search, Brand chips, NPR price slider/range, and Stock availability.
- URL-synced filter state: Shareable URLs and full browser back/forward support.
- Comprehensive Product Detail view: Multi-image thumbnail gallery, specifications table, key highlights, and related products.

### 3. Dynamic Admin Catalog Management
- **Add / Edit Product Modal**:
  - Required fields: Name, Brand, Category, Price in NPR, Stock status, Short Description, Image URLs.
  - Category-aware dynamic spec fields (Processor, RAM, Battery, Camera, etc. adapt to the selected category).
  - Multi-image URL manager & Key highlight builder.
- **Quick Catalog Controls**: Instant 1-click toggles for Stock Status (*In Stock / Pre-Order / Out of Stock*) and Featured banner (*★ Featured / ☆ Standard*).
- **Search & Delete**: Live table search and safe confirmation delete.

---

## ⚙️ Environment Variables (Optional)

You can set these in your `.env` file or environment:

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `PORT` | `5000` | Port for Express server |
| `JWT_SECRET` | `HG_JWT_SECRET_2026` | Secret key used to sign Admin JWTs |

---

## 📂 How to Add a New Category

To add a new category (e.g. *Gaming Consoles* or *Cameras*):

1. **Update `server.js`**:
   In the `/api/categories` route handler:
   ```javascript
   app.get('/api/categories', (req, res) => {
     res.json(['Laptops', 'Phones', 'Headphones', 'Smartwatches', 'Accessories', 'Gaming Consoles', 'Other Tech']);
   });
   ```

2. **Update `public/index.html`**:
   Add the nav link inside `<ul class="nav-links">` and `<ul class="drawer-links">`:
   ```html
   <li><a href="#/category/Gaming%20Consoles" class="nav-link" data-nav="Gaming Consoles">Gaming</a></li>
   ```

3. **Update `public/js/app.js`**:
   Add an SVG icon to `CategoryIcons` and add spec fields to `getSpecFieldsForCategory()`:
   ```javascript
   case 'Gaming Consoles':
     return [
       { key: 'storage', label: 'Storage Capacity', val: currentSpecs.storage || '' },
       { key: 'resolution', label: 'Resolution (4K/8K)', val: currentSpecs.resolution || '' },
       { key: 'controllers', label: 'Included Controllers', val: currentSpecs.controllers || '' }
     ];
   ```
