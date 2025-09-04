import { useEffect, useState, useMemo } from "react";
import { db } from "../lib/firebase";
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc } from "firebase/firestore";
import ApplicationForm from "../components/ApplicationForm";
import ResumeUpload from "../components/ResumeUpload";
import ResumesDisplay from "../components/ResumesDisplay";
import ResumeInsights from "../components/ResumeInsights";

// TypeScript interfaces
interface Application {
  id: string;
  jobTitle: string;
  company: string;
  location?: string;
  jobLink?: string;
  status: 'to-apply' | 'applied' | 'interviewing' | 'offer' | 'rejected';
  notes?: string;
  resumeId?: string; // Optional reference to resume
  createdAt: any; // Firebase Timestamp
  updatedAt: any; // Firebase Timestamp
}

interface FilterState {
  company: string;
  status: string;
  sortBy: string;
}

type StatusOption = {
  value: string;
  label: string;
  bgColor: string;
  textColor: string;
  dotColor: string;
};

interface Resume {
  id: string;
  name: string;
}

export default function Dashboard() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    company: '',
    status: '',
    sortBy: 'newest'
  });
  const [editingApplication, setEditingApplication] = useState<Application | null>(null);
  const [deletingApplication, setDeletingApplication] = useState<Application | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editFormData, setEditFormData] = useState<{
    jobTitle: string;
    company: string;
    location: string;
    jobLink: string;
    status: 'to-apply' | 'applied' | 'interviewing' | 'offer' | 'rejected';
    notes: string;
    resumeId: string;
  }>({
    jobTitle: '',
    company: '',
    location: '',
    jobLink: '',
    status: 'to-apply',
    notes: '',
    resumeId: ''
  });

  const statusOptions: StatusOption[] = [
    { value: '', label: 'All Status', bgColor: '', textColor: '', dotColor: '' },
    { value: 'to-apply', label: 'To Apply', bgColor: 'bg-slate-50', textColor: 'text-slate-700', dotColor: 'bg-slate-400' },
    { value: 'applied', label: 'Applied', bgColor: 'bg-blue-50', textColor: 'text-blue-700', dotColor: 'bg-blue-500' },
    { value: 'interviewing', label: 'Interviewing', bgColor: 'bg-amber-50', textColor: 'text-amber-700', dotColor: 'bg-amber-500' },
    { value: 'offer', label: 'Offer', bgColor: 'bg-emerald-50', textColor: 'text-emerald-700', dotColor: 'bg-emerald-500' },
    { value: 'rejected', label: 'Rejected', bgColor: 'bg-red-50', textColor: 'text-red-700', dotColor: 'bg-red-500' }
  ];

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'company-asc', label: 'Company A-Z' },
    { value: 'company-desc', label: 'Company Z-A' },
    { value: 'status', label: 'Status' }
  ];

  // Real-time Firebase listener
  useEffect(() => {
    setLoading(true);
    setError(null);

    const q = query(collection(db, 'applications'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        try {
          const apps: Application[] = [];
          querySnapshot.forEach((doc) => {
            apps.push({
              id: doc.id,
              ...doc.data()
            } as Application);
          });
          setApplications(apps);
          setLoading(false);
        } catch (err) {
          console.error('Error processing applications:', err);
          setError('Failed to load applications');
          setLoading(false);
        }
      },
      (err) => {
        console.error('Error fetching applications:', err);
        
        // Check for specific Firebase connection errors
        if (err.code === 'unavailable' || err.message?.includes('transport errored')) {
          setError('Connection lost. Your applications will load when connection is restored. Any changes will be saved automatically.');
        } else if (err.code === 'permission-denied') {
          setError('Access denied. Please check your permissions.');
        } else {
          setError('Failed to connect to database. Please refresh the page.');
        }
        
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Fetch resumes from Firebase
  useEffect(() => {
    const q = query(collection(db, 'resumes'), orderBy('uploadDate', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const resumeData: Resume[] = [];
      snapshot.forEach((doc) => {
        resumeData.push({
          id: doc.id,
          name: doc.data().name
        });
      });
      setResumes(resumeData);
    }, (error) => {
      console.error('Error fetching resumes:', error);
    });

    return () => unsubscribe();
  }, []);

  // Helper function to get resume name by ID
  const getResumeName = (resumeId: string): string | null => {
    const resume = resumes.find(r => r.id === resumeId);
    return resume ? resume.name : null;
  };

  // Filtered and sorted applications
  const filteredAndSortedApplications = useMemo(() => {
    let filtered = applications;

    // Filter by company
    if (filters.company) {
      filtered = filtered.filter(app =>
        app.company.toLowerCase().includes(filters.company.toLowerCase())
      );
    }

    // Filter by status
    if (filters.status) {
      filtered = filtered.filter(app => app.status === filters.status);
    }

    // Sort applications
    const sorted = [...filtered].sort((a, b) => {
      switch (filters.sortBy) {
        case 'oldest':
          return a.createdAt?.seconds - b.createdAt?.seconds || 0;
        case 'company-asc':
          return a.company.localeCompare(b.company);
        case 'company-desc':
          return b.company.localeCompare(a.company);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'newest':
        default:
          return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      }
    });

    return sorted;
  }, [applications, filters]);

  // Handle filter changes
  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      company: '',
      status: '',
      sortBy: 'newest'
    });
  };

  // Format date
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Get status display info
  const getStatusInfo = (status: string) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    return statusOption || { label: status, bgColor: 'bg-slate-50', textColor: 'text-slate-700', dotColor: 'bg-slate-400' };
  };

  // Truncate text
  const truncateText = (text: string, maxLength: number = 100) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const handleApplicationAdded = () => {
    // Real-time listener will automatically update the list
    console.log('Application added - list will update automatically');
  };

  // Edit application handler
  const handleEditApplication = (application: Application) => {
    setEditingApplication(application);
    setEditFormData({
      jobTitle: application.jobTitle,
      company: application.company,
      location: application.location || '',
      jobLink: application.jobLink || '',
      status: application.status,
      notes: application.notes || '',
      resumeId: application.resumeId || ''
    });
  };

  // Handle edit form input changes
  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setEditFormData({
      ...editFormData,
      [e.target.name]: e.target.value
    });
  };

  // Handle edit form submission
  const handleEditFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleUpdateApplication(editFormData);
  };

  // Update application handler
  const handleUpdateApplication = async (updatedData: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!editingApplication) return;

    setIsUpdating(true);
    try {
      await updateDoc(doc(db, 'applications', editingApplication.id), {
        ...updatedData,
        updatedAt: new Date()
      });
      setEditingApplication(null);
      console.log('Application updated successfully');
    } catch (error: any) {
      console.error('Error updating application:', error);
      
      // Enhanced error handling for connection issues
      if (error.code === 'unavailable' || error.message?.includes('transport errored')) {
        alert('Connection lost. Your changes will be saved automatically when connection is restored. Please keep the page open.');
      } else if (error.code === 'permission-denied') {
        alert('Permission denied. Unable to update application.');
      } else {
        alert('Failed to update application. Please check your connection and try again.');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete confirmation handler
  const handleDeleteApplication = (application: Application) => {
    setDeletingApplication(application);
  };

  // Confirm delete handler
  const confirmDeleteApplication = async () => {
    if (!deletingApplication) return;

    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'applications', deletingApplication.id));
      setDeletingApplication(null);
      console.log('Application deleted successfully');
    } catch (error: any) {
      console.error('Error deleting application:', error);
      
      // Enhanced error handling for connection issues
      if (error.code === 'unavailable' || error.message?.includes('transport errored')) {
        alert('Connection lost. Delete operation will complete when connection is restored. Please keep the page open.');
      } else if (error.code === 'permission-denied') {
        alert('Permission denied. Unable to delete application.');
      } else {
        alert('Failed to delete application. Please check your connection and try again.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Cancel handlers
  const cancelEdit = () => {
    setEditingApplication(null);
  };

  const cancelDelete = () => {
    setDeletingApplication(null);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Modern Header */}
      <div className="bg-white border-b border-slate-200" style={{ boxShadow: 'var(--shadow-sm)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-8">
            <div className="flex items-center gap-4">
              <img 
                src="/logo.png?v=2" 
                alt="GradTracker Logo" 
                className="w-8 h-8 object-contain"
              />
              <div>
                <h1 className="text-4xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  GradTracker
                </h1>
                <p className="text-lg mt-2" style={{ color: 'var(--color-text-secondary)' }}>
                  Track your job applications with ease
                </p>
              </div>
            </div>
            <ApplicationForm onApplicationAdded={handleApplicationAdded} />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* MAIN APPLICATIONS SECTION - MOVED TO TOP */}
        {/* Results Count - Show only when there are applications and filters */}
        {!loading && !error && applications.length > 0 && (
          <div className="flex justify-between items-center mb-8">
            <p className="text-lg font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              {filteredAndSortedApplications.length} of {applications.length} applications
            </p>
          </div>
        )}

        {/* Modern Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="flex items-center space-x-4">
              <div className="w-6 h-6 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <span className="text-lg font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                Loading applications...
              </span>
            </div>
          </div>
        )}

        {/* Enhanced Error State */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-8">
            <div className="flex items-center">
              <div className="text-red-500 text-2xl mr-4">⚠️</div>
              <div>
                <p className="text-red-700 font-semibold text-lg">{error}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="mt-3 text-red-600 hover:text-red-800 underline font-medium"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Empty State */}
        {!loading && !error && filteredAndSortedApplications.length === 0 && applications.length === 0 && (
          <div className="text-center py-20">
            <div className="text-8xl mb-6">📝</div>
            <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              No applications yet
            </h2>
            <p className="text-xl mb-8" style={{ color: 'var(--color-text-secondary)' }}>
              Get started by adding your first job application!
            </p>
            <ApplicationForm onApplicationAdded={handleApplicationAdded} />
          </div>
        )}

        {/* Enhanced No Results State */}
        {!loading && !error && filteredAndSortedApplications.length === 0 && applications.length > 0 && (
          <div className="text-center py-20">
            <div className="text-8xl mb-6">🔍</div>
            <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              No matching applications
            </h2>
            <p className="text-xl mb-8" style={{ color: 'var(--color-text-secondary)' }}>
              Try adjusting your filters to see more results.
            </p>
            <button
              onClick={clearFilters}
              className="btn-primary px-8 py-4 text-lg font-semibold"
            >
              Clear all filters
            </button>
          </div>
        )}

        {/* Enhanced Applications Grid */}
        {!loading && !error && filteredAndSortedApplications.length > 0 && (
          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {filteredAndSortedApplications.map((app) => (
              <div
                key={app.id}
                className="card-hover bg-white rounded-xl p-8 border border-slate-100"
                style={{ boxShadow: 'var(--shadow-md)' }}
              >
                {/* Enhanced Header */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex-1 pr-4">
                    <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                      {app.jobTitle}
                    </h3>
                    <p className="text-lg font-semibold mb-1" style={{ color: 'var(--color-primary)' }}>
                      {app.company}
                    </p>
                    {app.location && (
                      <p className="text-sm flex items-center" style={{ color: 'var(--color-text-tertiary)' }}>
                        <span className="mr-1">📍</span>
                        {app.location}
                      </p>
                    )}
                    
                    {/* Resume Badge */}
                    {app.resumeId && getResumeName(app.resumeId) && (
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                          </svg>
                          {getResumeName(app.resumeId)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${getStatusInfo(app.status).bgColor} ${getStatusInfo(app.status).textColor} status-badge`}>
                      <div className={`w-2 h-2 rounded-full ${getStatusInfo(app.status).dotColor} mr-2`}></div>
                      {getStatusInfo(app.status).label}
                    </div>
                  </div>
                </div>

                {/* Enhanced Notes Preview */}
                {app.notes && (
                  <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                      Notes:
                    </p>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
                      {truncateText(app.notes)}
                    </p>
                  </div>
                )}

                {/* Enhanced Footer with Actions */}
                <div className="pt-6 border-t border-slate-100 space-y-4">
                  {/* Date Information */}
                  <div className="text-xs space-y-1" style={{ color: 'var(--color-text-tertiary)' }}>
                    <div className="flex items-center">
                      <span className="mr-1">📅</span>
                      Added {formatDate(app.createdAt)}
                    </div>
                    {app.updatedAt && app.updatedAt !== app.createdAt && (
                      <div className="flex items-center">
                        <span className="mr-1">✏️</span>
                        Updated {formatDate(app.updatedAt)}
                      </div>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditApplication(app)}
                        className="btn-secondary px-3 py-2 text-sm font-medium flex items-center gap-2 hover:bg-blue-50"
                      >
                        <span className="text-blue-600">✏️</span>
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteApplication(app)}
                        className="btn-secondary px-3 py-2 text-sm font-medium flex items-center gap-2 hover:bg-red-50 text-red-600 border-red-200"
                      >
                        <span>🗑️</span>
                        Delete
                      </button>
                    </div>
                    {app.jobLink && (
                      <a
                        href={app.jobLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary px-4 py-2 text-sm font-medium"
                      >
                        View Job
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Enhanced Stats Summary - Moved up for better visibility */}
        {!loading && !error && applications.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
            {statusOptions.slice(1).map((status) => {
              const count = applications.filter(app => app.status === status.value).length;
              return (
                <div
                  key={status.value}
                  className={`card-hover bg-white rounded-xl p-6 text-center border border-slate-100`}
                  style={{ boxShadow: 'var(--shadow-md)' }}
                >
                  <div className="flex items-center justify-center mb-4">
                    <div className={`w-4 h-4 rounded-full ${status.dotColor} mr-3`}></div>
                    <span className={`inline-flex px-4 py-2 rounded-full text-sm font-semibold ${status.bgColor} ${status.textColor} status-badge`}>
                      {status.label}
                    </span>
                  </div>
                  <div className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    {count}
                  </div>
                  <div className="text-sm mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                    applications
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* SECONDARY SECTIONS - Always visible but applications remain the primary focus */}
        {!loading && !error && (
          <>
            {/* Modern Filter Controls */}
            <div className="bg-white rounded-xl p-8 mb-10 border border-slate-100" style={{ boxShadow: 'var(--shadow-md)' }}>
              <div className="flex flex-col xl:flex-row gap-6 items-start xl:items-end">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Company Filter */}
                  <div>
                    <label htmlFor="company-filter" className="block text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                      Search Company
                    </label>
                    <input
                      type="text"
                      id="company-filter"
                      value={filters.company}
                      onChange={(e) => handleFilterChange('company', e.target.value)}
                      placeholder="Type company name..."
                      className="input-modern w-full px-4 py-3 text-lg focus-ring"
                    />
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label htmlFor="status-filter" className="block text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                      Filter by Status
                    </label>
                    <select
                      id="status-filter"
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                      className="input-modern w-full px-4 py-3 text-lg focus-ring"
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Sort */}
                  <div>
                    <label htmlFor="sort-filter" className="block text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                      Sort by
                    </label>
                    <select
                      id="sort-filter"
                      value={filters.sortBy}
                      onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                      className="input-modern w-full px-4 py-3 text-lg focus-ring"
                    >
                      {sortOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Clear Filters Button */}
                <button
                  onClick={clearFilters}
                  className="btn-secondary px-6 py-3 text-base font-medium whitespace-nowrap"
                >
                  Clear Filters
                </button>
              </div>

              {/* Active Filters Display */}
              {(filters.company || filters.status) && (
                <div className="mt-6 flex flex-wrap gap-3">
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                    Active filters:
                  </span>
                  {filters.company && (
                    <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200">
                      Company: {filters.company}
                      <button
                        onClick={() => handleFilterChange('company', '')}
                        className="ml-2 text-blue-600 hover:text-blue-800 font-bold text-lg leading-none"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {filters.status && (
                    <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200">
                      Status: {getStatusInfo(filters.status).label}
                      <button
                        onClick={() => handleFilterChange('status', '')}
                        className="ml-2 text-blue-600 hover:text-blue-800 font-bold text-lg leading-none"
                      >
                        ×
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Resume Manager Section */}
            <div className="bg-white rounded-xl p-8 mb-10 border border-slate-100" style={{ boxShadow: 'var(--shadow-md)' }}>
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    Resume Manager
                  </h2>
                  <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                    Upload and manage your resume versions
                  </p>
                </div>
                <ResumeUpload />
              </div>
              
              <ResumesDisplay applications={applications} />
            </div>

            {/* Resume Insights Dashboard */}
            <div className="mb-10">
              <ResumeInsights />
            </div>

          </>
        )}

        {/* Edit Application Modal */}
        {editingApplication && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
            style={{ backdropFilter: 'blur(8px)' }}
          >
            <div 
              className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200"
              style={{ boxShadow: 'var(--shadow-xl)' }}
            >
              <div className="px-8 py-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-slate-50">
                <h2 className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  Edit Application
                </h2>
                <p className="text-lg mt-2" style={{ color: 'var(--color-text-secondary)' }}>
                  Update your job application details
                </p>
              </div>

              {/* Edit Form */}
              <form onSubmit={handleEditFormSubmit} className="px-8 py-8 space-y-8">
                {/* Job Title */}
                <div>
                  <label htmlFor="edit-jobTitle" className="block text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                    Job Title *
                  </label>
                  <input
                    type="text"
                    id="edit-jobTitle"
                    name="jobTitle"
                    value={editFormData.jobTitle}
                    onChange={handleEditInputChange}
                    required
                    className="input-modern w-full px-4 py-3 text-lg focus-ring"
                    placeholder="e.g. Frontend Developer"
                  />
                </div>

                {/* Company */}
                <div>
                  <label htmlFor="edit-company" className="block text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                    Company *
                  </label>
                  <input
                    type="text"
                    id="edit-company"
                    name="company"
                    value={editFormData.company}
                    onChange={handleEditInputChange}
                    required
                    className="input-modern w-full px-4 py-3 text-lg focus-ring"
                    placeholder="e.g. Google"
                  />
                </div>

                {/* Location and Job Link Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Location */}
                  <div>
                    <label htmlFor="edit-location" className="block text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                      Location
                    </label>
                    <input
                      type="text"
                      id="edit-location"
                      name="location"
                      value={editFormData.location}
                      onChange={handleEditInputChange}
                      className="input-modern w-full px-4 py-3 text-lg focus-ring"
                      placeholder="San Francisco, CA / Remote"
                    />
                  </div>

                  {/* Job Link */}
                  <div>
                    <label htmlFor="edit-jobLink" className="block text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                      Job Link
                    </label>
                    <input
                      type="url"
                      id="edit-jobLink"
                      name="jobLink"
                      value={editFormData.jobLink}
                      onChange={handleEditInputChange}
                      className="input-modern w-full px-4 py-3 text-lg focus-ring"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                {/* Enhanced Status */}
                <div>
                  <label htmlFor="edit-status" className="block text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                    Status
                  </label>
                  <select
                    id="edit-status"
                    name="status"
                    value={editFormData.status}
                    onChange={handleEditInputChange}
                    className="input-modern w-full px-4 py-3 text-lg focus-ring"
                  >
                    {statusOptions.slice(1).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  
                  {/* Status Preview */}
                  <div className="mt-3">
                    <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                      Preview:
                    </span>
                    <div className="mt-2">
                      {(() => {
                        const selectedStatus = statusOptions.find(opt => opt.value === editFormData.status);
                        return selectedStatus ? (
                          <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${selectedStatus.bgColor} ${selectedStatus.textColor} status-badge`}>
                            <div className={`w-2 h-2 rounded-full ${selectedStatus.dotColor} mr-2`}></div>
                            {selectedStatus.label}
                          </span>
                        ) : null;
                      })()}
                    </div>
                  </div>
                </div>

                {/* Resume Selection */}
                <div>
                  <label htmlFor="edit-resumeId" className="block text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                    Resume Used <span className="text-sm font-normal" style={{ color: 'var(--color-text-secondary)' }}>(Optional)</span>
                  </label>
                  <select
                    id="edit-resumeId"
                    name="resumeId"
                    value={editFormData.resumeId}
                    onChange={handleEditInputChange}
                    className="input-modern w-full px-4 py-3 text-lg focus-ring"
                  >
                    <option value="">None - No resume attached</option>
                    {resumes.map((resume) => (
                      <option key={resume.id} value={resume.id}>
                        {resume.name}
                      </option>
                    ))}
                  </select>
                  
                  {/* Resume Preview */}
                  {editFormData.resumeId && (
                    <div className="mt-3">
                      <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                        Selected:
                      </span>
                      <div className="mt-2">
                        {(() => {
                          const selectedResume = resumes.find(resume => resume.id === editFormData.resumeId);
                          return selectedResume ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200">
                              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                              </svg>
                              {selectedResume.name}
                            </span>
                          ) : null;
                        })()}
                      </div>
                    </div>
                  )}
                </div>

                {/* Enhanced Notes */}
                <div>
                  <label htmlFor="edit-notes" className="block text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                    Notes
                  </label>
                  <textarea
                    id="edit-notes"
                    name="notes"
                    value={editFormData.notes}
                    onChange={handleEditInputChange}
                    rows={5}
                    className="input-modern w-full px-4 py-3 text-lg focus-ring resize-none"
                    placeholder="Add any additional notes, requirements, or thoughts about this position..."
                  />
                  <div className="mt-2 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    {editFormData.notes.length}/500 characters
                  </div>
                </div>

                {/* Enhanced Form Footer */}
                <div className="flex justify-end gap-4 pt-6 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="btn-secondary px-6 py-3 text-base font-medium"
                    disabled={isUpdating}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating || !editFormData.jobTitle.trim() || !editFormData.company.trim()}
                    className="btn-primary px-8 py-3 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdating ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Updating...
                      </span>
                    ) : (
                      'Update Application'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletingApplication && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
            style={{ backdropFilter: 'blur(8px)' }}
          >
            <div 
              className="bg-white rounded-2xl w-full max-w-md border border-slate-200"
              style={{ boxShadow: 'var(--shadow-xl)' }}
            >
              <div className="px-8 py-6 border-b border-slate-200 bg-gradient-to-r from-red-50 to-slate-50">
                <h2 className="text-2xl font-bold text-red-700">
                  Delete Application
                </h2>
                <p className="text-lg mt-2" style={{ color: 'var(--color-text-secondary)' }}>
                  Are you sure you want to delete this application?
                </p>
              </div>

              <div className="px-8 py-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {deletingApplication.jobTitle}
                  </h3>
                  <p className="text-md" style={{ color: 'var(--color-primary)' }}>
                    {deletingApplication.company}
                  </p>
                  {deletingApplication.location && (
                    <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                      📍 {deletingApplication.location}
                    </p>
                  )}
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-red-700">
                    <strong>Warning:</strong> This action cannot be undone. The application and all its details will be permanently deleted.
                  </p>
                </div>

                <div className="flex justify-end gap-4">
                  <button
                    onClick={cancelDelete}
                    className="btn-secondary px-6 py-3 text-base font-medium"
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteApplication}
                    disabled={isDeleting}
                    className="px-8 py-3 text-base font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDeleting ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Deleting...
                      </span>
                    ) : (
                      'Delete Application'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}