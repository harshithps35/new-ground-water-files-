const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const router = express.Router();

const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json');

// Helper: read users from file
function readUsers() {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      fs.writeFileSync(USERS_FILE, '[]', 'utf-8');
      return [];
    }
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
  } catch { return []; }
}

// Helper: save users to file
function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
}

// Helper: hash password (SHA-256 with salt)
function hashPassword(password, salt) {
  if (!salt) salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { name, email, phone, password } = req.body;

  if (!name || !password) {
    return res.status(400).json({ success: false, message: 'Name and password are required.' });
  }
  if (!email && !phone) {
    return res.status(400).json({ success: false, message: 'Email or phone number is required.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
  }

  const users = readUsers();

  // Check if already registered
  const exists = users.find(u =>
    (email && u.email === email.toLowerCase()) ||
    (phone && u.phone === phone)
  );
  if (exists) {
    return res.status(409).json({ success: false, message: 'An account with this email/phone already exists.' });
  }

  const { salt, hash } = hashPassword(password);

  const newUser = {
    id: crypto.randomUUID(),
    name,
    email: email ? email.toLowerCase() : null,
    phone: phone || null,
    passwordHash: hash,
    salt,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveUsers(users);

  res.status(201).json({
    success: true,
    message: 'Account created successfully! Please sign in.'
  });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, phone, password } = req.body;

  if (!email && !phone) {
    return res.status(400).json({ success: false, message: 'Email or phone number is required.' });
  }
  if (!password) {
    return res.status(400).json({ success: false, message: 'Password is required.' });
  }

  const users = readUsers();

  const user = users.find(u =>
    (email && u.email === email.toLowerCase()) ||
    (phone && u.phone === phone)
  );

  if (!user) {
    return res.status(401).json({ success: false, message: 'No account found. Please register first.' });
  }

  const { hash } = hashPassword(password, user.salt);
  if (hash !== user.passwordHash) {
    return res.status(401).json({ success: false, message: 'Incorrect password. Please try again.' });
  }

  res.json({
    success: true,
    message: 'Login successful! Redirecting...',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone
    }
  });
});

module.exports = router;
