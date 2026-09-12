const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// GET /api/reports - Calculate rating averages from feedback_responses
router.get('/', verifyToken, async (req, res) => {
  try {
    const {
      academicYear,
      semesterId,
      departmentId,
      feedbackType,
      reportType
    } = req.query;

    let baseQuery = `
      SELECT 
        fr.response_id,
        fr.rating,
        fr.response_type,
        c.courseCode,
        c.courseTitle,
        d.departmentName,
        d.departmentAcr,
        sem.semesterNumber,
        fs.academic_year,
        st.firstName AS staffFirstName,
        st.lastName AS staffLastName,
        u.userName AS staffUserName
      FROM feedback_responses fr
      JOIN feedback_entries fe ON fr.entry_id = fe.entry_id
      JOIN feedback_sessions fs ON fe.session_id = fs.session_id
      LEFT JOIN departments d ON fs.department_id = d.departmentId
      LEFT JOIN semester sem ON fs.semester_id = sem.semesterId
      LEFT JOIN course c ON fr.course_id = c.courseId
      LEFT JOIN cbcs_section_staff css ON fr.cbcs_section_staff_id = css.id
      LEFT JOIN staff_details st ON css.staffId = st.staffId
      LEFT JOIN users u ON st.userId = u.userId
      WHERE fr.rating IS NOT NULL
    `;

    const queryParams = [];

    if (academicYear) {
      baseQuery += ` AND fs.academic_year = ?`;
      queryParams.push(academicYear);
    }
    if (semesterId) {
      baseQuery += ` AND fs.semester_id = ?`;
      queryParams.push(semesterId);
    }
    if (departmentId) {
      baseQuery += ` AND fs.department_id = ?`;
      queryParams.push(departmentId);
    }

    const type = (reportType || 'Department Summary').trim();

    let finalQuery = '';
    
    if (type === 'Faculty Wise') {
      finalQuery = `
        SELECT 
          COALESCE(CONCAT(fr.staffFirstName, ' ', COALESCE(fr.staffLastName, '')), fr.staffUserName, 'Faculty Member') AS label,
          'Faculty' AS categoryType,
          fr.courseCode,
          fr.courseTitle,
          fr.departmentName,
          ROUND(AVG(fr.rating), 2) AS averageRating,
          COUNT(fr.response_id) AS totalResponses
        FROM (${baseQuery}) fr
        GROUP BY label, fr.courseCode, fr.courseTitle, fr.departmentName
        ORDER BY averageRating DESC
      `;
    } else if (type === 'Subject Wise') {
      finalQuery = `
        SELECT 
          COALESCE(fr.courseTitle, 'General Subject') AS label,
          COALESCE(fr.courseCode, 'N/A') AS courseCode,
          fr.departmentName,
          ROUND(AVG(fr.rating), 2) AS averageRating,
          COUNT(fr.response_id) AS totalResponses
        FROM (${baseQuery}) fr
        GROUP BY label, courseCode, fr.departmentName
        ORDER BY averageRating DESC
      `;
    } else if (type === 'Overall Summary') {
      finalQuery = `
        SELECT 
          'Overall College Feedback' AS label,
          ROUND(AVG(fr.rating), 2) AS averageRating,
          COUNT(fr.response_id) AS totalResponses
        FROM (${baseQuery}) fr
      `;
    } else {
      // Department Summary
      finalQuery = `
        SELECT 
          COALESCE(fr.departmentName, 'General') AS label,
          COALESCE(fr.departmentAcr, 'GEN') AS departmentAcr,
          ROUND(AVG(fr.rating), 2) AS averageRating,
          COUNT(fr.response_id) AS totalResponses
        FROM (${baseQuery}) fr
        GROUP BY label, departmentAcr
        ORDER BY averageRating DESC
      `;
    }

    const [results] = await pool.query(finalQuery, queryParams);

    return res.json({
      success: true,
      reportType: type,
      filtersApplied: { academicYear, semesterId, departmentId, feedbackType, reportType },
      data: results
    });

  } catch (err) {
    console.error('[REPORTS ERROR]:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate report.' });
  }
});

module.exports = router;
