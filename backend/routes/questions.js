const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');

// GET /api/questions - List all feedback questions with category and type names
router.get('/', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT q.*, 
              c.category_name, 
              t.type_name
       FROM feedback_questions q
       LEFT JOIN feedback_categories c ON q.category_id = c.category_id
       LEFT JOIN feedback_question_types t ON q.type_id = t.type_id
       ORDER BY q.display_order ASC, q.question_id DESC`
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[QUESTIONS ERROR] GET:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch questions' });
  }
});

// POST /api/questions - Super Admin add new question
router.post('/', verifyToken, requireRole('super-admin', 'superadmin'), async (req, res) => {
  try {
    const {
      category_id,
      type_id,
      question_text,
      applicable_course_type,
      display_order,
      is_required,
      status
    } = req.body;

    if (!category_id || !type_id || !question_text) {
      return res.status(400).json({
        success: false,
        message: 'Category, Question Type, and Question Text are required.'
      });
    }

    const userId = req.user.userId || 1;
    const now = new Date();

    const [result] = await pool.query(
      `INSERT INTO feedback_questions 
       (category_id, type_id, question_text, applicable_course_type, display_order, is_required, status, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        category_id,
        type_id,
        question_text,
        applicable_course_type || 'All',
        display_order || 1,
        is_required !== undefined ? is_required : 1,
        status !== undefined ? status : 1,
        userId,
        now,
        now
      ]
    );

    // Fetch the newly created question with joined fields
    const [newQuestion] = await pool.query(
      `SELECT q.*, c.category_name, t.type_name
       FROM feedback_questions q
       LEFT JOIN feedback_categories c ON q.category_id = c.category_id
       LEFT JOIN feedback_question_types t ON q.type_id = t.type_id
       WHERE q.question_id = ?`,
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: 'Feedback question created successfully',
      data: newQuestion[0]
    });
  } catch (err) {
    console.error('[QUESTIONS ERROR] POST:', err);
    return res.status(500).json({ success: false, message: 'Failed to create question.' });
  }
});

// PUT /api/questions/:id - Super Admin edit question
router.put('/:id', verifyToken, requireRole('super-admin', 'superadmin'), async (req, res) => {
  try {
    const questionId = req.params.id;
    const {
      category_id,
      type_id,
      question_text,
      applicable_course_type,
      display_order,
      is_required,
      status
    } = req.body;

    const userId = req.user.userId || 1;
    const now = new Date();

    const [existing] = await pool.query(`SELECT * FROM feedback_questions WHERE question_id = ?`, [questionId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    await pool.query(
      `UPDATE feedback_questions
       SET category_id = ?,
           type_id = ?,
           question_text = ?,
           applicable_course_type = ?,
           display_order = ?,
           is_required = ?,
           status = ?,
           updated_by = ?,
           updated_at = ?
       WHERE question_id = ?`,
      [
        category_id !== undefined ? category_id : existing[0].category_id,
        type_id !== undefined ? type_id : existing[0].type_id,
        question_text !== undefined ? question_text : existing[0].question_text,
        applicable_course_type !== undefined ? applicable_course_type : existing[0].applicable_course_type,
        display_order !== undefined ? display_order : existing[0].display_order,
        is_required !== undefined ? is_required : existing[0].is_required,
        status !== undefined ? status : existing[0].status,
        userId,
        now,
        questionId
      ]
    );

    const [updated] = await pool.query(
      `SELECT q.*, c.category_name, t.type_name
       FROM feedback_questions q
       LEFT JOIN feedback_categories c ON q.category_id = c.category_id
       LEFT JOIN feedback_question_types t ON q.type_id = t.type_id
       WHERE q.question_id = ?`,
      [questionId]
    );

    return res.json({
      success: true,
      message: 'Question updated successfully',
      data: updated[0]
    });
  } catch (err) {
    console.error('[QUESTIONS ERROR] PUT:', err);
    return res.status(500).json({ success: false, message: 'Failed to update question.' });
  }
});

// DELETE /api/questions/:id - Safe deactivation of question
router.delete('/:id', verifyToken, requireRole('super-admin', 'superadmin'), async (req, res) => {
  try {
    const questionId = req.params.id;

    // Check if question is referenced in feedback_responses
    const [responses] = await pool.query(
      `SELECT COUNT(*) as count FROM feedback_responses WHERE question_id = ?`,
      [questionId]
    );

    if (responses[0].count > 0) {
      // Safe deactivation
      await pool.query(
        `UPDATE feedback_questions SET status = 0, updated_at = NOW() WHERE question_id = ?`,
        [questionId]
      );
      return res.json({
        success: true,
        message: 'Question referenced in feedback responses. Deactivated safely.'
      });
    } else {
      // Hard delete if not referenced
      await pool.query(`DELETE FROM feedback_questions WHERE question_id = ?`, [questionId]);
      return res.json({
        success: true,
        message: 'Question deleted successfully.'
      });
    }
  } catch (err) {
    console.error('[QUESTIONS ERROR] DELETE:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete question.' });
  }
});

module.exports = router;
