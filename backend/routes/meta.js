const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');

// GET /api/meta/categories
router.get('/categories', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT DISTINCT category_id, category_name, description, status FROM feedback_categories ORDER BY category_name ASC`);
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[META ERROR] Categories:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
});

// POST /api/meta/categories - Super Admin create category
router.post('/categories', verifyToken, requireRole('super-admin', 'superadmin'), async (req, res) => {
  try {
    const { category_name, description } = req.body;
    if (!category_name || !category_name.trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    const [existing] = await pool.query('SELECT * FROM feedback_categories WHERE category_name = ?', [category_name.trim()]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Category already exists.' });
    }

    const [result] = await pool.query(
      'INSERT INTO feedback_categories (category_name, description, status, created_at, updated_at) VALUES (?, ?, 1, NOW(), NOW())',
      [category_name.trim(), description || '']
    );

    return res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: { category_id: result.insertId, category_name: category_name.trim(), description: description || '', status: 1 }
    });
  } catch (err) {
    console.error('[META ERROR] POST Category:', err);
    return res.status(500).json({ success: false, message: 'Failed to create category' });
  }
});

// PUT /api/meta/categories/:id - Super Admin edit category
router.put('/categories/:id', verifyToken, requireRole('super-admin', 'superadmin'), async (req, res) => {
  try {
    const categoryId = req.params.id;
    const { category_name, description, status } = req.body;

    const [existing] = await pool.query('SELECT * FROM feedback_categories WHERE category_id = ?', [categoryId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    if (category_name && category_name.trim()) {
      const [dup] = await pool.query('SELECT * FROM feedback_categories WHERE category_name = ? AND category_id != ?', [category_name.trim(), categoryId]);
      if (dup.length > 0) {
        return res.status(400).json({ success: false, message: 'Another category with this name already exists.' });
      }
    }

    const newName = category_name !== undefined ? category_name.trim() : existing[0].category_name;
    const newDesc = description !== undefined ? description : existing[0].description;
    const newStatus = status !== undefined ? status : existing[0].status;

    await pool.query(
      'UPDATE feedback_categories SET category_name = ?, description = ?, status = ?, updated_at = NOW() WHERE category_id = ?',
      [newName, newDesc, newStatus, categoryId]
    );

    return res.json({
      success: true,
      message: 'Category updated successfully',
      data: { category_id: Number(categoryId), category_name: newName, description: newDesc, status: newStatus }
    });
  } catch (err) {
    console.error('[META ERROR] PUT Category:', err);
    return res.status(500).json({ success: false, message: 'Failed to update category' });
  }
});

// DELETE /api/meta/categories/:id - Super Admin delete/deactivate category
router.delete('/categories/:id', verifyToken, requireRole('super-admin', 'superadmin'), async (req, res) => {
  try {
    const categoryId = req.params.id;
    const [existing] = await pool.query('SELECT * FROM feedback_categories WHERE category_id = ?', [categoryId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Check usage in questions or sessions
    const [questions] = await pool.query('SELECT COUNT(*) as count FROM feedback_questions WHERE category_id = ?', [categoryId]);
    const [sessions] = await pool.query('SELECT COUNT(*) as count FROM feedback_sessions WHERE category_id = ?', [categoryId]);

    if (questions[0].count > 0 || sessions[0].count > 0) {
      // Soft deactivate
      await pool.query('UPDATE feedback_categories SET status = 0, updated_at = NOW() WHERE category_id = ?', [categoryId]);
      return res.json({
        success: true,
        message: 'Category is referenced by existing questions/sessions. Safely deactivated.'
      });
    } else {
      // Hard delete
      await pool.query('DELETE FROM feedback_categories WHERE category_id = ?', [categoryId]);
      return res.json({
        success: true,
        message: 'Category deleted successfully.'
      });
    }
  } catch (err) {
    console.error('[META ERROR] DELETE Category:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete category' });
  }
});

// GET /api/meta/question-types
router.get('/question-types', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT DISTINCT type_id, type_name, description, status FROM feedback_question_types ORDER BY type_name ASC`);
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[META ERROR] Question Types:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch question types' });
  }
});

// POST /api/meta/question-types - Super Admin create question type
router.post('/question-types', verifyToken, requireRole('super-admin', 'superadmin'), async (req, res) => {
  try {
    const { type_name, description } = req.body;
    if (!type_name || !type_name.trim()) {
      return res.status(400).json({ success: false, message: 'Question type name is required.' });
    }

    const [existing] = await pool.query('SELECT * FROM feedback_question_types WHERE type_name = ?', [type_name.trim()]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Question type already exists.' });
    }

    const [result] = await pool.query(
      'INSERT INTO feedback_question_types (type_name, description, status, created_at, updated_at) VALUES (?, ?, 1, NOW(), NOW())',
      [type_name.trim(), description || '']
    );

    return res.status(201).json({
      success: true,
      message: 'Question type created successfully',
      data: { type_id: result.insertId, type_name: type_name.trim(), description: description || '', status: 1 }
    });
  } catch (err) {
    console.error('[META ERROR] POST Question Type:', err);
    return res.status(500).json({ success: false, message: 'Failed to create question type' });
  }
});

// PUT /api/meta/question-types/:id - Super Admin edit question type
router.put('/question-types/:id', verifyToken, requireRole('super-admin', 'superadmin'), async (req, res) => {
  try {
    const typeId = req.params.id;
    const { type_name, description, status } = req.body;

    const [existing] = await pool.query('SELECT * FROM feedback_question_types WHERE type_id = ?', [typeId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Question type not found' });
    }

    if (type_name && type_name.trim()) {
      const [dup] = await pool.query('SELECT * FROM feedback_question_types WHERE type_name = ? AND type_id != ?', [type_name.trim(), typeId]);
      if (dup.length > 0) {
        return res.status(400).json({ success: false, message: 'Another question type with this name already exists.' });
      }
    }

    const newName = type_name !== undefined ? type_name.trim() : existing[0].type_name;
    const newDesc = description !== undefined ? description : existing[0].description;
    const newStatus = status !== undefined ? status : existing[0].status;

    await pool.query(
      'UPDATE feedback_question_types SET type_name = ?, description = ?, status = ?, updated_at = NOW() WHERE type_id = ?',
      [newName, newDesc, newStatus, typeId]
    );

    return res.json({
      success: true,
      message: 'Question type updated successfully',
      data: { type_id: Number(typeId), type_name: newName, description: newDesc, status: newStatus }
    });
  } catch (err) {
    console.error('[META ERROR] PUT Question Type:', err);
    return res.status(500).json({ success: false, message: 'Failed to update question type' });
  }
});

// DELETE /api/meta/question-types/:id - Super Admin delete/deactivate question type
router.delete('/question-types/:id', verifyToken, requireRole('super-admin', 'superadmin'), async (req, res) => {
  try {
    const typeId = req.params.id;
    const [existing] = await pool.query('SELECT * FROM feedback_question_types WHERE type_id = ?', [typeId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Question type not found' });
    }

    // Check usage in questions
    const [questions] = await pool.query('SELECT COUNT(*) as count FROM feedback_questions WHERE type_id = ?', [typeId]);

    if (questions[0].count > 0) {
      // Soft deactivate
      await pool.query('UPDATE feedback_question_types SET status = 0, updated_at = NOW() WHERE type_id = ?', [typeId]);
      return res.json({
        success: true,
        message: 'Question type is referenced by existing questions. Safely deactivated.'
      });
    } else {
      // Hard delete
      await pool.query('DELETE FROM feedback_question_types WHERE type_id = ?', [typeId]);
      return res.json({
        success: true,
        message: 'Question type deleted successfully.'
      });
    }
  } catch (err) {
    console.error('[META ERROR] DELETE Question Type:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete question type' });
  }
});

// GET /api/meta/departments - Filter active and non-deleted departments only
router.get('/departments', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT DISTINCT departmentId, departmentName, departmentAcr, status 
       FROM departments 
       WHERE status = 'Active' AND deletedAt IS NULL 
       ORDER BY departmentName ASC`
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[META ERROR] Departments:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch departments' });
  }
});

// GET /api/meta/semesters - Return UNIQUE semester numbers to avoid duplicate options in UI dropdowns
router.get('/semesters', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT DISTINCT semesterNumber, MIN(semesterId) AS semesterId 
       FROM semester 
       GROUP BY semesterNumber 
       ORDER BY semesterNumber ASC`
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[META ERROR] Semesters:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch semesters' });
  }
});

// GET /api/meta/academic-years
router.get('/academic-years', verifyToken, async (req, res) => {
  try {
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
