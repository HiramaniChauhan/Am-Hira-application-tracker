import express from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { signToken, requireAuth } from '../auth.js';

export const authRouter = express.Router();

// Register new user
authRouter.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await db.get('SELECT id FROM users WHERE email = ?', [cleanEmail]);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    
    // Only the designated admin email or initial setup receives admin role
    const adminCountRow = await db.get("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
    const adminCount = adminCountRow ? Number(adminCountRow.count) : 0;
    const isOwner = cleanEmail === 'hiramanichauhan2399@gmail.com' || adminCount === 0;
    const role = isOwner ? 'admin' : 'user';

    const result = await db.run(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `, [name.trim(), cleanEmail, passwordHash, role]);

    const newUserRow = await db.get(`
      SELECT id, name, email, role, headline, phone, location, bio, resume_url, portfolio_url, github_url, linkedin_url, created_at, updated_at 
      FROM users WHERE id = ?
    `, [result.lastInsertRowid]);

    const token = signToken(newUserRow);
    res.status(201).json({ user: newUserRow, token });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// Login
authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const userRow = await db.get(`
      SELECT id, name, email, password_hash, role, headline, phone, location, bio, resume_url, portfolio_url, github_url, linkedin_url, created_at, updated_at 
      FROM users WHERE email = ?
    `, [cleanEmail]);

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
authRouter.get('/me', requireAuth, async (req, res) => {
  try {
    const userRow = await db.get(`
      SELECT id, name, email, role, headline, phone, location, bio, resume_url, portfolio_url, github_url, linkedin_url, created_at, updated_at 
      FROM users WHERE id = ?
    `, [req.user.id]);

    if (!userRow) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: userRow });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user profile data in database
authRouter.put('/profile', requireAuth, async (req, res) => {
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

    await db.run(`
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
    `, [
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
    ]);

    const updatedUser = await db.get(`
      SELECT id, name, email, role, headline, phone, location, bio, resume_url, portfolio_url, github_url, linkedin_url, created_at, updated_at 
      FROM users WHERE id = ?
    `, [req.user.id]);

    res.json({
      message: 'Profile updated successfully!',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Change user password
authRouter.put('/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 4) {
      return res.status(400).json({ error: 'New password must be at least 4 characters long' });
    }

    const userRow = await db.get('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    if (!userRow) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isValid = bcrypt.compareSync(currentPassword, userRow.password_hash);
    if (!isValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const newHash = bcrypt.hashSync(newPassword, 10);
    const now = new Date().toISOString();

    await db.run('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?', [
      newHash,
      now,
      req.user.id
    ]);

    res.json({ message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
});
