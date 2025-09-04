import { useEffect, useState, useMemo } from "react";
import { db } from "../lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import ApplicationForm from "../components/ApplicationForm";

// TypeScript interfaces
interface Application {
  id: string;
  jobTitle: string;
  company: string;
  location?: string;
  jobLink?: string;
  status: 'to-apply' | 'applied' | 'interviewing' | 'offer' | 'rejected';
  notes?: string;
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

export default function Dashboard() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    company: '',
    status: '',
    sortBy: 'newest'
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
        setError('Failed to connect to database');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

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

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Modern Header */}
      <div className="bg-white border-b border-slate-200" style={{ boxShadow: 'var(--shadow-sm)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-8">
            <div>
              <h1 className="text-4xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                GradTracker
              </h1>
              <p className="text-lg mt-2" style={{ color: 'var(--color-text-secondary)' }}>
                Track your job applications with ease
              </p>
            </div>
            <ApplicationForm onApplicationAdded={handleApplicationAdded} />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Enhanced Stats Summary */}
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

        {/* Results Count */}
        <div className="flex justify-between items-center mb-8">
          <p className="text-lg font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            {filteredAndSortedApplications.length} of {applications.length} applications
          </p>
        </div>

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

                {/* Enhanced Footer */}
                <div className="flex justify-between items-center pt-6 border-t border-slate-100">
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}