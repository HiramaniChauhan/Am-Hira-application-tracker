import express from 'express';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';

export const linksRouter = express.Router();

// Helper to normalize URL
function formatUrl(url) {
  if (!url) return '';
  let trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = 'https://' + trimmed;
  }
  return trimmed;
}

function extractDomainTitle(rawUrl) {
  try {
    const formatted = formatUrl(rawUrl);
    const parsed = new URL(formatted);
    let hostname = parsed.hostname.toLowerCase();
    hostname = hostname.replace(/^(www\.|jobs\.|careers\.|apply\.|boards\.)/i, '');
    const parts = hostname.split('.');
    if (parts.length > 0 && parts[0]) {
      return parts[0].charAt(0).toUpperCase() + parts[0].slice(1) + ' Link';
    }
    return 'Saved Link';
  } catch (e) {
    return 'Saved Link';
  }
}

// 1. GET /api/links - Get all links for the current authenticated user
linksRouter.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { search, category, status } = req.query;

    let query = `SELECT * FROM user_links WHERE user_id = ?`;
    const params = [userId];

    if (category && category !== 'All') {
      query += ` AND category = ?`;
      params.push(category);
    }

    if (status && status !== 'all') {
      query += ` AND status = ?`;
      params.push(status);
    }

    if (search && search.trim() !== '') {
      query += ` AND (title LIKE ? OR url LIKE ? OR notes LIKE ? OR tags LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    query += ` ORDER BY created_at DESC`;

    const links = await db.all(query, params);
    res.json({ links });
  } catch (error) {
    console.error('Fetch links error:', error);
    res.status(500).json({ error: 'Failed to retrieve saved links' });
  }
});

// 2. POST /api/links - Add a new link to the user's private links store
linksRouter.post('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, url, category, status, notes, tags } = req.body;

    if (!url || !url.trim()) {
      return res.status(400).json({ error: 'Link URL is required' });
    }

    const cleanUrl = formatUrl(url);
    try {
      new URL(cleanUrl);
    } catch {
      return res.status(400).json({ error: 'Please enter a valid URL (e.g., https://...)' });
    }

    const resolvedTitle = (title && title.trim()) ? title.trim() : extractDomainTitle(cleanUrl);
    const resolvedCategory = category || 'Job Post';
    const resolvedStatus = status || 'saved';
    const cleanNotes = notes ? notes.trim() : '';
    const cleanTags = tags ? tags.trim() : '';
    const now = new Date().toISOString();

    const result = await db.run(`
      INSERT INTO user_links (
        user_id, title, url, category, status, notes, tags, clicks, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    `, [
      userId,
      resolvedTitle,
      cleanUrl,
      resolvedCategory,
      resolvedStatus,
      cleanNotes,
      cleanTags,
      now,
      now
    ]);

    const newLink = await db.get('SELECT * FROM user_links WHERE id = ? AND user_id = ?', [result.lastInsertRowid, userId]);

    res.status(201).json({
      message: `Link "${resolvedTitle}" saved to your private Links Vault!`,
      link: newLink
    });
  } catch (error) {
    console.error('Create link error:', error);
    res.status(500).json({ error: 'Failed to save link' });
  }
});

// 3. PUT /api/links/:id - Update an existing stored link
linksRouter.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { title, url, category, status, notes, tags } = req.body;

    const existing = await db.get('SELECT * FROM user_links WHERE id = ? AND user_id = ?', [id, userId]);
    if (!existing) {
      return res.status(404).json({ error: 'Link not found' });
    }

    let cleanUrl = existing.url;
    if (url && url.trim()) {
      cleanUrl = formatUrl(url);
      try {
        new URL(cleanUrl);
      } catch {
        return res.status(400).json({ error: 'Please enter a valid URL' });
      }
    }

    const updatedTitle = title !== undefined ? title.trim() : existing.title;
    const updatedCategory = category !== undefined ? category : existing.category;
    const updatedStatus = status !== undefined ? status : existing.status;
    const updatedNotes = notes !== undefined ? notes.trim() : existing.notes;
    const updatedTags = tags !== undefined ? tags.trim() : existing.tags;
    const now = new Date().toISOString();

    await db.run(`
      UPDATE user_links
      SET 
        title = ?,
        url = ?,
        category = ?,
        status = ?,
        notes = ?,
        tags = ?,
        updated_at = ?
      WHERE id = ? AND user_id = ?
    `, [
      updatedTitle,
      cleanUrl,
      updatedCategory,
      updatedStatus,
      updatedNotes,
      updatedTags,
      now,
      id,
      userId
    ]);

    const updated = await db.get('SELECT * FROM user_links WHERE id = ? AND user_id = ?', [id, userId]);

    res.json({
      message: 'Link updated successfully!',
      link: updated
    });
  } catch (error) {
    console.error('Update link error:', error);
    res.status(500).json({ error: 'Failed to update link' });
  }
});

// 4. DELETE /api/links/:id - Delete a stored link
linksRouter.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existing = await db.get('SELECT id, title FROM user_links WHERE id = ? AND user_id = ?', [id, userId]);
    if (!existing) {
      return res.status(404).json({ error: 'Link not found' });
    }

    await db.run('DELETE FROM user_links WHERE id = ? AND user_id = ?', [id, userId]);

    res.json({ message: `Link "${existing.title}" removed from your private store.` });
  } catch (error) {
    console.error('Delete link error:', error);
    res.status(500).json({ error: 'Failed to delete link' });
  }
});

// 5. POST /api/links/:id/click - Increment click count
linksRouter.post('/:id/click', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const now = new Date().toISOString();
    await db.run(`
      UPDATE user_links 
      SET clicks = clicks + 1, updated_at = ?
      WHERE id = ? AND user_id = ?
    `, [now, id, userId]);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record click' });
  }
});

// 6. GET /api/links/stats - Summary counts for user's links
linksRouter.get('/stats', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const totalLinksRow = await db.get('SELECT COUNT(*) as count FROM user_links WHERE user_id = ?', [userId]);
    const jobPostsRow = await db.get("SELECT COUNT(*) as count FROM user_links WHERE user_id = ? AND category = 'Job Post'", [userId]);
    const portalsRow = await db.get("SELECT COUNT(*) as count FROM user_links WHERE user_id = ? AND category = 'Application Portal'", [userId]);
    const resumeDocsRow = await db.get("SELECT COUNT(*) as count FROM user_links WHERE user_id = ? AND category = 'Resume & Docs'", [userId]);
    const prepRow = await db.get("SELECT COUNT(*) as count FROM user_links WHERE user_id = ? AND category = 'Interview Prep'", [userId]);

    res.json({
      totalLinks: totalLinksRow ? Number(totalLinksRow.count) : 0,
      jobPostsCount: jobPostsRow ? Number(jobPostsRow.count) : 0,
      portalsCount: portalsRow ? Number(portalsRow.count) : 0,
      resumeDocsCount: resumeDocsRow ? Number(resumeDocsRow.count) : 0,
      prepCount: prepRow ? Number(prepRow.count) : 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get links stats' });
  }
});
