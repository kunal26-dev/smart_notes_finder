import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowRight,
  Bookmark,
  BookOpen,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  FileText,
  Filter,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UploadCloud,
  Users,
  X,
} from 'lucide-react';
import { apiRequest, downloadResource } from './api.js';

const navigation = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'discover', label: 'Discover resources', icon: Search },
  { id: 'saved', label: 'Saved resources', icon: Bookmark },
  { id: 'uploads', label: 'My uploads', icon: UploadCloud },
];

const formatDate = (value) => {
  if (!value) return 'Recently added';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
};

const formatSize = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const initials = (name = 'Student') =>
  name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();

function getErrorMessage(error) {
  if (error?.details?.length) return `${error.message}: ${error.details.join(', ')}`;
  if (error?.message === 'Failed to fetch' || error?.code === 'API_UNAVAILABLE') {
    return 'The Smart Notes API is unreachable. Start the backend from backend\\Min\\server with “npm run dev”. For a different API address, set VITE_PROXY_TARGET (local development) or VITE_API_URL (deployment).';
  }
  return error?.message || 'Something went wrong. Please try again.';
}

function AuthScreen({ onAuthenticated, notice }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'Student' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const data = await apiRequest(`/auth/${mode === 'login' ? 'login' : 'register'}`, {
        method: 'POST',
        body: mode === 'login'
          ? { email: form.email, password: form.password }
          : { name: form.name, email: form.email, password: form.password, role: form.role },
      });
      onAuthenticated(data);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-story">
        <div className="brand brand-light">
          <div className="brand-mark"><BookOpen size={22} strokeWidth={2.2} /></div>
          <span>StudySpace</span>
        </div>
        <div className="story-copy">
          <div className="eyebrow"><Sparkles size={14} /> YOUR CAMPUS, CONNECTED</div>
          <h1>Good notes.<br />Better <span>learning.</span></h1>
          <p>Find thoughtful study materials shared by students and teachers who get it.</p>
        </div>
        <div className="story-note">
          <div className="note-avatars"><span>AM</span><span>SK</span><span>+2k</span></div>
          <p><strong>A little knowledge goes a long way.</strong><br />Make your next study session count.</p>
        </div>
        <div className="story-decoration decoration-one" />
        <div className="story-decoration decoration-two" />
      </section>

      <section className="auth-panel">
        <div className="auth-mobile-brand brand">
          <div className="brand-mark"><BookOpen size={20} /></div><span>StudySpace</span>
        </div>
        <div className="auth-form-wrap">
          <div className="auth-heading">
            <span className="auth-kicker">{mode === 'login' ? 'WELCOME BACK' : 'GET STARTED'}</span>
            <h2>{mode === 'login' ? 'Sign in to your space' : 'Create your account'}</h2>
            <p>{mode === 'login' ? 'Your next great study session is waiting.' : 'Join your campus learning community.'}</p>
          </div>
          {notice && <div className="inline-error" role="alert">{notice}</div>}

          <div className="auth-switch" role="tablist" aria-label="Account options">
            <button type="button" className={mode === 'login' ? 'selected' : ''} onClick={() => { setMode('login'); setError(''); }}>Sign in</button>
            <button type="button" className={mode === 'register' ? 'selected' : ''} onClick={() => { setMode('register'); setError(''); }}>Create account</button>
          </div>

          <form className="auth-form" onSubmit={submit}>
            {mode === 'register' && (
              <>
                <label htmlFor="name">Your name</label>
                <input id="name" autoComplete="name" minLength="2" required value={form.name} onChange={update('name')} placeholder="e.g. Alex Morgan" />
              </>
            )}
            <label htmlFor="email">Email address</label>
            <input id="email" type="email" autoComplete="email" required value={form.email} onChange={update('email')} placeholder="you@university.edu" />
            <div className="password-label">
              <label htmlFor="password">Password</label>
              {mode === 'login' && <span>At least 8 characters</span>}
            </div>
            <input id="password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength="8" required value={form.password} onChange={update('password')} placeholder="••••••••••" />
            {mode === 'register' && (
              <>
                <label htmlFor="role">I’m joining as a</label>
                <div className="select-wrap">
                  <select id="role" value={form.role} onChange={update('role')}>
                    <option>Student</option>
                    <option>Teacher</option>
                  </select>
                  <ChevronDown size={16} />
                </div>
              </>
            )}
            {error && <div className="inline-error" role="alert">{error}</div>}
            <button className="button button-primary auth-submit" type="submit" disabled={busy}>
              {busy ? <span className="spinner" /> : mode === 'login' ? 'Sign in' : 'Create account'}
              {!busy && <ArrowRight size={17} />}
            </button>
          </form>

          <div className="auth-footnote"><ShieldCheck size={15} /> Your learning space is private and secure.</div>
        </div>
        <div className="auth-footer">© {new Date().getFullYear()} StudySpace <span>·</span> Made for curious minds</div>
      </section>
    </main>
  );
}

function Sidebar({ page, setPage, user, onLogout, open, onClose }) {
  const items = user.role === 'Admin'
    ? [...navigation, { id: 'review', label: 'Review queue', icon: ShieldCheck }]
    : navigation;

  return (
    <>
      {open && <button className="mobile-scrim" aria-label="Close navigation" onClick={onClose} />}
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><BookOpen size={21} strokeWidth={2.2} /></div>
          <span>StudySpace</span>
        </div>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          {items.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" className={`nav-link ${page === id ? 'active' : ''}`} onClick={() => { setPage(id); onClose(); }}>
              <Icon size={18} strokeWidth={1.9} /><span>{label}</span>
              {id === 'review' && <span className="nav-dot" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <div className="tip-icon"><CircleHelp size={17} /></div>
            <strong>Good notes are meant to be shared.</strong>
            <span>Help someone learn something new today.</span>
            <button onClick={() => setPage('uploads')}>Share a resource <ArrowRight size={14} /></button>
          </div>
          <button type="button" className="profile-button" onClick={onLogout} title="Sign out">
            <div className="avatar">{initials(user.name)}</div>
            <div className="profile-copy"><strong>{user.name}</strong><span>{user.role}</span></div>
            <LogOut size={17} className="logout-icon" />
          </button>
        </div>
      </aside>
    </>
  );
}

function Header({ page, user, searchText, setSearchText, onSearch, onMenu, onUpload }) {
  const titles = {
    overview: ['Your learning dashboard', 'A little progress adds up. Here’s what’s happening in your space.'],
    discover: ['Discover resources', 'Find the right notes, guides, and study materials for your next session.'],
    saved: ['Saved resources', 'All the helpful things you’ve bookmarked, in one place.'],
    uploads: ['My uploads', 'Keep track of the resources you’ve shared with your community.'],
    review: ['Review queue', 'Help keep your campus library useful, accurate, and welcoming.'],
  };
  const [title, subtitle] = titles[page] || titles.overview;

  return (
    <header className="topbar">
      <button className="mobile-menu icon-button" onClick={onMenu} aria-label="Open navigation"><Menu size={21} /></button>
      <div className="page-heading"><h1>{title}</h1><p>{subtitle}</p></div>
      <div className="topbar-actions">
        <form className="top-search" onSubmit={onSearch}>
          <Search size={17} />
          <input aria-label="Search resources" value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search anything..." />
          <kbd>⌘ K</kbd>
        </form>
        <button className="button button-primary top-upload" type="button" onClick={onUpload}><Plus size={17} /> Share resource</button>
        <div className="top-avatar" title={user.name}>{initials(user.name)}</div>
      </div>
    </header>
  );
}

function StatCard({ icon: Icon, label, value, note, tone }) {
  return (
    <article className="stat-card">
      <div className={`stat-icon ${tone}`}><Icon size={19} strokeWidth={1.9} /></div>
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value ?? '—'}</strong>
      <span className="stat-note">{note}</span>
    </article>
  );
}

function ResourceCard({ resource, saved, onBookmark, onDownload, onReview, showStatus = false }) {
  const subject = resource.subject?.subjectName || 'General';
  const category = resource.category?.categoryName || 'Resource';
  const fileType = (resource.fileType || 'file').replace('.', '').toUpperCase();
  const tags = Array.isArray(resource.tags) ? resource.tags : [];

  return (
    <article className="resource-card">
      <div className={`file-tile file-${fileType.toLowerCase()}`}><FileText size={23} strokeWidth={1.65} /><span>{fileType}</span></div>
      <div className="resource-main">
        <div className="resource-meta">
          <span className="subject-pill">{subject}</span>
          <span className="resource-dot">·</span>
          <span>{category}</span>
          {showStatus && <span className={`status-pill status-${(resource.status || '').toLowerCase()}`}>{resource.status}</span>}
        </div>
        <h3>{resource.title || 'Untitled resource'}</h3>
        <p className="resource-description">{resource.description || 'No description provided.'}</p>
        <div className="resource-tags">
          {tags.slice(0, 3).map((tag) => <span key={tag}>#{tag}</span>)}
          {resource.semester && <span>Semester {resource.semester}</span>}
        </div>
        <div className="resource-byline">
          <span className="mini-avatar">{initials(resource.uploadedBy?.name)}</span>
          <span>{resource.uploadedBy?.name || 'StudySpace member'}</span>
          <span className="resource-dot">·</span>
          <span>{formatDate(resource.createdAt)}</span>
          <span className="resource-dot">·</span>
          <span>{formatSize(resource.fileSize)}</span>
        </div>
      </div>
      <div className="resource-actions">
        {onBookmark && <button className={`icon-button bookmark-button ${saved ? 'is-saved' : ''}`} onClick={() => onBookmark(resource)} aria-label={saved ? 'Remove bookmark' : 'Save resource'} title={saved ? 'Remove bookmark' : 'Save resource'}><Bookmark size={18} fill={saved ? 'currentColor' : 'none'} /></button>}
        {onReview ? onReview(resource) : <button className="button button-outline download-button" onClick={() => onDownload(resource)}><ArrowDownToLine size={16} /> Download</button>}
      </div>
    </article>
  );
}

function UploadDialog({ subjects, categories, onClose, onSubmit, busy }) {
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);

  async function submit(event) {
    event.preventDefault();
    setError('');
    const formData = new FormData(event.currentTarget);
    if (!file) {
      setError('Choose a file to upload.');
      return;
    }
    formData.set('file', file);
    try {
      await onSubmit(formData);
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="dialog upload-dialog" role="dialog" aria-modal="true" aria-labelledby="upload-title">
        <div className="dialog-header">
          <div><span className="auth-kicker">CONTRIBUTE TO YOUR CAMPUS</span><h2 id="upload-title">Share a resource</h2><p>Give your classmates something good to learn from.</p></div>
          <button className="icon-button" onClick={onClose} aria-label="Close upload dialog"><X size={20} /></button>
        </div>
        <form className="upload-form" onSubmit={submit}>
          <label htmlFor="resource-title">Resource title</label>
          <input id="resource-title" name="title" required minLength="3" maxLength="150" placeholder="e.g. Introduction to Data Structures" />
          <label htmlFor="resource-description">Description</label>
          <textarea id="resource-description" name="description" rows="3" required maxLength="2000" placeholder="What will someone learn from this resource?" />
          <div className="form-grid">
            <div><label htmlFor="resource-subject">Subject</label><select id="resource-subject" name="subject" required defaultValue=""><option value="" disabled>Select subject</option>{subjects.map((subject) => <option key={subject._id} value={subject._id}>{subject.subjectName} {subject.subjectCode ? `(${subject.subjectCode})` : ''}</option>)}</select></div>
            <div><label htmlFor="resource-category">Category</label><select id="resource-category" name="category" required defaultValue=""><option value="" disabled>Select category</option>{categories.map((category) => <option key={category._id} value={category._id}>{category.categoryName}</option>)}</select></div>
          </div>
          <div className="form-grid">
            <div><label htmlFor="resource-semester">Semester</label><select id="resource-semester" name="semester" required defaultValue=""><option value="" disabled>Select semester</option>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>Semester {index + 1}</option>)}</select></div>
            <div><label htmlFor="resource-tags">Tags <span className="optional-label">Optional</span></label><input id="resource-tags" name="tags" placeholder="algorithms, exam prep" /></div>
          </div>
          <label className="file-drop" htmlFor="resource-file">
            <UploadCloud size={21} />
            <strong>{file ? file.name : 'Choose a file or drop it here'}</strong>
            <span>PDF, DOC, PPT, XLS, TXT, CSV or ZIP · max 20 MB</span>
            <input id="resource-file" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.zip" onChange={(event) => setFile(event.target.files?.[0] || null)} />
          </label>
          {error && <div className="inline-error" role="alert">{error}</div>}
          <div className="dialog-footer"><span><ShieldCheck size={15} /> Student uploads are reviewed before publishing.</span><button className="button button-primary" type="submit" disabled={busy}>{busy ? <span className="spinner" /> : <><UploadCloud size={16} /> Upload resource</>}</button></div>
        </form>
      </section>
    </div>
  );
}

function EmptyState({ icon: Icon = BookOpen, title, description, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon"><Icon size={24} /></div>
      <h3>{title}</h3><p>{description}</p>
      {action && <button className="button button-outline" onClick={action.onClick}>{action.label}<ArrowRight size={15} /></button>}
    </div>
  );
}

function ResourceList({ resources, savedIds, onBookmark, onDownload, onReview, showStatus, loading }) {
  if (loading) return <div className="resource-skeletons">{[1, 2, 3].map((item) => <div className="resource-skeleton" key={item}><span /><div><i /><i /><i /></div></div>)}</div>;
  if (!resources.length) return <EmptyState title="Nothing here just yet" description="Try a different search or check back after more resources are shared." />;
  return (
    <div className="resource-list">
      {resources.map((resource) => (
        <ResourceCard
          key={resource._id}
          resource={resource}
          saved={savedIds.has(resource._id)}
          onBookmark={onBookmark}
          onDownload={onDownload}
          onReview={onReview}
          showStatus={showStatus}
        />
      ))}
    </div>
  );
}

function Overview({ dashboard, resources, loading, savedIds, onNavigate, onBookmark, onDownload }) {
  const counts = dashboard?.myUploads?.counts;
  const recent = resources.length ? resources : dashboard?.recentResources || [];
  return (
    <>
      <section className="welcome-banner">
        <div className="welcome-copy">
          <span className="banner-eyebrow"><Sparkles size={14} /> YOUR CAMPUS LIBRARY</span>
          <h2>Make room for<br />a little <em>discovery.</em></h2>
          <p>Explore class notes, guides, and ideas shared by your community.</p>
          <button className="button button-light" onClick={() => onNavigate('discover')}>Explore resources <ArrowRight size={16} /></button>
        </div>
        <div className="banner-art" aria-hidden="true">
          <div className="art-sun" />
          <div className="art-book book-back"><span /></div>
          <div className="art-book book-front"><span /><i /><i /><i /></div>
          <div className="art-star star-one">✦</div><div className="art-star star-two">✳</div>
        </div>
      </section>

      <section className="stats-grid" aria-label="Your learning activity">
        <StatCard icon={BookOpen} label="Library resources" value={dashboard?.totalApprovedResources ?? '—'} note="Ready to explore" tone="blue" />
        <StatCard icon={UploadCloud} label="Your contributions" value={counts?.total ?? '—'} note={counts ? `${counts.Pending || 0} awaiting review` : 'Resources you’ve shared'} tone="purple" />
        <StatCard icon={Bookmark} label="Saved for later" value={dashboard?.bookmarks?.count ?? '—'} note="Your personal reading list" tone="peach" />
      </section>

      <section className="content-section">
        <div className="section-heading">
          <div><span className="section-kicker">FRESH FROM THE LIBRARY</span><h2>Recently shared</h2></div>
          <button className="text-button" onClick={() => onNavigate('discover')}>Browse all <ArrowRight size={15} /></button>
        </div>
        <ResourceList resources={recent.slice(0, 4)} loading={loading} savedIds={savedIds} onBookmark={onBookmark} onDownload={onDownload} />
      </section>
    </>
  );
}

function FiltersBar({ filters, setFilters, subjects, categories, page }) {
  const statusFilter = page === 'uploads' || page === 'review';
  const update = (key) => (event) => setFilters((current) => ({ ...current, [key]: event.target.value }));
  return (
    <div className="filters-bar">
      <div className="filter-title"><SlidersHorizontal size={16} /><span>Filter by</span></div>
      <div className="filter-controls">
        <select aria-label="Subject" value={filters.subject} onChange={update('subject')}><option value="">All subjects</option>{subjects.map((subject) => <option key={subject._id} value={subject._id}>{subject.subjectName}</option>)}</select>
        <select aria-label="Category" value={filters.category} onChange={update('category')}><option value="">All categories</option>{categories.map((category) => <option key={category._id} value={category._id}>{category.categoryName}</option>)}</select>
        <select aria-label="Semester" value={filters.semester} onChange={update('semester')}><option value="">Any semester</option>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>Semester {index + 1}</option>)}</select>
        <select aria-label="File type" value={filters.fileType} onChange={update('fileType')}><option value="">Any file type</option>{['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'csv', 'zip'].map((type) => <option key={type} value={type}>{type.toUpperCase()}</option>)}</select>
        {statusFilter && <select aria-label="Status" value={filters.status} onChange={update('status')}><option value="">All statuses</option>{['Pending', 'Approved', 'Rejected'].map((status) => <option key={status} value={status}>{status}</option>)}</select>}
      </div>
      <Filter size={16} className="filter-end-icon" />
    </div>
  );
}

function AdminSummary({ data }) {
  return (
    <section className="admin-summary">
      <div><span className="section-kicker">COMMUNITY SNAPSHOT</span><h2>Library at a glance</h2></div>
      <div className="admin-summary-stats">
        <div><Users size={17} /><strong>{data?.users?.total ?? '—'}</strong><span>Members</span></div>
        <div><FileText size={17} /><strong>{data?.resources?.total ?? '—'}</strong><span>Resources</span></div>
        <div><Clock3 size={17} /><strong>{data?.resources?.pending ?? '—'}</strong><span>In review</span></div>
      </div>
    </section>
  );
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('studyspace_token'));
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [booting, setBooting] = useState(Boolean(localStorage.getItem('studyspace_token')));
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [resources, setResources] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [adminDashboard, setAdminDashboard] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ subject: '', category: '', semester: '', fileType: '', status: 'Pending' });

  const savedIds = useMemo(() => new Set(bookmarks.map((item) => item.resource?._id).filter(Boolean)), [bookmarks]);
  const subjects = dashboard?.subjects || [];
  const categories = dashboard?.categories || [];

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchText.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchText]);

  useEffect(() => {
    setCurrentPage(1);
  }, [page, search, filters.subject, filters.category, filters.semester, filters.fileType, filters.status]);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setBooting(false);
      return;
    }
    let active = true;
    setBooting(true);
    apiRequest('/auth/me', { token })
      .then((data) => { if (active) setUser(data.user); })
      .catch((requestError) => {
        if (!active) return;
        if (requestError.status === 401) {
          localStorage.removeItem('studyspace_token');
          setToken(null);
        }
        setUser(null);
        setError(requestError.status === 401 ? 'Your session expired. Please sign in again.' : getErrorMessage(requestError));
      })
      .finally(() => { if (active) setBooting(false); });
    return () => { active = false; };
  }, [token]);

  useEffect(() => {
    if (!token || !user) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        if (page === 'overview') {
          const [dashboardData, resourceData] = await Promise.all([
            apiRequest('/dashboard', { token }),
            apiRequest('/resources?limit=4', { token }),
          ]);
          if (!active) return;
          setDashboard(dashboardData);
          setResources(resourceData.resources || dashboardData.recentResources || []);
          setPagination(resourceData.pagination || null);
        } else if (page === 'saved') {
          const data = await apiRequest('/bookmarks', { token });
          if (!active) return;
          const items = data.bookmarks || [];
          setBookmarks(items);
          setResources(items.map((item) => item.resource).filter(Boolean));
          setPagination(null);
        } else {
          const params = new URLSearchParams({ limit: '12', page: String(currentPage) });
          if (search && page !== 'uploads') params.set('search', search);
          if (filters.subject) params.set('subject', filters.subject);
          if (filters.category) params.set('category', filters.category);
          if (filters.semester) params.set('semester', filters.semester);
          if (filters.fileType) params.set('fileType', filters.fileType);
          let endpoint = '/resources';
          if (page === 'uploads') {
            endpoint = '/resources/my';
            if (filters.status) params.set('status', filters.status);
          } else if (page === 'review') {
            endpoint = '/admin/resources';
            if (filters.status) params.set('status', filters.status);
          }
          const data = await apiRequest(`${endpoint}?${params.toString()}`, { token });
          if (!active) return;
          setResources(data.resources || []);
          setPagination(data.pagination || null);
          if (page === 'review') {
            const adminData = await apiRequest('/admin/dashboard', { token });
            if (active) setAdminDashboard(adminData);
          }
        }
      } catch (requestError) {
        if (!active) return;
        setError(getErrorMessage(requestError));
        if (requestError.status === 401) {
          localStorage.removeItem('studyspace_token');
          setToken(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [token, user, page, search, filters, currentPage, refreshKey]);

  useEffect(() => {
    if (!token || !user) return;
    apiRequest('/bookmarks', { token })
      .then((data) => setBookmarks(data.bookmarks || []))
      .catch((requestError) => {
        if (requestError.status !== 401) setError(getErrorMessage(requestError));
      });
  }, [token, user]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(''), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function signIn(data) {
    localStorage.setItem('studyspace_token', data.token);
    setToken(data.token);
    setUser(data.user);
    setPage('overview');
    setError('');
  }

  function signOut() {
    localStorage.removeItem('studyspace_token');
    setToken(null);
    setUser(null);
    setDashboard(null);
    setBookmarks([]);
    setResources([]);
    setPage('overview');
  }

  function navigateTo(nextPage) {
    setPage(nextPage);
    if (nextPage === 'review') {
      setFilters((current) => ({ ...current, status: current.status || 'Pending' }));
    } else if (nextPage === 'uploads') {
      setFilters((current) => ({ ...current, status: '' }));
    }
    setError('');
  }

  async function toggleBookmark(resource) {
    try {
      if (savedIds.has(resource._id)) {
        await apiRequest(`/bookmarks/${resource._id}`, { token, method: 'DELETE' });
        setBookmarks((current) => current.filter((item) => item.resource?._id !== resource._id));
        if (page === 'saved') setResources((current) => current.filter((item) => item._id !== resource._id));
        setToast('Removed from your saved resources.');
      } else {
        await apiRequest(`/bookmarks/${resource._id}`, { token, method: 'POST' });
        setBookmarks((current) => [{ resource }, ...current]);
        setToast('Saved to your reading list.');
      }
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  async function handleDownload(resource) {
    try {
      await downloadResource(resource, token);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      if (requestError.status === 401) {
        localStorage.removeItem('studyspace_token');
        setToken(null);
      }
    }
  }

  async function submitUpload(formData) {
    setUploading(true);
    try {
      const data = await apiRequest('/resources', { token, method: 'POST', body: formData });
      setUploadOpen(false);
      setFilters((current) => ({ ...current, status: '' }));
      navigateTo('uploads');
      setToast(data.message || 'Your resource has been uploaded.');
      setRefreshKey((current) => current + 1);
    } catch (requestError) {
      throw requestError;
    } finally {
      setUploading(false);
    }
  }

  async function reviewResource(resource, action) {
    const reason = action === 'reject' ? window.prompt('Optional reason for rejection:') : null;
    if (action === 'reject' && reason === null) return;
    try {
      await apiRequest(`/admin/resources/${resource._id}/${action}`, {
        token,
        method: 'PATCH',
        body: action === 'reject' && reason.trim() ? { reason: reason.trim() } : {},
      });
      setToast(action === 'approve' ? 'Resource approved and added to the library.' : 'Resource marked as rejected.');
      setRefreshKey((current) => current + 1);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  if (booting) {
    return <main className="boot-screen"><div className="brand-mark"><BookOpen size={22} /></div><span className="spinner" /><p>Getting your space ready…</p></main>;
  }
  if (!user || !token) return <AuthScreen onAuthenticated={signIn} notice={error} />;

  const pageIsList = ['discover', 'saved', 'uploads', 'review'].includes(page);
  const resourceHeading = {
    discover: ['YOUR CAMPUS LIBRARY', 'All resources'],
    saved: ['YOUR PERSONAL COLLECTION', 'Saved for later'],
    uploads: ['YOUR CONTRIBUTIONS', 'Resources you’ve shared'],
    review: ['NEEDS YOUR ATTENTION', 'Submissions to review'],
  }[page];

  return (
    <div className="app-shell">
      <Sidebar page={page} setPage={navigateTo} user={user} onLogout={signOut} open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <main className="main-panel">
        <Header
          page={page}
          user={user}
          searchText={searchText}
          setSearchText={setSearchText}
          onSearch={(event) => { event.preventDefault(); setSearch(searchText.trim()); if (page === 'overview' || page === 'saved') navigateTo('discover'); }}
          onMenu={() => setMobileNavOpen(true)}
          onUpload={() => setUploadOpen(true)}
        />
        <div className="page-content">
          {error && <div className="notice notice-error" role="alert"><span>{error}</span><button onClick={() => setError('')} aria-label="Dismiss error"><X size={16} /></button></div>}

          {page === 'overview' && (
            <Overview
              dashboard={dashboard}
              resources={resources}
              loading={loading}
              savedIds={savedIds}
              onNavigate={navigateTo}
              onBookmark={toggleBookmark}
              onDownload={handleDownload}
            />
          )}

          {pageIsList && (
            <>
              {page === 'review' && <AdminSummary data={adminDashboard} />}
              {page === 'discover' && <section className="discover-intro"><div><span className="section-kicker">LEARN SOMETHING NEW</span><h2>Find your next favorite resource.</h2><p>Thoughtful materials, shared by people in your learning community.</p></div><div className="intro-icon"><GraduationCap size={30} /></div></section>}
              <section className="content-section list-section">
                <div className="section-heading list-heading">
                  <div><span className="section-kicker">{resourceHeading[0]}</span><h2>{resourceHeading[1]}</h2></div>
                  {page === 'uploads' && <button className="button button-primary" onClick={() => setUploadOpen(true)}><Plus size={16} /> Share resource</button>}
                </div>
                {page !== 'saved' && <FiltersBar filters={filters} setFilters={(updater) => { setCurrentPage(1); setFilters(updater); }} subjects={subjects} categories={categories} page={page} />}
                <ResourceList
                  resources={resources}
                  loading={loading}
                  savedIds={savedIds}
                  onBookmark={page === 'review' ? null : toggleBookmark}
                  onDownload={handleDownload}
                  showStatus={page === 'uploads' || page === 'review'}
                  onReview={page === 'review' ? (resource) => (
                    <div className="review-actions">
                      {resource.status !== 'Approved' && <button className="button button-approve" onClick={() => reviewResource(resource, 'approve')}><Check size={15} /> Approve</button>}
                      {resource.status !== 'Rejected' && <button className="button button-reject" onClick={() => reviewResource(resource, 'reject')}>Reject</button>}
                    </div>
                  ) : null}
                />
                {!loading && pagination?.totalPages > 1 && <div className="pagination"><span>Page {pagination.page} of {pagination.totalPages} <span className="pagination-total">· {pagination.total} resources</span></span><div><button aria-label="Previous page" disabled={pagination.page <= 1} onClick={() => setCurrentPage((current) => Math.max(1, current - 1))}><ChevronLeft size={17} /></button><button aria-label="Next page" disabled={pagination.page >= pagination.totalPages} onClick={() => setCurrentPage((current) => Math.min(pagination.totalPages, current + 1))}><ChevronRight size={17} /></button></div></div>}
              </section>
            </>
          )}

          {page === 'overview' && user.role === 'Admin' && adminDashboard && <AdminSummary data={adminDashboard} />}
          {page === 'overview' && dashboard && (
            <section className="content-section category-section">
              <div className="section-heading"><div><span className="section-kicker">EXPLORE BY SUBJECT</span><h2>Find your focus</h2></div><button className="text-button" onClick={() => setPage('discover')}>See everything <ArrowRight size={15} /></button></div>
              {subjects.length ? <div className="subject-chips">{subjects.slice(0, 8).map((subject, index) => <button key={subject._id} onClick={() => { setFilters((current) => ({ ...current, subject: subject._id })); navigateTo('discover'); }}><span className={`subject-color color-${index % 5}`}><BookOpen size={15} /></span><span><strong>{subject.subjectName}</strong><small>{subject.subjectCode || 'Explore resources'}</small></span><ArrowRight size={14} /></button>)}</div> : <p className="muted-copy">Subjects will appear here once they’re added to your library.</p>}
            </section>
          )}
        </div>
        <footer className="main-footer"><span>© {new Date().getFullYear()} StudySpace</span><span>Learn together, go further.</span></footer>
      </main>

      {uploadOpen && <UploadDialog subjects={subjects} categories={categories} onClose={() => setUploadOpen(false)} onSubmit={submitUpload} busy={uploading} />}
      {toast && <div className="toast"><span className="toast-check"><Check size={14} /></span>{toast}<button onClick={() => setToast('')} aria-label="Dismiss notification"><X size={15} /></button></div>}
    </div>
  );
}
