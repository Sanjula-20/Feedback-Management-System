const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');

// GET /api/queries - Fetch private student queries (SUPER ADMIN ONLY)
router.get('/', verifyToken, requireRole('super-admin', 'superadmin'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT q.*, 
              c.courseCode, 
              c.courseTitle,
              st.firstName AS staffFirstName,
              st.lastName AS staffLastName,
              u.userName AS studentName
       FROM feedback_queries q
       LEFT JOIN course c ON q.course_id = c.courseId
       LEFT JOIN cbcs_section_staff css ON q.cbcs_section_staff_id = css.id
       LEFT JOIN staff_details st ON css.staffId = st.staffId
       LEFT JOIN student_details sdet ON q.student_id = sdet.studentId
       LEFT JOIN users u ON sdet.userId = u.userId
       ORDER BY q.query_id DESC`
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[QUERIES ERROR] GET:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch student queries' });
  }
});

// POST /api/queries - Student submits private query
router.post('/', verifyToken, async (req, res) => {
  try {
    const { entry_id, student_id, regno, course_id, cbcs_section_staff_id, query_text } = req.body;

    if (!query_text || !query_text.trim()) {
      return res.status(400).json({ success: false, message: 'Query text is required.' });
    }

    const now = new Date();
    const [result] = await pool.query(
      `INSERT INTO feedback_queries 
       (entry_id, student_id, regno, course_id, cbcs_section_staff_id, query_text, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'Pending', ?, ?)`,
      [
        entry_id || 0,
        student_id || req.user.userId,
        regno || req.user.userNumber || 'REG_UNKNOWN',
        course_id || null,
        cbcs_section_staff_id || null,
        query_text.trim(),
        now,
        now
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Private query submitted successfully to Super Admin.',
      query_id: result.insertId
    });
  } catch (err) {
    console.error('[QUERIES ERROR] POST:', err);
    return res.status(500).json({ success: false, message: 'Failed to submit query.' });
  }
});

// PUT /api/queries/:id/resolve - Super Admin marks query as Resolved
router.put('/:id/resolve', verifyToken, requireRole('super-admin', 'superadmin'), async (req, res) => {
  try {
    const queryId = req.params.id;
    const userId = req.user.userId || 1;

    const [existing] = await pool.query(`SELECT * FROM feedback_queries WHERE query_id = ?`, [queryId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Query not found' });
    }

    await pool.query(
      `UPDATE feedback_queries 
       SET status = 'Resolved', resolved_by = ?, resolved_at = NOW(), updated_at = NOW() 
       WHERE query_id = ?`,
      [userId, queryId]
    );

    return res.json({
      success: true,
      message: `Private student query #${queryId} marked as Resolved.`
    });
  } catch (err) {
    console.error('[QUERIES ERROR] RESOLVE:', err);
    return res.status(500).json({ success: false, message: 'Failed to resolve query.' });
  }
});

module.exports = router;
