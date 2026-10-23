import express from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { signToken, requireAuth } from '../auth.js';

export const authRouter = express.Router();

// Register new user
authRouter.post('/register', (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    
    // Only the designated admin email or initial setup receives admin role
    const adminCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'").get().count;
    const isOwner = cleanEmail === 'hiramanichauhan2399@gmail.com' || adminCount === 0;
    const role = isOwner ? 'admin' : 'user';

    const result = db.prepare(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `).run(name.trim(), cleanEmail, passwordHash, role);

    const newUserRow = db.prepare(`
      SELECT id, name, email, role, headline, phone, location, bio, resume_url, portfolio_url, github_url, linkedin_url, created_at, updated_at 
      FROM users WHERE id = ?
    `).get(result.lastInsertRowid);

    const token = signToken(newUserRow);
    res.status(201).json({ user: newUserRow, token });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// Login
authRouter.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const userRow = db.prepare(`
      SELECT id, name, email, password_hash, role, headline, phone, location, bio, resume_url, portfolio_url, github_url, linkedin_url, created_at, updated_at 
      FROM users WHERE email = ?
    `).get(cleanEmail);

    if (!userRow) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValid = bcrypt.compareSync(password, userRow.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      role: userRow.role,
      headline: userRow.headline || '',
      phone: userRow.phone || '',
      location: userRow.location || '',
      bio: userRow.bio || '',
      resume_url: userRow.resume_url || '',
      portfolio_url: userRow.portfolio_url || '',
      github_url: userRow.github_url || '',
      linkedin_url: userRow.linkedin_url || '',
      created_at: userRow.created_at,
      updated_at: userRow.updated_at
    };

    const token = signToken(user);
    res.json({ user, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Current user profile
authRouter.get('/me', requireAuth, (req, res) => {
  try {
    const userRow = db.prepare(`
      SELECT id, name, email, role, headline, phone, location, bio, resume_url, portfolio_url, github_url, linkedin_url, created_at, updated_at 
      FROM users WHERE id = ?
    `).get(req.user.id);

    if (!userRow) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: userRow });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user profile data in SQLite
authRouter.put('/profile', requireAuth, (req, res) => {
  try {
    const {
      name,
      headline,
      phone,
      location,
      bio,
      resume_url,
      portfolio_url,
      github_url,
      linkedin_url
    } = req.body;

    if (name !== undefined && !name.trim()) {
      return res.status(400).json({ error: 'Name cannot be empty' });
    }

    const now = new Date().toISOString();

    db.prepare(`
      UPDATE users 
      SET 
        name = COALESCE(?, name),
        headline = ?,
        phone = ?,
        location = ?,
        bio = ?,
        resume_url = ?,
        portfolio_url = ?,
        github_url = ?,
        linkedin_url = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      name ? name.trim() : null,
      headline !== undefined ? headline.trim() : null,
      phone !== undefined ? phone.trim() : null,
      location !== undefined ? location.trim() : null,
      bio !== undefined ? bio.trim() : null,
      resume_url !== undefined ? resume_url.trim() : null,
      portfolio_url !== undefined ? portfolio_url.trim() : null,
      github_url !== undefined ? github_url.trim() : null,
      linkedin_url !== undefined ? linkedin_url.trim() : null,
      now,
      req.user.id
    );

    const updatedUser = db.prepare(`
      SELECT id, name, email, role, headline, phone, location, bio, resume_url, portfolio_url, github_url, linkedin_url, created_at, updated_at 
      FROM users WHERE id = ?
    `).get(req.user.id);

    res.json({
      message: 'Profile updated successfully in SQLite database!',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Change user password
authRouter.put('/change-password', requireAuth, (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 4) {
      return res.status(400).json({ error: 'New password must be at least 4 characters long' });
    }

    const userRow = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id);
    if (!userRow) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isValid = bcrypt.compareSync(currentPassword, userRow.password_hash);
    if (!isValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const newHash = bcrypt.hashSync(newPassword, 10);
    const now = new Date().toISOString();

    db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').run(
      newHash,
      now,
      req.user.id
    );

    res.json({ message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
});
