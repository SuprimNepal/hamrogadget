# HamroGadget — PHP, JavaScript, HTML, CSS & MySQL (XAMPP Edition)

Nepal's premier electronics storefront rebuilt with **PHP, Vanilla JavaScript, semantic HTML5, CSS3 (Bento Grid design), and MySQL (MariaDB)**, ready to run directly on **XAMPP Localhost**.

---

## 🚀 Quick Start Guide for XAMPP

### Step 1: Move Project to XAMPP `htdocs`
Copy the `hamrogadget_php` folder into your XAMPP web root directory and rename it to `hamrogadget`:
```
C:\xampp\htdocs\hamrogadget
```

### Step 2: Start Apache and MySQL
1. Open the **XAMPP Control Panel**.
2. Click **Start** next to **Apache**.
3. Click **Start** next to **MySQL**.

---

### Step 3: Setup the Database (Two Easy Options)

#### Option A: 1-Click Automated Web Setup (Recommended)
Open your web browser and go to:
```
http://localhost/hamrogadget/database/setup_db.php
```
This automatically:
- Creates the `hamrogadget_db` database.
- Builds all tables (`admins`, `users`, `products`, `scraped_media`).
- Seeds the administrator account, demo member, all 20 curated Nepali tech products, and 1,000+ scraped gadget images.

#### Option B: phpMyAdmin Manual Import
1. Open [http://localhost/phpmyadmin](http://localhost/phpmyadmin).
2. Click **New** on the left sidebar to create a database.
3. Database name: `hamrogadget_db`, Collation: `utf8mb4_unicode_ci`, click **Create**.
4. Select `hamrogadget_db` from the left menu.
5. Click the **Import** tab at the top.
6. Click **Choose File** and select `database/database.sql` from the project folder.
7. Scroll down and click **Import** (or **Go**).

---

### Step 4: Open HamroGadget in Your Browser
Visit:
```
http://localhost/hamrogadget/
```

---

## 🔐 Credentials & Authentication Flow

### 1. Admin Account (Direct Redirection to Admin Panel)
- **Email:** `admin12@gmail.com`
- **Password:** `admin12@`
- *When entering these credentials on the "Log In" modal, the system immediately recognizes the admin role and redirects you to the Admin Panel (`#/admin`).*

### 2. Demo Regular Member Account
- **Email:** `member@gmail.com`
- **Password:** `member12@`

### 3. User Sign Up Flow
- Visitors can click the **Sign Up** button in the navbar.
- Fill in Name, Email, and Password (min. 6 characters).
- Upon submission, the account is stored securely in MySQL (`users` table) with bcrypt hashing (`password_hash()`).
- The page displays a success modal pop-up: **"Account Created Successfully! 🎉"** with a **"Proceed to Log In"** button. The user is not auto-logged in.
- After logging in, the user avatar and profile menu appear in the top bar.

---

## 🗄️ Database Schema (`hamrogadget_db`)

### 1. `admins` Table
Stores administrator credentials:
| Column | Type | Description |
|---|---|---|
| `id` | VARCHAR(36) PK | UUID identifier |
| `name` | VARCHAR(100) | Administrator display name |
| `email` | VARCHAR(191) UNIQUE | Admin login email |
| `password` | VARCHAR(255) | Bcrypt hashed password |
| `created_at` | DATETIME | Timestamp |

### 2. `users` Table
Stores registered customer accounts:
| Column | Type | Description |
|---|---|---|
| `id` | VARCHAR(36) PK | UUID identifier |
| `name` | VARCHAR(100) | User full name |
| `email` | VARCHAR(191) UNIQUE | Account email |
| `password` | VARCHAR(255) | Bcrypt hashed password |
| `role` | VARCHAR(20) | User role (`user`) |
| `created_at` | DATETIME | Registration timestamp |

### 3. `products` Table
Stores all catalog items with full specifications and features:
| Column | Type | Description |
|---|---|---|
| `id` | VARCHAR(36) PK | Product UUID |
| `name` | VARCHAR(255) | Product name |
| `brand` | VARCHAR(100) | Brand (Apple, Samsung, etc.) |
| `category` | VARCHAR(100) | Category (Laptops, Phones, etc.) |
| `price` | DECIMAL(12,2) | Price in Nepali Rupees (NPR) |
| `discount_price` | DECIMAL(12,2) | Sale/discount price (optional) |
| `images` | LONGTEXT | JSON array of image URLs |
| `short_description`| TEXT | Summary description |
| `specs` | LONGTEXT | JSON key-value specifications |
| `features` | LONGTEXT | JSON array of feature highlights |
| `availability` | VARCHAR(50) | In Stock / Pre-Order / Out of Stock |
| `warranty` | VARCHAR(100) | Official Nepal warranty |
| `tags` | LONGTEXT | JSON array of search tags |
| `featured` | TINYINT(1) | Flag for homepage spotlight (0/1) |
| `created_at` | DATETIME | Created timestamp |
| `updated_at` | DATETIME | Last updated timestamp |

### 4. `scraped_media` Table
Stores over 1,000 scraped real gadget images from `gadgetbytenepal.com`:
| Column | Type | Description |
|---|---|---|
| `id` | INT AUTO_INCREMENT PK | Primary key |
| `image_url` | TEXT | High-resolution image URL |
| `created_at` | DATETIME | Timestamp |

---

## 📁 Project Structure

```
hamrogadget/
├── .htaccess                 # Apache rewrite configuration for XAMPP
├── index.php                 # Main entry point (HTML5 & PHP)
├── index.html                # Static HTML alternative
├── config/
│   └── db.php                # PDO database connection, JWT helpers & auto-setup
├── database/
│   ├── database.sql          # Complete SQL schema & seed script for MySQL
│   └── setup_db.php          # Automated 1-click web database initializer
├── api/
│   ├── index.php             # Unified REST API controller (Products, Auth, Media)
│   ├── products.php          # Products endpoint wrapper
│   ├── categories.php        # Categories endpoint wrapper
│   ├── auth/
│   │   ├── login.php         # Login handler
│   │   ├── signup.php        # Signup handler
│   │   └── me.php            # Current session handler
│   └── media/
│       └── scraped.php       # Scraped media gallery handler
├── css/
│   └── style.css             # Bento Grid design system, theme tokens & responsive styles
├── js/
│   └── app.js                # Frontend engine: bento hero, filters, modals, admin dashboard
└── uploads/                  # Storage folder for uploaded images
```

---

## 🎨 Visual Design & Features Retained
- **Bento Grid Layout**: Hero mosaic (1x1, 2x1, 2x2 modular cards), category tiles, and product grids.
- **Nepal NPR Pricing**: Formatted correctly with Nepali comma notation (e.g. `NPR 1,74,999`).
- **Responsive Navigation**: Mobile navigation drawer, search bar, dark/light theme toggle.
- **Category Specs & Filters**: Dynamic specification builders for Laptops, Phones, Headphones, Smartwatches, and Accessories.
- **Admin Management Panel**: Full CRUD operations with instant catalog updates.
