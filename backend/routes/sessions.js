const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');

// GET /api/feedback-sessions - Fetch all sessions with semester & department details
router.get('/', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.*, 
              sem.semesterNumber, 
              sem.batchId,
              d.departmentName, 
              d.departmentAcr,
              c.category_name
       FROM feedback_sessions s
       LEFT JOIN semester sem ON s.semester_id = sem.semesterId
       LEFT JOIN departments d ON s.department_id = d.departmentId
       LEFT JOIN feedback_categories c ON s.category_id = c.category_id
       ORDER BY s.session_id DESC`
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[SESSIONS ERROR] GET:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch feedback sessions' });
  }
});

// POST /api/feedback-sessions - Add a session
router.post('/', verifyToken, requireRole('super-admin', 'superadmin'), async (req, res) => {
  try {
    const {
      category_id,
      academic_year,
      semester_id,
      department_id,
      session_name,
      description,
      start_date,
      end_date,
      status
    } = req.body;

    const userId = req.user.userId || 1;
    const now = new Date();

    const [result] = await pool.query(
      `INSERT INTO feedback_sessions
       (category_id, academic_year, semester_id, department_id, session_name, description, start_date, end_date, status, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        category_id || 1,
        academic_year || '2026-27',
        semester_id || 1,
        department_id || 1,
        session_name || 'Feedback Session',
        description || '',
        start_date || now,
        end_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status || 'Pending',
        userId,
        now,
        now
      ]
    );

    const [created] = await pool.query(`SELECT * FROM feedback_sessions WHERE session_id = ?`, [result.insertId]);
    return res.status(201).json({ success: true, message: 'Session created', data: created[0] });
  } catch (err) {
    console.error('[SESSIONS ERROR] POST:', err);
    return res.status(500).json({ success: false, message: 'Failed to create session' });
  }
});

// PUT /api/feedback-sessions/:id - Update session
router.put('/:id', verifyToken, requireRole('super-admin', 'superadmin'), async (req, res) => {
  try {
    const sessionId = req.params.id;
    const {
      academic_year,
      semester_id,
      department_id,
      session_name,
      status
    } = req.body;

    const [existing] = await pool.query(`SELECT * FROM feedback_sessions WHERE session_id = ?`, [sessionId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    await pool.query(
      `UPDATE feedback_sessions
       SET academic_year = ?,
           semester_id = ?,
           department_id = ?,
           session_name = ?,
           status = ?,
           updated_at = NOW()
       WHERE session_id = ?`,
      [
        academic_year || existing[0].academic_year,
        semester_id || existing[0].semester_id,
        department_id || existing[0].department_id,
        session_name || existing[0].session_name,
        status || existing[0].status,
        sessionId
      ]
    );

    const [updated] = await pool.query(`SELECT * FROM feedback_sessions WHERE session_id = ?`, [sessionId]);
    return res.json({ success: true, message: 'Session updated successfully', data: updated[0] });
  } catch (err) {
    console.error('[SESSIONS ERROR] PUT:', err);
    return res.status(500).json({ success: false, message: 'Failed to update session' });
  }
});

// POST /api/feedback-sessions/:id/enable - Enable pending feedback session
router.post('/:id/enable', verifyToken, requireRole('super-admin', 'superadmin'), async (req, res) => {
  try {
    const sessionId = req.params.id;

    const [existing] = await pool.query(`SELECT * FROM feedback_sessions WHERE session_id = ?`, [sessionId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    await pool.query(
      `UPDATE feedback_sessions SET status = 'Active', updated_at = NOW() WHERE session_id = ?`,
      [sessionId]
    );

    return res.json({
      success: true,
      message: 'Feedback session has been approved and enabled.'
    });
  } catch (err) {
    console.error('[SESSIONS ERROR] ENABLE:', err);
    return res.status(500).json({ success: false, message: 'Failed to enable session' });
  }
});

module.exports = router;
