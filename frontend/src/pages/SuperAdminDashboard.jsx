import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import '../styles/dashboard.css';

const SuperAdminDashboard = () => {
  const { user, logout } = useAuth();

  // Questions state
  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [questionTypes, setQuestionTypes] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);

  // Question Modal state
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [questionForm, setQuestionForm] = useState({
    category_id: '',
    type_id: '',
    question_text: '',
    applicable_course_type: 'All',
    display_order: 1,
    is_required: 1,
    status: 1
  });

  // Sessions state
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  // Meta dropdowns for reports & sessions
  const [departments, setDepartments] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);

  // Report section state
  const [reportFilters, setReportFilters] = useState({
    academicYear: '',
    semesterId: '',
    departmentId: '',
    feedbackType: '',
    reportType: 'Department Summary'
  });
  const [reportData, setReportData] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);

  // Notifications / Alert message
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      // Fetch metadata
      const [catsRes, typesRes, deptsRes, semsRes, yearsRes] = await Promise.all([
        api.get('/meta/categories'),
        api.get('/meta/question-types'),
        api.get('/meta/departments'),
        api.get('/meta/semesters'),
        api.get('/meta/academic-years')
      ]);

      if (catsRes.data.success) setCategories(catsRes.data.data);
      if (typesRes.data.success) setQuestionTypes(typesRes.data.data);
      if (deptsRes.data.success) setDepartments(deptsRes.data.data);
      if (semsRes.data.success) setSemesters(semsRes.data.data);
      if (yearsRes.data.success) setAcademicYears(yearsRes.data.data);

      // Fetch questions & sessions
      fetchQuestions();
      fetchSessions();
    } catch (err) {
      console.error('Error fetching initial data:', err);
    }
  };

  const fetchQuestions = async () => {
    setLoadingQuestions(true);
    try {
      const res = await api.get('/questions');
      if (res.data.success) {
        setQuestions(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch questions:', err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await api.get('/feedback-sessions');
      if (res.data.success) {
        setSessions(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    } finally {
      setLoadingSessions(false);
    }
  };

  // Open Question Modal for Create
  const handleOpenAddModal = () => {
    setEditingQuestion(null);
    setQuestionForm({
      category_id: categories.length > 0 ? categories[0].category_id : '',
      type_id: questionTypes.length > 0 ? questionTypes[0].type_id : '',
      question_text: '',
      applicable_course_type: 'THEORY',
      display_order: questions.length + 1,
      is_required: 1,
      status: 1
    });
    setShowQuestionModal(true);
  };

  // Open Question Modal for Edit
  const handleOpenEditModal = (q) => {
    setEditingQuestion(q);
    setQuestionForm({
      category_id: q.category_id,
      type_id: q.type_id,
      question_text: q.question_text,
      applicable_course_type: q.applicable_course_type || 'Theory / Lab',
      display_order: q.display_order || 1,
      is_required: q.is_required ? 1 : 0,
      status: q.status ? 1 : 0
    });
    setShowQuestionModal(true);
  };

  // Save Question (Add or Edit)
  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    if (!questionForm.question_text.trim()) {
      alert('Question text is required.');
      return;
    }

    try {
      if (editingQuestion) {
        // PUT update
        const res = await api.put(`/questions/${editingQuestion.question_id}`, questionForm);
        if (res.data.success) {
          setMessage({ type: 'success', text: 'Question updated successfully.' });
          fetchQuestions();
        }
      } else {
        // POST create
        const res = await api.post('/questions', questionForm);
        if (res.data.success) {
          setMessage({ type: 'success', text: 'New question added successfully.' });
          fetchQuestions();
        }
      }
      setShowQuestionModal(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save question.');
    }
  };

  // Delete Question
  const handleDeleteQuestion = async (id) => {
    if (!window.confirm('Are you sure you want to delete / deactivate this question?')) {
      return;
    }

    try {
      const res = await api.delete(`/questions/${id}`);
      if (res.data.success) {
        setMessage({ type: 'success', text: res.data.message });
        fetchQuestions();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete question.');
    }
  };

  // Enable Pending Session
  const handleEnableSession = async (sessionId) => {
    try {
      const res = await api.post(`/feedback-sessions/${sessionId}/enable`);
      if (res.data.success) {
        setMessage({ type: 'success', text: 'Feedback session successfully enabled!' });
        fetchSessions();
      }
    } catch (err) {
      alert('Failed to enable feedback session.');
    }
  };

  // Generate Report
  const handleGenerateReport = async (e) => {
    e.preventDefault();
    setLoadingReport(true);
    try {
      const res = await api.get('/reports', { params: reportFilters });
      if (res.data.success) {
        setReportData(res.data);
      }
    } catch (err) {
      console.error('Failed to generate report:', err);
      alert('Failed to generate feedback report.');
    } finally {
      setLoadingReport(false);
    }
  };

  return (
    <div className="dashboard-container">
      {/* Top Bar Navigation */}
      <header className="dashboard-header">
        <div className="header-brand">
          <div className="brand-badge">IMS FEEDBACK</div>
          <h2>College Management Portal</h2>
        </div>
        <div className="user-profile-bar">
          <div className="user-info-text">
            <div className="user-name">{user?.userName || 'Super Admin'}</div>
            <div className="user-role">{user?.roleName || 'SuperAdmin'} ({user?.userNumber || 'SA01'})</div>
          </div>
          <button className="btn-logout" onClick={logout}>Sign Out</button>
        </div>
      </header>

      <main className="dashboard-content">
        {/* Flash Message Banner */}
        {message && (
          <div style={{
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: message.type === 'success' ? '#dcfce7' : '#fee2e2',
            color: message.type === 'success' ? '#15803d' : '#991b1b',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: '700' }}>×</button>
          </div>
        )}

        {/* 1. WELCOME SUPER ADMIN */}
        <section className="welcome-card">
          <div>
            <h1>WELCOME SUPER ADMIN</h1>
            <p>Feedback Management System Administrator Dashboard</p>
          </div>
          <div className="welcome-badge">System Status: Active</div>
        </section>

        {/* 2. FEEDBACK QUESTION MANAGEMENT */}
        <section className="dashboard-section">
          <div className="section-header">
            <h3>FEEDBACK QUESTION MANAGEMENT</h3>
            <button className="btn-primary" onClick={handleOpenAddModal}>
              + Add New Question
            </button>
          </div>

          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Feedback Type</th>
                  <th>Sub Type</th>
                  <th>Question Type</th>
                  <th>Question Text</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingQuestions ? (
                  <tr>
                    <td colSpan="7" className="empty-table-state">Loading questions from database...</td>
                  </tr>
                ) : questions.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="empty-table-state">No questions found. Click <strong>+ Add New Question</strong> to create one.</td>
                  </tr>
                ) : (
                  questions.map((q) => (
                    <tr key={q.question_id}>
                      <td>#{q.question_id}</td>
                      <td><strong>{q.category_name || `Category #${q.category_id}`}</strong></td>
                      <td>{q.applicable_course_type || 'All'}</td>
                      <td>{q.type_name || `Type #${q.type_id}`}</td>
                      <td style={{ maxWidth: '320px' }}>{q.question_text}</td>
                      <td>
                        <span className={`status-pill ${q.status ? 'active' : 'inactive'}`}>
                          {q.status ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <button className="btn-action-edit" onClick={() => handleOpenEditModal(q)}>Edit</button>
                        <button className="btn-action-delete" onClick={() => handleDeleteQuestion(q.question_id)}>Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* 3. FEEDBACK SESSIONS PENDING APPROVAL */}
        <section className="dashboard-section">
          <div className="section-header">
            <h3>FEEDBACK SESSIONS PENDING APPROVAL</h3>
          </div>

          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Academic Year</th>
                  <th>Semester</th>
                  <th>Department</th>
                  <th>Session Name</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingSessions ? (
                  <tr>
                    <td colSpan="6" className="empty-table-state">Loading pending feedback sessions...</td>
                  </tr>
                ) : sessions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="empty-table-state">No feedback sessions available in the system.</td>
                  </tr>
                ) : (
                  sessions.map((s) => (
                    <tr key={s.session_id}>
                      <td><strong>{s.academic_year}</strong></td>
                      <td>Sem {s.semesterNumber || s.semester_id || 'V'}</td>
                      <td>{s.departmentAcr || s.departmentName || 'CSE'}</td>
                      <td>{s.session_name}</td>
                      <td>
                        <span className={`status-pill ${s.status === 'Active' ? 'active' : 'pending'}`}>
                          {s.status || 'Pending'}
                        </span>
                      </td>
                      <td>
                        <button className="btn-action-preview" onClick={() => alert(`Preview Session #${s.session_id}: ${s.session_name}`)}>Preview</button>
                        <button className="btn-action-edit" onClick={() => alert(`Edit Session #${s.session_id}`)}>Edit</button>
                        {s.status !== 'Active' && (
                          <button className="btn-action-enable" onClick={() => handleEnableSession(s.session_id)}>Enable</button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* 4. REPORT SECTION */}
        <section className="dashboard-section">
          <div className="section-header">
            <h3>REPORT SECTION</h3>
          </div>

          <form onSubmit={handleGenerateReport}>
            <div className="report-filters-grid">
              <div className="report-filter-item">
                <label>Academic Year</label>
                <select
                  value={reportFilters.academicYear}
                  onChange={(e) => setReportFilters({ ...reportFilters, academicYear: e.target.value })}
                >
                  <option value="">All Academic Years</option>
                  {academicYears.map((yr, idx) => (
                    <option key={idx} value={yr}>{yr}</option>
                  ))}
                </select>
              </div>

              <div className="report-filter-item">
                <label>Semester</label>
                <select
                  value={reportFilters.semesterId}
                  onChange={(e) => setReportFilters({ ...reportFilters, semesterId: e.target.value })}
                >
                  <option value="">All Semesters</option>
                  {semesters.map((sem) => (
                    <option key={sem.semesterId} value={sem.semesterId}>
                      Semester {sem.semesterNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div className="report-filter-item">
                <label>Department</label>
                <select
                  value={reportFilters.departmentId}
                  onChange={(e) => setReportFilters({ ...reportFilters, departmentId: e.target.value })}
                >
                  <option value="">All Departments</option>
                  {departments.map((d) => (
                    <option key={d.departmentId} value={d.departmentId}>
                      {d.departmentAcr} - {d.departmentName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="report-filter-item">
                <label>Feedback Type</label>
                <select
                  value={reportFilters.feedbackType}
                  onChange={(e) => setReportFilters({ ...reportFilters, feedbackType: e.target.value })}
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.category_id} value={cat.category_id}>
                      {cat.category_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="report-filter-item">
                <label>Report Type</label>
                <select
                  value={reportFilters.reportType}
                  onChange={(e) => setReportFilters({ ...reportFilters, reportType: e.target.value })}
                >
                  <option value="Department Summary">Department Summary</option>
                  <option value="Faculty Wise">Faculty Wise</option>
                  <option value="Subject Wise">Subject Wise</option>
                  <option value="Overall Summary">Overall Summary</option>
                </select>
              </div>
            </div>

            <div className="report-actions">
              <button type="submit" className="btn-primary" disabled={loadingReport}>
                {loadingReport ? 'Calculating Ratings...' : '[ Generate ]'}
              </button>
            </div>
          </form>

          {/* Generated Report Output */}
          {reportData && (
            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '2px dashed #e2e8f0' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#0f172a' }}>
                Generated Report Results: <span style={{ color: '#0284c7' }}>{reportData.reportType}</span>
              </h4>

              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Entity / Description</th>
                      <th>Course / Details</th>
                      <th>Department</th>
                      <th>Total Submissions</th>
                      <th>Calculated Rating Avg</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.data.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="empty-table-state">
                          No student response ratings found for the selected filter parameters.
                        </td>
                      </tr>
                    ) : (
                      reportData.data.map((row, idx) => (
                        <tr key={idx}>
                          <td><strong>{row.label}</strong></td>
                          <td>{row.courseCode ? `${row.courseCode} - ${row.courseTitle || ''}` : 'N/A'}</td>
                          <td>{row.departmentName || 'All Departments'}</td>
                          <td>{row.totalResponses || 0}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{
                                fontWeight: '700',
                                color: row.averageRating >= 4 ? '#15803d' : row.averageRating >= 3 ? '#0284c7' : '#b45309'
                              }}>
                                {row.averageRating || '0.00'} / 5.00
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Add / Edit Question Modal */}
      {showQuestionModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h4>{editingQuestion ? 'Edit Question' : 'Add New Question'}</h4>
              <button className="btn-close-modal" onClick={() => setShowQuestionModal(false)}>×</button>
            </div>

            <form onSubmit={handleSaveQuestion}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Feedback Category</label>
                  <select
                    value={questionForm.category_id}
                    onChange={(e) => setQuestionForm({ ...questionForm, category_id: e.target.value })}
                    required
                  >
                    {categories.map((c) => (
                      <option key={c.category_id} value={c.category_id}>
                        {c.category_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Sub Type / Course Type</label>
                  <select
                    value={questionForm.applicable_course_type}
                    onChange={(e) => setQuestionForm({ ...questionForm, applicable_course_type: e.target.value })}
                    required
                  >
                    <option value="All">All / General</option>
                    <option value="THEORY">THEORY</option>
                    <option value="PRACTICAL">PRACTICAL / LAB</option>
                    <option value="INTEGRATED">INTEGRATED (Theory + Lab)</option>
                    <option value="EXPERIENTIAL LEARNING">EXPERIENTIAL LEARNING</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Question Type</label>
                  <select
                    value={questionForm.type_id}
                    onChange={(e) => setQuestionForm({ ...questionForm, type_id: e.target.value })}
                    required
                  >
                    {questionTypes.map((t) => (
                      <option key={t.type_id} value={t.type_id}>
                        {t.type_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Question Text</label>
                  <textarea
                    rows="3"
                    placeholder="Enter full question text here..."
                    value={questionForm.question_text}
                    onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Display Order</label>
                    <input
                      type="number"
                      min="1"
                      value={questionForm.display_order}
                      onChange={(e) => setQuestionForm({ ...questionForm, display_order: parseInt(e.target.value, 10) })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Required</label>
                    <select
                      value={questionForm.is_required}
                      onChange={(e) => setQuestionForm({ ...questionForm, is_required: parseInt(e.target.value, 10) })}
                    >
                      <option value={1}>Yes (Required)</option>
                      <option value={0}>No (Optional)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Status</label>
                    <select
                      value={questionForm.status}
                      onChange={(e) => setQuestionForm({ ...questionForm, status: parseInt(e.target.value, 10) })}
                    >
                      <option value={1}>Active</option>
                      <option value={0}>Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowQuestionModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">
                  {editingQuestion ? 'Save Changes' : 'Create Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
