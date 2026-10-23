import express from 'express';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';

export const applicationsRouter = express.Router();

// 1. GET /api/applications - List of user's tracked applications
applicationsRouter.get('/', requireAuth, async (req, res) => {
  try {
    const { status } = req.query;
    const userId = req.user.id;

    let query = `
      SELECT 
        ua.*,
        c.name AS company_name,
        c.website_url,
        c.careers_url,
        c.description,
        c.category,
        c.location,
        c.work_type,
        c.tags
      FROM user_applications ua
      INNER JOIN companies c ON ua.company_id = c.id
      WHERE ua.user_id = ?
    `;
    const params = [userId];

    if (status && status !== 'all') {
      if (status === 'applied') {
        query += ` AND (ua.is_applied = 1 OR ua.status = 'applied')`;
      } else if (status === 'interviewing' || status === 'interviewed') {
        query += ` AND (ua.is_interviewed = 1 OR ua.status = 'interviewing')`;
      } else if (status === 'to_apply') {
        query += ` AND ua.status = 'to_apply' AND ua.is_applied = 0`;
      } else {
        query += ` AND ua.status = ?`;
        params.push(status);
      }
    }

    query += ` ORDER BY ua.updated_at DESC`;

    const applications = await db.all(query, params);

    const mapped = applications.map(app => ({
      ...app,
      is_applied: Boolean(app.is_applied),
      is_interviewed: Boolean(app.is_interviewed)
    }));

    res.json({ applications: mapped });
  } catch (error) {
    console.error('Fetch applications error:', error);
    res.status(500).json({ error: 'Failed to retrieve applications' });
  }
});

// 2. POST /api/applications/toggle-applied - Click checkbox for "Applied"
applicationsRouter.post('/toggle-applied', requireAuth, async (req, res) => {
  try {
    const { companyId, isApplied } = req.body;
    const userId = req.user.id;

    if (!companyId) {
      return res.status(400).json({ error: 'companyId is required' });
    }

    const company = await db.get('SELECT id, name FROM companies WHERE id = ?', [companyId]);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const existing = await db.get('SELECT * FROM user_applications WHERE user_id = ? AND company_id = ?', [userId, companyId]);

    const appliedVal = isApplied ? 1 : 0;
    const now = new Date().toISOString();

    if (!existing) {
      const status = isApplied ? 'applied' : 'to_apply';
      await db.run(`
        INSERT INTO user_applications (
          user_id, company_id, status, is_applied, is_interviewed, applied_date, updated_at
        ) VALUES (?, ?, ?, ?, 0, ?, ?)
      `, [userId, companyId, status, appliedVal, isApplied ? now : null, now]);
    } else {
      let newStatus = existing.status;
      if (isApplied) {
        newStatus = existing.is_interviewed ? 'interviewing' : 'applied';
      } else {
        newStatus = existing.is_interviewed ? 'interviewing' : 'to_apply';
      }

      await db.run(`
        UPDATE user_applications
        SET 
          is_applied = ?,
          status = ?,
          applied_date = CASE WHEN ? = 1 THEN COALESCE(applied_date, ?) ELSE applied_date END,
          updated_at = ?
        WHERE user_id = ? AND company_id = ?
      `, [appliedVal, newStatus, appliedVal, now, now, userId, companyId]);
    }

    const updated = await db.get(`
      SELECT ua.*, c.name AS company_name, c.careers_url 
      FROM user_applications ua
      JOIN companies c ON ua.company_id = c.id
      WHERE ua.user_id = ? AND ua.company_id = ?
    `, [userId, companyId]);

    res.json({
      message: isApplied
        ? `Added "${company.name}" to My Applications (Applied)!`
        : `Unmarked "${company.name}" as applied.`,
      application: {
        ...updated,
        is_applied: Boolean(updated.is_applied),
        is_interviewed: Boolean(updated.is_interviewed)
      }
    });
  } catch (error) {
    console.error('Toggle applied error:', error);
    res.status(500).json({ error: 'Failed to update applied status' });
  }
});

// 3. POST /api/applications/toggle-interviewed - Click for "Interviewed"
applicationsRouter.post('/toggle-interviewed', requireAuth, async (req, res) => {
  try {
    const { companyId, isInterviewed, interviewStage } = req.body;
    const userId = req.user.id;

    if (!companyId) {
      return res.status(400).json({ error: 'companyId is required' });
    }

    const company = await db.get('SELECT id, name FROM companies WHERE id = ?', [companyId]);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const existing = await db.get('SELECT * FROM user_applications WHERE user_id = ? AND company_id = ?', [userId, companyId]);

    const interviewedVal = isInterviewed ? 1 : 0;
    const now = new Date().toISOString();

    if (!existing) {
      const status = isInterviewed ? 'interviewing' : 'to_apply';
      await db.run(`
        INSERT INTO user_applications (
          user_id, company_id, status, is_applied, is_interviewed, applied_date, interview_date, interview_stage, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        userId,
        companyId,
        status,
        interviewedVal,
        interviewedVal,
        isInterviewed ? now : null,
        isInterviewed ? now : null,
        interviewStage || (isInterviewed ? 'Initial Screening' : null),
        now
      ]);
    } else {
      let newStatus = existing.status;
      if (isInterviewed) {
        newStatus = 'interviewing';
      } else {
        newStatus = existing.is_applied ? 'applied' : 'to_apply';
      }

      await db.run(`
        UPDATE user_applications
        SET 
          is_interviewed = ?,
          is_applied = CASE WHEN ? = 1 THEN 1 ELSE is_applied END,
          status = ?,
          interview_date = CASE WHEN ? = 1 THEN COALESCE(interview_date, ?) ELSE interview_date END,
          interview_stage = CASE WHEN ? = 1 THEN COALESCE(interview_stage, ?) ELSE interview_stage END,
          updated_at = ?
        WHERE user_id = ? AND company_id = ?
      `, [
        interviewedVal,
        interviewedVal,
        newStatus,
        interviewedVal,
        now,
        interviewedVal,
        interviewStage || 'Initial Screening',
        now,
        userId,
        companyId
      ]);
    }

    const updated = await db.get(`
      SELECT ua.*, c.name AS company_name, c.careers_url 
      FROM user_applications ua
      JOIN companies c ON ua.company_id = c.id
      WHERE ua.user_id = ? AND ua.company_id = ?
    `, [userId, companyId]);

    res.json({
      message: isInterviewed
        ? `Moved "${company.name}" to Interviewed section!`
        : `Removed "${company.name}" from Interviewed section.`,
      application: {
        ...updated,
        is_applied: Boolean(updated.is_applied),
        is_interviewed: Boolean(updated.is_interviewed)
      }
    });
  } catch (error) {
    console.error('Toggle interviewed error:', error);
    res.status(500).json({ error: 'Failed to update interview status' });
  }
});

// 4. POST /api/applications/save-to-apply - Add to "To Apply" section
applicationsRouter.post('/save-to-apply', requireAuth, async (req, res) => {
  try {
    const { companyId, notes } = req.body;
    const userId = req.user.id;

    const company = await db.get('SELECT id, name FROM companies WHERE id = ?', [companyId]);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const now = new Date().toISOString();
    await db.run(`
      INSERT INTO user_applications (user_id, company_id, status, is_applied, is_interviewed, notes, updated_at)
      VALUES (?, ?, 'to_apply', 0, 0, ?, ?)
      ON CONFLICT(user_id, company_id) DO UPDATE SET
        status = 'to_apply',
        notes = COALESCE(excluded.notes, user_applications.notes),
        updated_at = excluded.updated_at
    `, [userId, companyId, notes || '', now]);

    res.json({ message: `Added "${company.name}" to your To Apply list!` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save to apply' });
  }
});

// 5. POST /api/applications/update-details - Update stage, notes, dates
applicationsRouter.post('/update-details', requireAuth, async (req, res) => {
  try {
    const { companyId, status, notes, interviewStage, interviewDate } = req.body;
    const userId = req.user.id;

    const isApplied = status === 'applied' || status === 'interviewing' || status === 'offered' ? 1 : 0;
    const isInterviewed = status === 'interviewing' || status === 'offered' ? 1 : 0;
    const now = new Date().toISOString();

    await db.run(`
      INSERT INTO user_applications (
        user_id, company_id, status, is_applied, is_interviewed, interview_stage, interview_date, notes, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, company_id) DO UPDATE SET
        status = excluded.status,
        is_applied = excluded.is_applied,
        is_interviewed = excluded.is_interviewed,
        interview_stage = excluded.interview_stage,
        interview_date = excluded.interview_date,
        notes = excluded.notes,
        updated_at = excluded.updated_at
    `, [
      userId,
      companyId,
      status || 'applied',
      isApplied,
      isInterviewed,
      interviewStage || null,
      interviewDate || null,
      notes || '',
      now
    ]);

    res.json({ message: 'Application details updated.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update application details' });
  }
});

// 6. GET /api/applications/stats - Summary counts for dashboard badges
applicationsRouter.get('/stats', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    const totalCompaniesRow = await db.get("SELECT COUNT(*) as count FROM companies WHERE status = 'approved'");
    const totalCompanies = totalCompaniesRow ? Number(totalCompaniesRow.count) : 0;

    const toApplyCountRow = await db.get(`
      SELECT COUNT(*) as count FROM companies c
      LEFT JOIN user_applications ua ON c.id = ua.company_id AND ua.user_id = ?
      WHERE c.status = 'approved' 
        AND (ua.is_applied IS NULL OR ua.is_applied = 0) 
        AND (ua.is_interviewed IS NULL OR ua.is_interviewed = 0)
    `, [userId]);
    const toApplyCount = toApplyCountRow ? Number(toApplyCountRow.count) : 0;

    const appliedCountRow = await db.get(`
      SELECT COUNT(*) as count FROM user_applications 
      WHERE user_id = ? AND (is_applied = 1 OR status = 'applied')
    `, [userId]);
    const appliedCount = appliedCountRow ? Number(appliedCountRow.count) : 0;

    const interviewingCountRow = await db.get(`
      SELECT COUNT(*) as count FROM user_applications 
      WHERE user_id = ? AND (is_interviewed = 1 OR status = 'interviewing')
    `, [userId]);
    const interviewingCount = interviewingCountRow ? Number(interviewingCountRow.count) : 0;

    let pendingApprovalsCount = 0;
    if (isAdmin) {
      const pendingRow = await db.get("SELECT COUNT(*) as count FROM companies WHERE status = 'pending'");
      pendingApprovalsCount = pendingRow ? Number(pendingRow.count) : 0;
    }

    res.json({
      totalCompanies,
      toApplyCount,
      appliedCount,
      interviewingCount,
      pendingApprovalsCount
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch application statistics' });
  }
});
