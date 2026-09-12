const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// GET /api/meta/categories
router.get('/categories', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT * FROM feedback_categories ORDER BY category_name ASC`);
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[META ERROR] Categories:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
});

// GET /api/meta/question-types
router.get('/question-types', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT * FROM feedback_question_types ORDER BY type_name ASC`);
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[META ERROR] Question Types:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch question types' });
  }
});

// GET /api/meta/departments
router.get('/departments', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT * FROM departments WHERE status = 'Active' ORDER BY departmentName ASC`);
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[META ERROR] Departments:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch departments' });
  }
});

// GET /api/meta/semesters
router.get('/semesters', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT * FROM semester ORDER BY semesterNumber ASC`);
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[META ERROR] Semesters:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch semesters' });
  }
});

// GET /api/meta/academic-years
router.get('/academic-years', verifyToken, async (req, res) => {
  try {
    // Generate recent/current academic years as options
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = -2; i <= 2; i++) {
      const start = currentYear + i;
      years.push(`${start}-${(start + 1).toString().slice(-2)}`);
    }
    return res.json({ success: true, data: years });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch academic years' });
  }
});

module.exports = router;
