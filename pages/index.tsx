import { useEffect, useState, useMemo } from "react";
import { db } from "../lib/firebase";
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc } from "firebase/firestore";
import ApplicationForm from "../components/ApplicationForm";
import ResumeUpload from "../components/ResumeUpload";
import ResumesDisplay from "../components/ResumesDisplay";
import ResumeInsights from "../components/ResumeInsights";
import TabNavigation, { TabContent } from "../components/TabNavigation";
import ViewSwitcher from "../components/ViewSwitcher";
import KanbanBoard from "../components/KanbanBoard";

// TypeScript interfaces
interface Application {
  id: string;
  jobTitle: string;
  company: string;
  location?: string;
  jobLink?: string;
  status: 'saved' | 'applied' | 'phone-screen' | 'interview' | 'offer' | 'rejected';
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
  const [activeTab, setActiveTab] = useState('applications');
  
  // View management for Applications section
  const [currentView, setCurrentView] = useState<'board' | 'list' | 'map' | 'analytics'>('board');
  const [editFormData, setEditFormData] = useState<{
    jobTitle: string;
    company: string;
    location: string;
    jobLink: string;
    status: 'saved' | 'applied' | 'phone-screen' | 'interview' | 'offer' | 'rejected';
    notes: string;
    resumeId: string;
  }>({
    jobTitle: '',
    company: '',
    location: '',
    jobLink: '',
    status: 'saved',
    notes: '',
    resumeId: ''
  });

  // Industry-standard status pipeline following Huntr/Teal patterns
  const statusOptions: StatusOption[] = [
    { value: '', label: 'All Status', bgColor: '', textColor: '', dotColor: '' },
    { value: 'saved', label: 'Saved', bgColor: 'bg-slate-50', textColor: 'text-slate-700', dotColor: 'bg-slate-400' },
    { value: 'applied', label: 'Applied', bgColor: 'bg-blue-50', textColor: 'text-blue-700', dotColor: 'bg-blue-500' },
    { value: 'phone-screen', label: 'Phone Screen', bgColor: 'bg-purple-50', textColor: 'text-purple-700', dotColor: 'bg-purple-500' },
    { value: 'interview', label: 'Interview', bgColor: 'bg-amber-50', textColor: 'text-amber-700', dotColor: 'bg-amber-500' },
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

  // Define navigation tabs
  const tabs = [
    {
      id: 'applications',
      label: 'Applications',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      count: applications.length
    },
    {
      id: 'resumes',
      label: 'Resumes',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      count: resumes.length
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    }
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar Navigation */}
      <TabNavigation 
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
        {/* Top Header Bar */}
        <div className="bg-white border-b border-slate-200 px-8 py-6 flex justify-between items-center" style={{ boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {tabs.find(tab => tab.id === activeTab)?.label || 'Dashboard'}
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Manage your job search efficiently
            </p>
          </div>
          {activeTab === 'applications' && (
            <ApplicationForm onApplicationAdded={handleApplicationAdded} />
          )}
        </div>

      {/* Applications Tab */}
      <TabContent activeTab={activeTab} tabId="applications">
        {/* View Switcher */}
        {!loading && !error && (
          <ViewSwitcher
            currentView={currentView}
            onViewChange={setCurrentView}
            applicationCount={applications.length}
          />
        )}

        {/* Modern Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="flex items-center space-x-4">
              <div className="w-6 h-6 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <span className="text-lg font-medium text-slate-600">
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
          <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <div className="text-center max-w-lg">
              <div className="text-8xl mb-8">📝</div>
              <h2 className="text-4xl font-bold mb-6 text-slate-900">
                No applications yet
              </h2>
              <p className="text-xl mb-10 text-slate-600 leading-relaxed">
                Get started by adding your first job application and begin tracking your career journey!
              </p>
              <ApplicationForm onApplicationAdded={handleApplicationAdded} />
            </div>
          </div>
        )}

        {/* Enhanced No Results State */}
        {!loading && !error && currentView !== 'board' && filteredAndSortedApplications.length === 0 && applications.length > 0 && (
          <div className="flex items-center justify-center min-h-[calc(100vh-300px)]">
            <div className="text-center max-w-lg">
              <div className="text-8xl mb-8">🔍</div>
              <h2 className="text-4xl font-bold mb-6 text-slate-900">
                No matching applications
              </h2>
              <p className="text-xl mb-10 text-slate-600 leading-relaxed">
                Try adjusting your filters to see more results.
              </p>
              <button
                onClick={clearFilters}
                className="btn-primary px-8 py-4 text-lg font-semibold"
              >
                Clear all filters
              </button>
            </div>
          </div>
        )}

        {/* View Content */}
        {!loading && !error && applications.length > 0 && (
          <>
            {/* Kanban Board View */}
            {currentView === 'board' && (
              <KanbanBoard
                applications={applications}
                onApplicationEdit={handleEditApplication}
                onApplicationDelete={handleDeleteApplication}
                getResumeName={getResumeName}
              />
            )}

            {/* List View */}
            {currentView === 'list' && (
              <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm">
                <div className="text-center py-20">
                  <div className="text-6xl mb-4">📋</div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">List View</h3>
                  <p className="text-slate-600">Detailed table view coming soon</p>
                </div>
              </div>
            )}

            {/* Map View */}
            {currentView === 'map' && (
              <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm">
                <div className="text-center py-20">
                  <div className="text-6xl mb-4">🗺️</div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">Map View</h3>
                  <p className="text-slate-600">Geographic visualization coming soon</p>
                </div>
              </div>
            )}

            {/* Analytics View */}
            {currentView === 'analytics' && (
              <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm">
                <div className="text-center py-20">
                  <div className="text-6xl mb-4">📊</div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">Analytics View</h3>
                  <p className="text-slate-600">Success metrics and insights coming soon</p>
                </div>
              </div>
            )}
          </>
        )}


        {/* Enhanced Stats Summary - Moved up for better visibility */}
        {!loading && !error && applications.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
            {statusOptions.slice(1).map((status) => {
              const count = applications.filter(app => app.status === status.value).length;
              return (
                <div
                  key={status.value}
                  className={`card-hover bg-white rounded-xl p-6 text-center border border-slate-100 shadow-md`}
                >
                  <div className="flex items-center justify-center mb-4">
                    <div className={`w-4 h-4 rounded-full ${status.dotColor} mr-3`}></div>
                    <span className={`inline-flex px-4 py-2 rounded-full text-sm font-semibold ${status.bgColor} ${status.textColor} status-badge`}>
                      {status.label}
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-slate-900">
                    {count}
                  </div>
                  <div className="text-sm mt-1 text-slate-500">
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
            <div className="bg-white rounded-xl p-8 mb-10 border border-slate-100 shadow-md">
              <div className="flex flex-col xl:flex-row gap-6 items-start xl:items-end">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Company Filter */}
                  <div>
                    <label htmlFor="company-filter" className="block text-sm font-semibold mb-3 text-slate-900">
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
                    <label htmlFor="status-filter" className="block text-sm font-semibold mb-3 text-slate-900">
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
                    <label htmlFor="sort-filter" className="block text-sm font-semibold mb-3 text-slate-900">
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
                  <span className="text-sm font-medium text-slate-600">
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

          </>
        )}
      </TabContent>

      {/* Resumes Tab */}
      <TabContent activeTab={activeTab} tabId="resumes">
        {/* Resume Manager Section */}
        <div className="bg-white rounded-xl p-8 mb-10 border border-slate-100 shadow-md">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Resume Manager
              </h2>
              <p className="text-sm mt-1 text-slate-600">
                Upload and manage your resume versions
              </p>
            </div>
            <ResumeUpload />
          </div>
          
          <ResumesDisplay applications={applications} />
        </div>

      </TabContent>

      {/* Analytics Tab */}
      <TabContent activeTab={activeTab} tabId="analytics">
        {/* Advanced Analytics Dashboard */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">
              Advanced Analytics
            </h2>
          </div>
          <ResumeInsights />
        </div>

        {/* Future Analytics Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          {/* Application Trends */}
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                Application Trends
              </h3>
            </div>
            <div className="text-center py-8">
              <div className="text-slate-400 mb-3">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-600">Coming Soon</p>
              <p className="text-xs text-slate-500 mt-1">Track application volume trends over time</p>
            </div>
          </div>

          {/* Company Insights */}
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                Company Insights
              </h3>
            </div>
            <div className="text-center py-8">
              <div className="text-slate-400 mb-3">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-600">Coming Soon</p>
              <p className="text-xs text-slate-500 mt-1">Analyze success rates by company type</p>
            </div>
          </div>

          {/* Time Analysis */}
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                Response Time Analysis
              </h3>
            </div>
            <div className="text-center py-8">
              <div className="text-slate-400 mb-3">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-600">Coming Soon</p>
              <p className="text-xs text-slate-500 mt-1">Track average response times</p>
            </div>
          </div>

          {/* Goal Tracking */}
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                Goal Progress
              </h3>
            </div>
            <div className="text-center py-8">
              <div className="text-slate-400 mb-3">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-600">Coming Soon</p>
              <p className="text-xs text-slate-500 mt-1">Set and track application goals</p>
            </div>
          </div>
        </div>
      </TabContent>

      {/* Settings Tab */}
      <TabContent activeTab={activeTab} tabId="settings">
        <div className="max-w-4xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-slate-100 rounded-lg">
              <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">
              Settings
            </h2>
          </div>

          {/* Settings Sections */}
          <div className="space-y-6">
            {/* Profile Settings */}
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Profile Settings
                </h3>
              </div>
              <div className="text-center py-8">
                <div className="text-slate-400 mb-3">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-slate-600">Coming Soon</p>
                <p className="text-xs text-slate-500 mt-1">Manage your profile and preferences</p>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Notifications
                </h3>
              </div>
              <div className="text-center py-8">
                <div className="text-slate-400 mb-3">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-5 5v-5zM9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-slate-600">Coming Soon</p>
                <p className="text-xs text-slate-500 mt-1">Configure email and push notifications</p>
              </div>
            </div>

            {/* Data Management */}
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Data Management
                </h3>
              </div>
              <div className="text-center py-8">
                <div className="text-slate-400 mb-3">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-slate-600">Coming Soon</p>
                <p className="text-xs text-slate-500 mt-1">Export data and manage backups</p>
              </div>
            </div>
          </div>
        </div>
      </TabContent>

      {/* Edit Application Modal */}
        {editingApplication && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
            style={{ backdropFilter: 'blur(8px)' }}
          >
            <div 
              className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200 shadow-xl"
            >
              <div className="px-8 py-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-slate-50">
                <h2 className="text-3xl font-bold text-slate-900">
                  Edit Application
                </h2>
                <p className="text-lg mt-2 text-slate-600">
                  Update your job application details
                </p>
              </div>

              {/* Edit Form */}
              <form onSubmit={handleEditFormSubmit} className="px-8 py-8 space-y-8">
                {/* Job Title */}
                <div>
                  <label htmlFor="edit-jobTitle" className="block text-sm font-semibold mb-3 text-slate-900">
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
                  <label htmlFor="edit-company" className="block text-sm font-semibold mb-3 text-slate-900">
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
                    <label htmlFor="edit-location" className="block text-sm font-semibold mb-3 text-slate-900">
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
                    <label htmlFor="edit-jobLink" className="block text-sm font-semibold mb-3 text-slate-900">
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
                  <label htmlFor="edit-status" className="block text-sm font-semibold mb-3 text-slate-900">
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
                    <span className="text-sm font-medium text-slate-600">
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
                  <label htmlFor="edit-resumeId" className="block text-sm font-semibold mb-3 text-slate-900">
                    Resume Used <span className="text-sm font-normal text-slate-600">(Optional)</span>
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
                      <span className="text-sm font-medium text-slate-600">
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
                  <label htmlFor="edit-notes" className="block text-sm font-semibold mb-3 text-slate-900">
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
                  <div className="mt-2 text-xs text-slate-500">
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
              className="bg-white rounded-2xl w-full max-w-md border border-slate-200 shadow-xl"
            >
              <div className="px-8 py-6 border-b border-slate-200 bg-gradient-to-r from-red-50 to-slate-50">
                <h2 className="text-2xl font-bold text-red-700">
                  Delete Application
                </h2>
                <p className="text-lg mt-2 text-slate-600">
                  Are you sure you want to delete this application?
                </p>
              </div>

              <div className="px-8 py-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {deletingApplication.jobTitle}
                  </h3>
                  <p className="text-md text-blue-600">
                    {deletingApplication.company}
                  </p>
                  {deletingApplication.location && (
                    <p className="text-sm text-slate-500">
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