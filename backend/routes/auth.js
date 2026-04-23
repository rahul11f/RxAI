const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

// In-memory user store (replace with PostgreSQL in production)
const USERS = [
  { id:1, email:'patient@rxai.com',    name:'Rahul Kumar',       role:'patient',     passwordHash: bcrypt.hashSync('password123',10) },
  { id:2, email:'pharma@rxai.com',     name:'Priya Mehta',       role:'pharmacist',  passwordHash: bcrypt.hashSync('password123',10) },
  { id:3, email:'doctor@rxai.com',     name:'Dr. Anjali Sharma', role:'doctor',      passwordHash: bcrypt.hashSync('password123',10) },
  { id:4, email:'admin@rxai.com',      name:'Arun Singh',        role:'admin',       passwordHash: bcrypt.hashSync('password123',10) },
];

const makeToken = (user) => jwt.sign(
  { id: user.id, email: user.email, role: user.role, name: user.name },
  process.env.JWT_SECRET || 'rxai_secret',
  { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
);

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const user = USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = makeToken(user);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role = 'patient' } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: 'All fields required' });
    if (USERS.find(u => u.email.toLowerCase() === email.toLowerCase())) return res.status(409).json({ error: 'Email already registered' });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = { id: Date.now(), email, name, role, passwordHash };
    USERS.push(user);
    const token = makeToken(user);
    res.status(201).json({ token, user: { id: user.id, email, name, role } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/auth/me
router.get('/me', require('../middleware/auth'), (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
