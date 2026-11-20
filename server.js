const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'HG_JWT_SECRET_2026';

// --- Directories ---
const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// --- Data helpers ---
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const ADMIN_FILE = path.join(DATA_DIR, 'admin.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SCRAPED_FILE = path.join(DATA_DIR, 'scraped_media.json');

function readJSON(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf-8')); }
  catch { return fallback; }
}
function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

// --- Seed admin & demo users ---
async function seedAdmin() {
  let admin = readJSON(ADMIN_FILE, null);
  if (!admin) {
    const hash = await bcrypt.hash('admin12@', 10);
    admin = { id: uuidv4(), email: 'admin12@gmail.com', password: hash, name: 'Admin', createdAt: new Date().toISOString() };
    writeJSON(ADMIN_FILE, admin);
    console.log('Admin seeded: admin12@gmail.com');
  }
  
  let users = readJSON(USERS_FILE, null);
  if (!users) {
    const userHash = await bcrypt.hash('member12@', 10);
    users = [{
      id: uuidv4(),
      name: 'Ramesh Sharma',
      email: 'member@gmail.com',
      password: userHash,
      role: 'user',
      createdAt: new Date().toISOString()
    }];
    writeJSON(USERS_FILE, users);
    console.log('Demo user seeded: member@gmail.com');
  }
  return admin;
}

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rate limit on login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many login attempts. Please try again later.' }
});

// Auth middleware
function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required' });
  }
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    req.admin = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// --- Multer setup ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|svg/;
    if (allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype.split('/')[1])) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// ============================================================
// ROUTES
// ============================================================

// --- Scraped Gallery Pictures ---
app.get('/api/media/scraped', (req, res) => {
  const scraped = readJSON(SCRAPED_FILE, { images: [] });
  res.json(scraped.images || []);
});

// --- Unified Login (Admin & Regular User) ---
app.post('/api/auth/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Check if Admin
    const admin = readJSON(ADMIN_FILE, null);
    if (admin && admin.email.toLowerCase() === normalizedEmail) {
      const validAdmin = await bcrypt.compare(password, admin.password);
      if (!validAdmin) return res.status(401).json({ error: 'Invalid admin credentials' });

      const token = jwt.sign({ id: admin.id, email: admin.email, name: admin.name, role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
      return res.json({
        token,
        role: 'admin',
        redirectTo: '#/admin',
        user: { id: admin.id, email: admin.email, name: admin.name, role: 'admin' },
        message: 'Welcome back, Administrator!'
      });
    }

    // 2. Check if Regular User
    const users = readJSON(USERS_FILE, []);
    const user = users.find(u => u.email.toLowerCase() === normalizedEmail);
    if (!user) {
      return res.status(401).json({
        error: 'No account found with this email. Please Sign Up first to create your account!'
      });
    }

    const validUser = await bcrypt.compare(password, user.password);
    if (!validUser) return res.status(401).json({ error: 'Incorrect password. Please try again.' });

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({
      token,
      role: 'user',
      redirectTo: '#/',
      user: { id: user.id, email: user.email, name: user.name, role: 'user' },
      message: `Welcome back, ${user.name}!`
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server authentication error' });
  }
});

// --- User Registration / Sign Up ---
app.post('/api/auth/signup', loginLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if email already exists
    const admin = readJSON(ADMIN_FILE, null);
    if (admin && admin.email.toLowerCase() === normalizedEmail) {
      return res.status(400).json({ error: 'This email is reserved for administration' });
    }

    const users = readJSON(USERS_FILE, []);
    if (users.some(u => u.email.toLowerCase() === normalizedEmail)) {
      return res.status(400).json({ error: 'An account with this email already exists. Please log in.' });
    }

    const hash = await bcrypt.hash(password, 10);
    const newUser = {
      id: uuidv4(),
      name: name.trim(),
      email: normalizedEmail,
      password: hash,
      role: 'user',
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    writeJSON(USERS_FILE, users);

    res.status(201).json({
      success: true,
      message: 'Account created successfully! You can now log in with your credentials.',
      user: { id: newUser.id, name: newUser.name, email: newUser.email }
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Failed to create user account' });
  }
});

// --- Current User Info ---
app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    res.json({ user: decoded });
  } catch {
    res.status(401).json({ error: 'Session expired or invalid' });
  }
});

// --- Admin auth ---
app.post('/api/admin/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const admin = readJSON(ADMIN_FILE, null);
    if (!admin || admin.email !== email) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: admin.id, email: admin.email, name: admin.name }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, admin: { id: admin.id, email: admin.email, name: admin.name } });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/admin/me', requireAdmin, (req, res) => {
  const admin = readJSON(ADMIN_FILE, null);
  if (!admin) return res.status(404).json({ error: 'Admin not found' });
  res.json({ id: admin.id, email: admin.email, name: admin.name });
});

// --- Categories ---
app.get('/api/categories', (req, res) => {
  res.json(['Laptops', 'Phones', 'Headphones', 'Smartwatches', 'Accessories', 'Other Tech']);
});

// --- Products ---
app.get('/api/products', (req, res) => {
  let products = readJSON(PRODUCTS_FILE, []);
  const { category, brand, search, minPrice, maxPrice, availability, sort, featured } = req.query;

  if (category) products = products.filter(p => p.category.toLowerCase() === category.toLowerCase());
  if (brand) products = products.filter(p => p.brand.toLowerCase() === brand.toLowerCase());
  if (search) {
    const q = search.toLowerCase();
    products = products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.shortDescription.toLowerCase().includes(q) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
    );
  }
  if (minPrice) products = products.filter(p => p.price >= Number(minPrice));
  if (maxPrice) products = products.filter(p => p.price <= Number(maxPrice));
  if (availability) products = products.filter(p => p.availability === availability);
  if (featured !== undefined) products = products.filter(p => p.featured === (featured === 'true'));

  if (sort === 'newest') products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  else if (sort === 'price-asc') products.sort((a, b) => a.price - b.price);
  else if (sort === 'price-desc') products.sort((a, b) => b.price - a.price);

  res.json(products);
});

app.get('/api/products/:id', (req, res) => {
  const products = readJSON(PRODUCTS_FILE, []);
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

app.post('/api/products', requireAdmin, (req, res) => {
  const { name, brand, category, price } = req.body;
  if (!name || !brand || !category || price === undefined) {
    return res.status(400).json({ error: 'name, brand, category, and price are required' });
  }

  const products = readJSON(PRODUCTS_FILE, []);
  const now = new Date().toISOString();
  const product = {
    id: uuidv4(),
    name,
    brand,
    category,
    price: Number(price),
    discountPrice: req.body.discountPrice != null ? Number(req.body.discountPrice) : null,
    images: req.body.images || [],
    shortDescription: req.body.shortDescription || '',
    specs: req.body.specs || {},
    features: req.body.features || [],
    availability: req.body.availability || 'In Stock',
    warranty: req.body.warranty || '',
    tags: req.body.tags || [],
    featured: req.body.featured || false,
    createdAt: now,
    updatedAt: now
  };
  products.push(product);
  writeJSON(PRODUCTS_FILE, products);
  res.status(201).json(product);
});

app.put('/api/products/:id', requireAdmin, (req, res) => {
  const products = readJSON(PRODUCTS_FILE, []);
  const idx = products.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Product not found' });

  const updated = { ...products[idx], ...req.body, id: products[idx].id, updatedAt: new Date().toISOString() };
  if (updated.price !== undefined) updated.price = Number(updated.price);
  if (updated.discountPrice !== undefined && updated.discountPrice !== null) updated.discountPrice = Number(updated.discountPrice);
  products[idx] = updated;
  writeJSON(PRODUCTS_FILE, products);
  res.json(updated);
});

app.delete('/api/products/:id', requireAdmin, (req, res) => {
  let products = readJSON(PRODUCTS_FILE, []);
  const idx = products.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Product not found' });
  const deleted = products.splice(idx, 1)[0];
  writeJSON(PRODUCTS_FILE, products);
  res.json({ message: 'Product deleted', product: deleted });
});

app.patch('/api/products/:id/stock', requireAdmin, (req, res) => {
  const products = readJSON(PRODUCTS_FILE, []);
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const states = ['In Stock', 'Pre-Order', 'Out of Stock'];
  const currentIdx = states.indexOf(product.availability);
  product.availability = states[(currentIdx + 1) % states.length];
  product.updatedAt = new Date().toISOString();
  writeJSON(PRODUCTS_FILE, products);
  res.json(product);
});

app.patch('/api/products/:id/featured', requireAdmin, (req, res) => {
  const products = readJSON(PRODUCTS_FILE, []);
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  product.featured = !product.featured;
  product.updatedAt = new Date().toISOString();
  writeJSON(PRODUCTS_FILE, products);
  res.json(product);
});

// --- Image upload ---
app.post('/api/upload', requireAdmin, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image file provided' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

// ============================================================
// START
// ============================================================
seedAdmin().then(() => {
  app.listen(PORT, () => {
    console.log(`HamroGadget server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
