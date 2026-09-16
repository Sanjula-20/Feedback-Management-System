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
    applicable_course_type: 'THEORY',
    display_order: 1,
    is_required: 1,
    status: 1
  });

  // Sessions state
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [sessionForm, setSessionForm] = useState({
    category_id: '',
    academic_year: '2026-27',
    semester_id: '',
    department_id: '',
    session_name: '',
    description: '',
    start_date: '',
    end_date: '',
    status: 'Pending'
  });

  // Preview Session Modal state
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Private Student Queries state (RESTRICTED TO SUPER ADMIN ONLY)
  const [queries, setQueries] = useState([]);
  const [loadingQueries, setLoadingQueries] = useState(true);

  // Category & Question Type Manager Modals
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  const [categoryForm, setCategoryForm] = useState({ category_name: '', description: '', status: 1 });

  const [showTypeModal, setShowTypeModal] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [showTypeForm, setShowTypeForm] = useState(false);
  const [typeSearchTerm, setTypeSearchTerm] = useState('');
  const [typeForm, setTypeForm] = useState({ type_name: '', description: '', status: 1 });

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

  // Flash Notifications / Alert message
  const [message, setMessage] = useState(null);

  // Search state for tables
  const [querySearchTerm, setQuerySearchTerm] = useState('');
  const [questionSearchTerm, setQuestionSearchTerm] = useState('');
  const [sessionSearchTerm, setSessionSearchTerm] = useState('');

  // Sub Type Dropdown filter state for Feedback Questions table
  const [subTypeFilter, setSubTypeFilter] = useState('ALL');

  // Pagination state (3 rows per page)
  const ITEMS_PER_PAGE = 3;
  const [questionPage, setQuestionPage] = useState(1);
  const [categoryPage, setCategoryPage] = useState(1);
  const [typePage, setTypePage] = useState(1);
  const [sessionPage, setSessionPage] = useState(1);
  const [queryPage, setQueryPage] = useState(1);
  const [reportPage, setReportPage] = useState(1);

  // Reset pagination to page 1 on search or filter change
  useEffect(() => { setQuestionPage(1); }, [questionSearchTerm, subTypeFilter]);
  useEffect(() => { setCategoryPage(1); }, [categorySearchTerm]);
  useEffect(() => { setTypePage(1); }, [typeSearchTerm]);
  useEffect(() => { setSessionPage(1); }, [sessionSearchTerm]);
  useEffect(() => { setQueryPage(1); }, [querySearchTerm]);
  useEffect(() => { setReportPage(1); }, [reportData]);

  // Helper function to format names with Proper Capitalization (starting letter of each word capitalized)
  const formatProperName = (nameStr) => {
    if (!nameStr) return '';
    return nameStr
      .toLowerCase()
      .split(' ')
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Helper for word-prefix matching (only matches if field or any word starts with searchTerm, no middle-of-word fetching)
  const matchesPrefixWord = (fieldValue, searchTerm) => {
    if (!searchTerm || !searchTerm.trim()) return true;
    if (!fieldValue) return false;

    const val = String(fieldValue).toLowerCase().trim();
    const term = String(searchTerm).toLowerCase().trim();

    const words = val.split(/\s+/);
    return val.startsWith(term) || words.some((w) => w.startsWith(term));
  };

  // Filtered queries for search bar
  const filteredQueries = queries.filter((q) => {
    if (!querySearchTerm.trim()) return true;
    return matchesPrefixWord(q.regno, querySearchTerm) ||
           matchesPrefixWord(q.studentName, querySearchTerm) ||
           matchesPrefixWord(q.courseCode, querySearchTerm) ||
           matchesPrefixWord(q.courseTitle, querySearchTerm);
  });

  // Filtered questions for search bar (ONLY Feedback Type & Question Type) & Sub Type Dropdown
  const filteredQuestions = questions.filter((q) => {
    // 1. Separate Sub Type Dropdown filter
    if (subTypeFilter !== 'ALL') {
      const qSub = (q.applicable_course_type || 'THEORY').toUpperCase();
      if (subTypeFilter === 'PRACTICAL') {
        if (qSub !== 'PRACTICAL' && qSub !== 'LAB') return false;
      } else if (qSub !== subTypeFilter.toUpperCase()) {
        return false;
      }
    }

    // 2. Search bar filter ONLY matches Feedback Type (category_name) and Question Type (type_name)
    if (!questionSearchTerm.trim()) return true;

    const matchCategory = matchesPrefixWord(q.category_name, questionSearchTerm);
    const matchType = matchesPrefixWord(q.type_name, questionSearchTerm);

    return matchCategory || matchType;
  });

  // Filtered sessions for search bar (typing 1, 2, 3... matches Semester Number exclusively)
  const filteredSessions = sessions.filter((s) => {
    if (!sessionSearchTerm.trim()) return true;
    const term = sessionSearchTerm.trim().toLowerCase();
    const semNum = String(s.semesterNumber || s.semester_id || '').trim();
    const semText = `semester ${semNum}`;

    // If user typed a pure digit (e.g. 1, 2, 3, 4), strictly filter by Semester Number
    const isPureNum = /^\d{1,2}$/.test(term);
    if (isPureNum) {
      return semNum === term;
    }

    const matchSemester =
      semNum === term ||
      term === `sem ${semNum}` ||
      term === `sem${semNum}` ||
      semText.startsWith(term) ||
      (term.startsWith('sem') && semText.includes(term));

    const matchName = matchesPrefixWord(s.session_name, term);
    const matchDept = matchesPrefixWord(s.departmentName, term) || matchesPrefixWord(s.departmentAcr, term);

    // Match Academic Year ONLY if term is a 4-digit year search (e.g. 2024, 2026-27)
    const isYearSearch = /^\d{4}/.test(term);
    const matchAcademicYear = isYearSearch ? matchesPrefixWord(s.academic_year, term) : false;

    return matchSemester || matchName || matchDept || matchAcademicYear;
  });

  // Filtered categories (matches ONLY Category Name, does not search description)
  const filteredCategories = categories.filter((c) => {
    if (!categorySearchTerm.trim()) return true;
    return matchesPrefixWord(c.category_name, categorySearchTerm);
  });

  // Filtered question types (matches ONLY Question Type Name, does not search description)
  const filteredTypes = questionTypes.filter((t) => {
    if (!typeSearchTerm.trim()) return true;
    return matchesPrefixWord(t.type_name, typeSearchTerm);
  });

  // Paginated data lists (3 rows per page)
  const paginatedQuestions = filteredQuestions.slice((questionPage - 1) * ITEMS_PER_PAGE, questionPage * ITEMS_PER_PAGE);
  const paginatedCategories = filteredCategories.slice((categoryPage - 1) * ITEMS_PER_PAGE, categoryPage * ITEMS_PER_PAGE);
  const paginatedTypes = filteredTypes.slice((typePage - 1) * ITEMS_PER_PAGE, typePage * ITEMS_PER_PAGE);
  const paginatedSessions = filteredSessions.slice((sessionPage - 1) * ITEMS_PER_PAGE, sessionPage * ITEMS_PER_PAGE);
  const paginatedQueries = filteredQueries.slice((queryPage - 1) * ITEMS_PER_PAGE, queryPage * ITEMS_PER_PAGE);

  // Pagination renderer component helper
  const renderPagination = (currentPage, totalItems, onPageChange) => {
    const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const endItem = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);

    return (
      <div className="table-pagination">
        <div className="pagination-info">
          Showing <strong>{startItem}</strong> to <strong>{endItem}</strong> of <strong>{totalItems}</strong> entries
        </div>
        <div className="pagination-controls">
          <button
            type="button"
            className="btn-page"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            ‹ Prev
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              type="button"
              key={page}
              className={`btn-page-num ${page === currentPage ? 'active' : ''}`}
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          ))}

          <button
            type="button"
            className="btn-page"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
          >
            Next ›
          </button>
        </div>
      </div>
    );
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
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

      fetchQuestions();
      fetchSessions();
      fetchQueries();
    } catch (err) {
      console.error('Error fetching initial data:', err);
    }
  };

  const fetchQuestions = async () => {
    setLoadingQuestions(true);
    try {
      const res = await api.get('/questions');
      if (res.data.success) setQuestions(res.data.data);
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
      if (res.data.success) setSessions(res.data.data);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    } finally {
      setLoadingSessions(false);
    }
  };

  const fetchQueries = async () => {
    setLoadingQueries(true);
    try {
      const res = await api.get('/queries');
      if (res.data.success) setQueries(res.data.data);
    } catch (err) {
      console.error('Failed to fetch private queries:', err);
    } finally {
      setLoadingQueries(false);
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
      applicable_course_type: q.applicable_course_type || 'THEORY',
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
        const res = await api.put(`/questions/${editingQuestion.question_id}`, questionForm);
        if (res.data.success) {
          setMessage({ type: 'success', text: 'Question updated successfully.' });
          fetchQuestions();
        }
      } else {
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
    if (!window.confirm('Are you sure you want to delete / deactivate this question?')) return;
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

  // Open Session Modal for Create
  const handleOpenAddSessionModal = () => {
    setEditingSession(null);
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setSessionForm({
      category_id: categories.length > 0 ? categories[0].category_id : 1,
      academic_year: academicYears.length > 0 ? academicYears[0] : '2026-27',
      semester_id: semesters.length > 0 ? semesters[0].semesterId : 1,
      department_id: departments.length > 0 ? departments[0].departmentId : 1,
      session_name: 'Semester End Feedback',
      description: 'Official student feedback session',
      start_date: today,
      end_date: nextWeek,
      status: 'Pending'
    });
    setShowSessionModal(true);
  };

  // Save Session
  const handleSaveSession = async (e) => {
    e.preventDefault();
    if (!sessionForm.session_name.trim()) {
      alert('Session name is required.');
      return;
    }
    try {
      if (editingSession) {
        const res = await api.put(`/feedback-sessions/${editingSession.session_id}`, sessionForm);
        if (res.data.success) {
          setMessage({ type: 'success', text: 'Feedback session updated.' });
          fetchSessions();
        }
      } else {
        const res = await api.post('/feedback-sessions', sessionForm);
        if (res.data.success) {
          setMessage({ type: 'success', text: 'New feedback session created.' });
          fetchSessions();
        }
      }
      setShowSessionModal(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save session.');
    }
  };

  // Enable Pending Session
  const handleEnableSession = async (sessionId) => {
    try {
      const res = await api.post(`/feedback-sessions/${sessionId}/enable`);
      if (res.data.success) {
        setMessage({ type: 'success', text: 'Feedback session enabled successfully!' });
        fetchSessions();
      }
    } catch (err) {
      alert('Failed to enable feedback session.');
    }
  };

  // Preview Session Questions Modal
  const handlePreviewSession = async (sessionId) => {
    setLoadingPreview(true);
    setShowPreviewModal(true);
    try {
      const res = await api.get(`/feedback-sessions/${sessionId}/preview`);
      if (res.data.success) {
        setPreviewData(res.data);
      }
    } catch (err) {
      alert('Failed to load session preview.');
      setShowPreviewModal(false);
    } finally {
      setLoadingPreview(false);
    }
  };

  // Resolve Student Private Query
  const handleResolveQuery = async (queryId) => {
    try {
      const res = await api.put(`/queries/${queryId}/resolve`);
      if (res.data.success) {
        setMessage({ type: 'success', text: res.data.message });
        fetchQueries();
      }
    } catch (err) {
      alert('Failed to resolve query.');
    }
  };

  // Open Category Manager Modal
  const handleOpenCategoryManager = () => {
    setEditingCategory(null);
    setShowCategoryForm(false);
    setCategoryForm({ category_name: '', description: '', status: 1 });
    setCategorySearchTerm('');
    setShowCategoryModal(true);
  };

  // Open Edit Category
  const handleOpenEditCategory = (cat) => {
    setEditingCategory(cat);
    setCategoryForm({
      category_name: cat.category_name,
      description: cat.description || '',
      status: cat.status !== undefined ? cat.status : 1
    });
    setShowCategoryForm(true);
  };

  // Save Category (Create or Edit)
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryForm.category_name.trim()) {
      alert('Category name is required.');
      return;
    }
    try {
      if (editingCategory) {
        const res = await api.put(`/meta/categories/${editingCategory.category_id}`, categoryForm);
        if (res.data.success) {
          setMessage({ type: 'success', text: 'Category updated successfully.' });
        }
      } else {
        const res = await api.post('/meta/categories', categoryForm);
        if (res.data.success) {
          setMessage({ type: 'success', text: 'New category created successfully.' });
        }
      }
      setShowCategoryForm(false);
      setEditingCategory(null);
      setCategoryForm({ category_name: '', description: '', status: 1 });
      const catsRes = await api.get('/meta/categories');
      if (catsRes.data.success) setCategories(catsRes.data.data);
      fetchQuestions();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save category.');
    }
  };

  // Delete Category
  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete / deactivate this category?')) return;
    try {
      const res = await api.delete(`/meta/categories/${id}`);
      if (res.data.success) {
        setMessage({ type: 'success', text: res.data.message });
        const catsRes = await api.get('/meta/categories');
        if (catsRes.data.success) setCategories(catsRes.data.data);
        fetchQuestions();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete category.');
    }
  };

  // Open Question Type Manager Modal
  const handleOpenTypeManager = () => {
    setEditingType(null);
    setShowTypeForm(false);
    setTypeForm({ type_name: '', description: '', status: 1 });
    setTypeSearchTerm('');
    setShowTypeModal(true);
  };

  // Open Edit Question Type
  const handleOpenEditType = (t) => {
    setEditingType(t);
    setTypeForm({
      type_name: t.type_name,
      description: t.description || '',
      status: t.status !== undefined ? t.status : 1
    });
    setShowTypeForm(true);
  };

  // Save Question Type (Create or Edit)
  const handleSaveType = async (e) => {
    e.preventDefault();
    if (!typeForm.type_name.trim()) {
      alert('Question type name is required.');
      return;
    }
    try {
      if (editingType) {
        const res = await api.put(`/meta/question-types/${editingType.type_id}`, typeForm);
        if (res.data.success) {
          setMessage({ type: 'success', text: 'Question type updated successfully.' });
        }
      } else {
        const res = await api.post('/meta/question-types', typeForm);
        if (res.data.success) {
          setMessage({ type: 'success', text: 'New question type created successfully.' });
        }
      }
      setShowTypeForm(false);
      setEditingType(null);
      setTypeForm({ type_name: '', description: '', status: 1 });
      const typesRes = await api.get('/meta/question-types');
      if (typesRes.data.success) setQuestionTypes(typesRes.data.data);
      fetchQuestions();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save question type.');
    }
  };

  // Delete Question Type
  const handleDeleteType = async (id) => {
    if (!window.confirm('Are you sure you want to delete / deactivate this question type?')) return;
    try {
      const res = await api.delete(`/meta/question-types/${id}`);
      if (res.data.success) {
        setMessage({ type: 'success', text: res.data.message });
        const typesRes = await api.get('/meta/question-types');
        if (typesRes.data.success) setQuestionTypes(typesRes.data.data);
        fetchQuestions();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete question type.');
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
            <div className="user-role">{user?.roleName || 'SuperAdmin'} ({user?.userNumber || 'ADMIN001'})</div>
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
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button className="btn-secondary" style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.3)' }} onClick={() => { setEditingCategory(null); setCategoryForm({ category_name: '', description: '', status: 1 }); setShowCategoryForm(true); document.getElementById('categories-section')?.scrollIntoView({ behavior: 'smooth' }); }}>
              + New Category
            </button>
            <button className="btn-secondary" style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.3)' }} onClick={() => { setEditingType(null); setTypeForm({ type_name: '', description: '', status: 1 }); setShowTypeForm(true); document.getElementById('types-section')?.scrollIntoView({ behavior: 'smooth' }); }}>
              + Question Type
            </button>
            <button className="btn-primary" onClick={handleOpenAddModal}>
              + Add Question
            </button>
          </div>
        </section>

        {/* 2. FEEDBACK QUESTION MANAGEMENT */}
        <section className="dashboard-section" id="questions-section">
          <div className="section-header">
            <h3>FEEDBACK QUESTION MANAGEMENT</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {/* Separate Dropdown Filter for Sub Type */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', textTransform: 'uppercase' }}>Sub Type:</label>
                <select
                  value={subTypeFilter}
                  onChange={(e) => setSubTypeFilter(e.target.value)}
                  style={{
                    padding: '7px 12px',
                    fontSize: '13px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '20px',
                    outline: 'none',
                    backgroundColor: '#f8fafc',
                    color: '#0f172a',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  <option value="ALL">All Sub Types</option>
                  <option value="THEORY">THEORY</option>
                  <option value="PRACTICAL">PRACTICAL / LAB</option>
                  <option value="INTEGRATED">INTEGRATED</option>
                  <option value="EXPERIENTIAL LEARNING">EXPERIENTIAL LEARNING</option>
                </select>
              </div>

              {/* Search Bar for Feedback Type and Question Type ONLY */}
              <div className="table-search-bar">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search feedback type or question type..."
                  value={questionSearchTerm}
                  onChange={(e) => setQuestionSearchTerm(e.target.value)}
                />
                {questionSearchTerm && (
                  <button className="btn-clear-search" onClick={() => setQuestionSearchTerm('')}>×</button>
                )}
              </div>

              <button className="btn-primary" onClick={handleOpenAddModal}>
                + Add New Question
              </button>
            </div>
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
                ) : filteredQuestions.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="empty-table-state">
                      {questionSearchTerm ? `No questions found matching "${questionSearchTerm}".` : 'No questions found. Click + Add New Question to create one.'}
                    </td>
                  </tr>
                ) : (
                  paginatedQuestions.map((q) => (
                    <tr key={q.question_id}>
                      <td>#{q.question_id}</td>
                      <td><strong>{q.category_name || `Category #${q.category_id}`}</strong></td>
                      <td>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '700',
                          backgroundColor: q.applicable_course_type === 'THEORY' ? '#e0f2fe' : q.applicable_course_type === 'PRACTICAL' ? '#fef3c7' : '#f1f5f9',
                          color: q.applicable_course_type === 'THEORY' ? '#0369a1' : q.applicable_course_type === 'PRACTICAL' ? '#b45309' : '#334155'
                        }}>
                          {q.applicable_course_type || 'THEORY'}
                        </span>
                      </td>
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

          {/* 3 rows per page Pagination */}
          {renderPagination(questionPage, filteredQuestions.length, setQuestionPage)}
        </section>

        {/* 3. FEEDBACK CATEGORY MANAGEMENT BLOCK */}
        <section className="dashboard-section" id="categories-section">
          <div className="section-header">
            <h3>FEEDBACK CATEGORY MANAGEMENT</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div className="table-search-bar">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={categorySearchTerm}
                  onChange={(e) => setCategorySearchTerm(e.target.value)}
                />
                {categorySearchTerm && (
                  <button className="btn-clear-search" onClick={() => setCategorySearchTerm('')}>×</button>
                )}
              </div>
              <button
                className="btn-primary"
                onClick={() => {
                  setEditingCategory(null);
                  setCategoryForm({ category_name: '', description: '', status: 1 });
                  setShowCategoryForm(!showCategoryForm);
                }}
              >
                {showCategoryForm ? 'Close Category Form' : '+ Add New Category'}
              </button>
            </div>
          </div>

          {showCategoryForm && (
            <form onSubmit={handleSaveCategory} style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '20px' }}>
              <h5 style={{ margin: '0 0 14px 0', fontSize: '15px', color: '#0f172a', fontWeight: '700' }}>
                {editingCategory ? `Edit Category #${editingCategory.category_id}` : 'Create New Category'}
              </h5>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '16px', alignItems: 'flex-start' }}>
                <div className="form-group">
                  <label>Category Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Academic Feedback"
                    value={categoryForm.category_name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, category_name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <input
                    type="text"
                    placeholder="Brief description..."
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={categoryForm.status}
                    onChange={(e) => setCategoryForm({ ...categoryForm, status: parseInt(e.target.value, 10) })}
                  >
                    <option value={1}>Active</option>
                    <option value={0}>Inactive</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowCategoryForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary">{editingCategory ? 'Save Changes' : 'Create Category'}</button>
              </div>
            </form>
          )}

          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Category Name</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="empty-table-state">
                      {categorySearchTerm ? `No categories found matching "${categorySearchTerm}".` : 'No categories available in the system.'}
                    </td>
                  </tr>
                ) : (
                  paginatedCategories.map((c) => (
                    <tr key={c.category_id}>
                      <td>#{c.category_id}</td>
                      <td><strong>{c.category_name}</strong></td>
                      <td>{c.description || '-'}</td>
                      <td>
                        <span className={`status-pill ${c.status ? 'active' : 'inactive'}`}>
                          {c.status ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <button className="btn-action-edit" onClick={() => handleOpenEditCategory(c)}>Edit</button>
                        <button className="btn-action-delete" onClick={() => handleDeleteCategory(c.category_id)}>Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 3 rows per page Pagination */}
          {renderPagination(categoryPage, filteredCategories.length, setCategoryPage)}
        </section>

        {/* 4. QUESTION TYPE MANAGEMENT BLOCK */}
        <section className="dashboard-section" id="types-section">
          <div className="section-header">
            <h3>QUESTION TYPE MANAGEMENT</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div className="table-search-bar">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search question types..."
                  value={typeSearchTerm}
                  onChange={(e) => setTypeSearchTerm(e.target.value)}
                />
                {typeSearchTerm && (
                  <button className="btn-clear-search" onClick={() => setTypeSearchTerm('')}>×</button>
                )}
              </div>
              <button
                className="btn-primary"
                onClick={() => {
                  setEditingType(null);
                  setTypeForm({ type_name: '', description: '', status: 1 });
                  setShowTypeForm(!showTypeForm);
                }}
              >
                {showTypeForm ? 'Close Question Type Form' : '+ Add New Question Type'}
              </button>
            </div>
          </div>

          {showTypeForm && (
            <form onSubmit={handleSaveType} style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '20px' }}>
              <h5 style={{ margin: '0 0 14px 0', fontSize: '15px', color: '#0f172a', fontWeight: '700' }}>
                {editingType ? `Edit Question Type #${editingType.type_id}` : 'Create New Question Type'}
              </h5>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '16px', alignItems: 'flex-start' }}>
                <div className="form-group">
                  <label>Question Type Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Rating Scale (1-5)"
                    value={typeForm.type_name}
                    onChange={(e) => setTypeForm({ ...typeForm, type_name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <input
                    type="text"
                    placeholder="Input format description..."
                    value={typeForm.description}
                    onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={typeForm.status}
                    onChange={(e) => setTypeForm({ ...typeForm, status: parseInt(e.target.value, 10) })}
                  >
                    <option value={1}>Active</option>
                    <option value={0}>Inactive</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowTypeForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary">{editingType ? 'Save Changes' : 'Create Type'}</button>
              </div>
            </form>
          )}

          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Question Type</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTypes.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="empty-table-state">
                      {typeSearchTerm ? `No question types found matching "${typeSearchTerm}".` : 'No question types available in the system.'}
                    </td>
                  </tr>
                ) : (
                  paginatedTypes.map((t) => (
                    <tr key={t.type_id}>
                      <td>#{t.type_id}</td>
                      <td><strong>{t.type_name}</strong></td>
                      <td>{t.description || '-'}</td>
                      <td>
                        <span className={`status-pill ${t.status ? 'active' : 'inactive'}`}>
                          {t.status ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <button className="btn-action-edit" onClick={() => handleOpenEditType(t)}>Edit</button>
                        <button className="btn-action-delete" onClick={() => handleDeleteType(t.type_id)}>Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 3 rows per page Pagination */}
          {renderPagination(typePage, filteredTypes.length, setTypePage)}
        </section>

        {/* 5. FEEDBACK SESSIONS PENDING APPROVAL */}
        <section className="dashboard-section" id="sessions-section">
          <div className="section-header">
            <h3>FEEDBACK SESSIONS PENDING APPROVAL</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div className="table-search-bar">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search sessions by name, dept..."
                  value={sessionSearchTerm}
                  onChange={(e) => setSessionSearchTerm(e.target.value)}
                />
                {sessionSearchTerm && (
                  <button className="btn-clear-search" onClick={() => setSessionSearchTerm('')}>×</button>
                )}
              </div>
              <button className="btn-primary" onClick={handleOpenAddSessionModal}>
                + Create New Session
              </button>
            </div>
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
                ) : filteredSessions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="empty-table-state">
                      {sessionSearchTerm ? `No sessions found matching "${sessionSearchTerm}".` : 'No feedback sessions available in the system.'}
                    </td>
                  </tr>
                ) : (
                  paginatedSessions.map((s) => (
                    <tr key={s.session_id}>
                      <td><strong>{s.academic_year}</strong></td>
                      <td>Semester {s.semesterNumber || s.semester_id || '1'}</td>
                      <td>{s.departmentAcr || s.departmentName || 'All Depts'}</td>
                      <td>{s.session_name}</td>
                      <td>
                        <span className={`status-pill ${s.status === 'Active' ? 'active' : 'pending'}`}>
                          {s.status || 'Pending'}
                        </span>
                      </td>
                      <td>
                        <button className="btn-action-preview" onClick={() => handlePreviewSession(s.session_id)}>Preview</button>
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

          {/* 3 rows per page Pagination */}
          {renderPagination(sessionPage, filteredSessions.length, setSessionPage)}
        </section>

        {/* 6. PRIVATE STUDENT QUERIES (RESTRICTED TO SUPER ADMIN ONLY) */}
        <section className="dashboard-section" id="queries-section">
          <div className="section-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3>PRIVATE STUDENT QUERIES</h3>
              <span style={{ fontSize: '11px', color: '#0284c7', textTransform: 'none' }}>(Super Admin Confidential)</span>
            </div>

            {/* Live Search Bar for Student Queries */}
            <div className="table-search-bar">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search by name or roll number..."
                value={querySearchTerm}
                onChange={(e) => setQuerySearchTerm(e.target.value)}
              />
              {querySearchTerm && (
                <button className="btn-clear-search" onClick={() => setQuerySearchTerm('')}>×</button>
              )}
            </div>
          </div>

          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Student Info</th>
                  <th>Subject / Course</th>
                  <th>Private Query Text</th>
                  <th>Submitted Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loadingQueries ? (
                  <tr>
                    <td colSpan="7" className="empty-table-state">Loading private student queries...</td>
                  </tr>
                ) : filteredQueries.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="empty-table-state">
                      {querySearchTerm ? `No queries found matching "${querySearchTerm}".` : 'No private student queries submitted.'}
                    </td>
                  </tr>
                ) : (
                  paginatedQueries.map((qry) => (
                    <tr key={qry.query_id}>
                      <td>#{qry.query_id}</td>
                      <td>
                        <div>
                          <strong>{qry.regno || 'REG_STD'}</strong>
                          {qry.studentName && (
                            <div style={{ fontSize: '12px', color: '#0284c7', fontWeight: '600', marginTop: '2px' }}>
                              {formatProperName(qry.studentName)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>{qry.courseCode ? `${qry.courseCode} - ${qry.courseTitle}` : 'General Inquiry'}</td>
                      <td style={{ maxWidth: '320px', color: '#0f172a' }}>{qry.query_text}</td>
                      <td>{qry.created_at ? new Date(qry.created_at).toLocaleDateString() : 'Today'}</td>
                      <td>
                        <span className={`status-pill ${qry.status === 'Resolved' ? 'active' : 'pending'}`}>
                          {qry.status || 'Pending'}
                        </span>
                      </td>
                      <td>
                        {qry.status !== 'Resolved' ? (
                          <button className="btn-action-enable" onClick={() => handleResolveQuery(qry.query_id)}>Mark Resolved</button>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#15803d', fontWeight: '600' }}>Resolved</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 3 rows per page Pagination */}
          {renderPagination(queryPage, filteredQueries.length, setQueryPage)}
        </section>

        {/* 5. REPORT SECTION */}
        <section className="dashboard-section" id="reports-section">
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
                    <option key={sem.semesterNumber || sem.semesterId} value={sem.semesterNumber || sem.semesterId}>
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
          {reportData && (() => {
            const reportList = reportData.data || [];
            const paginatedReportList = reportList.slice((reportPage - 1) * ITEMS_PER_PAGE, reportPage * ITEMS_PER_PAGE);

            return (
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
                      {reportList.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="empty-table-state">
                            No student response ratings found for the selected filter parameters.
                          </td>
                        </tr>
                      ) : (
                        paginatedReportList.map((row, idx) => (
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

                {/* 3 rows per page Pagination for Reports */}
                {renderPagination(reportPage, reportList.length, setReportPage)}
              </div>
            );
          })()}
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

      {/* Create Session Modal */}
      {showSessionModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h4>{editingSession ? 'Edit Session' : 'Create New Feedback Session'}</h4>
              <button className="btn-close-modal" onClick={() => setShowSessionModal(false)}>×</button>
            </div>

            <form onSubmit={handleSaveSession}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Session Name</label>
                  <input
                    type="text"
                    placeholder="e.g. End Semester Feedback 2026"
                    value={sessionForm.session_name}
                    onChange={(e) => setSessionForm({ ...sessionForm, session_name: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Academic Year</label>
                    <select
                      value={sessionForm.academic_year}
                      onChange={(e) => setSessionForm({ ...sessionForm, academic_year: e.target.value })}
                    >
                      {academicYears.map((yr, i) => (
                        <option key={i} value={yr}>{yr}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Semester</label>
                    <select
                      value={sessionForm.semester_id}
                      onChange={(e) => setSessionForm({ ...sessionForm, semester_id: e.target.value })}
                    >
                      {semesters.map((s) => (
                        <option key={s.semesterId} value={s.semesterId}>Semester {s.semesterNumber}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Department</label>
                    <select
                      value={sessionForm.department_id}
                      onChange={(e) => setSessionForm({ ...sessionForm, department_id: e.target.value })}
                    >
                      {departments.map((d) => (
                        <option key={d.departmentId} value={d.departmentId}>{d.departmentAcr} - {d.departmentName}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Category</label>
                    <select
                      value={sessionForm.category_id}
                      onChange={(e) => setSessionForm({ ...sessionForm, category_id: e.target.value })}
                    >
                      {categories.map((c) => (
                        <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Start Date</label>
                    <input
                      type="date"
                      value={sessionForm.start_date}
                      onChange={(e) => setSessionForm({ ...sessionForm, start_date: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>End Date</label>
                    <input
                      type="date"
                      value={sessionForm.end_date}
                      onChange={(e) => setSessionForm({ ...sessionForm, end_date: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowSessionModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">
                  {editingSession ? 'Save Changes' : 'Create Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Session Questions Modal */}
      {showPreviewModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <h4>Preview Feedback Session</h4>
              <button className="btn-close-modal" onClick={() => setShowPreviewModal(false)}>×</button>
            </div>

            <div className="modal-body">
              {loadingPreview ? (
                <div style={{ textAlign: 'center', padding: '24px' }}>Loading session preview...</div>
              ) : previewData ? (
                <div>
                  <div style={{ padding: '12px 16px', backgroundColor: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd', marginBottom: '16px' }}>
                    <h5 style={{ margin: '0 0 4px 0', color: '#0284c7', fontSize: '14px' }}>{previewData.session?.session_name}</h5>
                    <p style={{ margin: 0, fontSize: '12.5px', color: '#334155' }}>
                      <strong>Department:</strong> {previewData.session?.departmentName || 'All'} | <strong>Semester:</strong> {previewData.session?.semesterNumber || 'All'} | <strong>Year:</strong> {previewData.session?.academic_year}
                    </p>
                  </div>

                  <h5 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#475569', textTransform: 'uppercase' }}>Session Questions ({previewData.questions?.length || 0}):</h5>

                  {previewData.questions?.length === 0 ? (
                    <p style={{ color: '#64748b', fontSize: '13.5px' }}>No active questions assigned to this category yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {previewData.questions?.map((q, idx) => (
                        <div key={q.question_id} style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#ffffff' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                            <span>Q{idx + 1}. ({q.type_name || 'Rating'})</span>
                            <span style={{ fontWeight: '600', color: '#0284c7' }}>{q.applicable_course_type || 'All'}</span>
                          </div>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{q.question_text}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-primary" onClick={() => setShowPreviewModal(false)}>Close Preview</button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default SuperAdminDashboard;
