import express from 'express';
import { db } from '../db.js';
import { requireAuth, optionalAuth, requireAdmin } from '../auth.js';

export const companiesRouter = express.Router();

// Helper to normalize URL
function formatUrl(url) {
  if (!url) return '';
  let trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = 'https://' + trimmed;
  }
  return trimmed;
}

// 1. GET /api/companies - Public directory of approved company links
companiesRouter.get('/', optionalAuth, (req, res) => {
  try {
    const { search, category, status } = req.query;
    const userId = req.user ? req.user.id : null;

    let query = `
      SELECT 
        c.*,
        ua.is_applied,
        ua.is_interviewed,
        ua.status AS app_status,
        ua.applied_date,
        ua.interview_date,
        ua.interview_stage,
        ua.notes AS user_notes
      FROM companies c
      LEFT JOIN user_applications ua 
        ON c.id = ua.company_id AND ua.user_id = ?
      WHERE c.status = 'approved'
    `;
    const params = [userId];

    if (category && category !== 'All') {
      query += ` AND c.category = ?`;
      params.push(category);
    }

    if (search && search.trim() !== '') {
      query += ` AND (c.name LIKE ? OR c.description LIKE ? OR c.tags LIKE ? OR c.category LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    query += ` ORDER BY c.created_at DESC`;

    const companies = db.prepare(query).all(...params);

    // Map null booleans to false
    const mapped = companies.map(c => ({
      ...c,
      is_applied: Boolean(c.is_applied),
      is_interviewed: Boolean(c.is_interviewed),
      app_status: c.app_status || 'none'
    }));

    res.json({ companies: mapped });
  } catch (error) {
    console.error('Fetch companies error:', error);
    res.status(500).json({ error: 'Failed to retrieve companies' });
  }
});

function extractCompanyNameFromUrl(rawUrl) {
  try {
    const formatted = formatUrl(rawUrl);
    const parsed = new URL(formatted);
    let hostname = parsed.hostname.toLowerCase();
    
    const pathname = parsed.pathname.split('/').filter(Boolean);
    if ((hostname.includes('lever.co') || hostname.includes('greenhouse.io') || hostname.includes('ashbyhq.com') || hostname.includes('workable.com')) && pathname.length > 0) {
      const slug = pathname[0];
      return slug.charAt(0).toUpperCase() + slug.slice(1);
    }
    
    hostname = hostname.replace(/^(www\.|jobs\.|careers\.|apply\.|boards\.|workat\.)/i, '');
    const parts = hostname.split('.');
    if (parts.length > 0 && parts[0]) {
      const n = parts[0];
      return n.charAt(0).toUpperCase() + n.slice(1);
    }
    return 'Company';
  } catch (e) {
    return 'Company';
  }
}

// 2. POST /api/companies - Add company job link
// Only link is required! If name is omitted, extracted automatically from domain.
// If Admin: immediately approved & published.
// If regular user: saved as pending for admin approval.
companiesRouter.post('/', requireAuth, (req, res) => {
  try {
    const {
      link,
      careers_url,
      name,
      website_url,
      description,
      category,
      location,
      work_type,
      tags
    } = req.body;

    const rawUrl = link || careers_url;

    if (!rawUrl || !rawUrl.trim()) {
      return res.status(400).json({ error: 'Company link is required' });
    }

    const cleanCareersUrl = formatUrl(rawUrl);

    // Validate URL structure
    try {
      new URL(cleanCareersUrl);
    } catch (e) {
      return res.status(400).json({ error: 'Please enter a valid link (e.g. https://company.com/careers)' });
    }

    const resolvedName = (name && name.trim()) ? name.trim() : extractCompanyNameFromUrl(cleanCareersUrl);
    const cleanWebsiteUrl = website_url ? formatUrl(website_url) : null;

    const isAdmin = req.user.role === 'admin';
    const status = isAdmin ? 'approved' : 'pending';

    const insertStmt = db.prepare(`
      INSERT INTO companies (
        name,
        website_url,
        careers_url,
        description,
        category,
        location,
        work_type,
        tags,
        status,
        submitted_by_user_id,
        submitted_by_name
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertStmt.run(
      resolvedName,
      cleanWebsiteUrl,
      cleanCareersUrl,
      description ? description.trim() : '',
      category || 'Tech',
      location || 'Remote / Hybrid',
      work_type || 'Full-time',
      tags ? tags.trim() : '',
      status,
      req.user.id,
      req.user.name || req.user.email
    );

    const newCompany = db.prepare('SELECT * FROM companies WHERE id = ?').get(result.lastInsertRowid);

    if (isAdmin) {
      res.status(201).json({
        message: 'Company link added directly to the public directory.',
        company: newCompany,
        isApproved: true
      });
    } else {
      res.status(201).json({
        message: 'Company link submitted successfully! It is now pending admin review and will appear once approved.',
        company: newCompany,
        isApproved: false
      });
    }
  } catch (error) {
    console.error('Create company error:', error);
    res.status(500).json({ error: 'Failed to add company link' });
  }
});

// 3. GET /api/companies/pending - Admin review queue for submitted links
companiesRouter.get('/pending', requireAuth, requireAdmin, (req, res) => {
  try {
    const pendingList = db.prepare(`
      SELECT 
        c.*,
        u.email AS submitter_email
      FROM companies c
      LEFT JOIN users u ON c.submitted_by_user_id = u.id
      WHERE c.status = 'pending'
      ORDER BY c.created_at ASC
    `).all();

    res.json({ pending: pendingList });
  } catch (error) {
    console.error('Fetch pending error:', error);
    res.status(500).json({ error: 'Failed to fetch pending company links' });
  }
});

// 4. POST /api/companies/:id/approve - Admin approves submitted link
companiesRouter.post('/:id/approve', requireAuth, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(id);

    if (!company) {
      return res.status(404).json({ error: 'Company link not found' });
    }

    db.prepare(`
      UPDATE companies 
      SET status = 'approved', updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(id);

    const updated = db.prepare('SELECT * FROM companies WHERE id = ?').get(id);
    res.json({
      message: `"${company.name}" link has been approved and published to the public directory!`,
      company: updated
    });
  } catch (error) {
    console.error('Approve company error:', error);
    res.status(500).json({ error: 'Failed to approve company link' });
  }
});

// 5. POST /api/companies/:id/reject - Admin rejects submitted link
companiesRouter.post('/:id/reject', requireAuth, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(id);
    if (!company) {
      return res.status(404).json({ error: 'Company link not found' });
    }

    db.prepare(`
      UPDATE companies 
      SET status = 'rejected', admin_notes = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(reason || 'Link rejected during verification', id);

    res.json({ message: `"${company.name}" submission was rejected.` });
  } catch (error) {
    console.error('Reject company error:', error);
    res.status(500).json({ error: 'Failed to reject company link' });
  }
});

// 6. DELETE /api/companies/:id - Admin deletes company
companiesRouter.delete('/:id', requireAuth, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(id);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    db.prepare('DELETE FROM companies WHERE id = ?').run(id);
    res.json({ message: `Company "${company.name}" removed.` });
  } catch (error) {
    console.error('Delete company error:', error);
    res.status(500).json({ error: 'Failed to delete company' });
  }
});

// 6b. POST /api/companies/bulk-delete - Admin deletes multiple companies in one go
companiesRouter.post('/bulk-delete', requireAuth, requireAdmin, (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Please provide an array of company IDs to delete' });
    }

    const deleteStmt = db.prepare('DELETE FROM companies WHERE id = ?');
    const deleteMany = db.transaction((idList) => {
      let count = 0;
      for (const id of idList) {
        const result = deleteStmt.run(id);
        if (result.changes > 0) count++;
      }
      return count;
    });

    const deletedCount = deleteMany(ids);

    res.json({
      message: `Successfully deleted ${deletedCount} ${deletedCount === 1 ? 'company' : 'companies'} from SQLite database.`,
      deletedCount
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({ error: 'Failed to bulk delete companies' });
  }
});

// 7. GET /api/companies/my-submissions - User's submitted company links
companiesRouter.get('/my-submissions', requireAuth, (req, res) => {
  try {
    const submissions = db.prepare(`
      SELECT * FROM companies 
      WHERE submitted_by_user_id = ?
      ORDER BY created_at DESC
    `).all(req.user.id);

    res.json({ submissions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user submissions' });
  }
});

// 8. POST /api/companies/validate-link - Quick URL validation check
companiesRouter.post('/validate-link', (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ valid: false, message: 'URL is required' });

  try {
    const formatted = formatUrl(url);
    const parsed = new URL(formatted);
    const isValid = parsed.protocol === 'http:' || parsed.protocol === 'https:';
    res.json({
      valid: isValid,
      formattedUrl: formatted,
      hostname: parsed.hostname
    });
  } catch (e) {
    res.json({ valid: false, message: 'Invalid URL format' });
  }
});
