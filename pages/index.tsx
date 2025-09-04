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
  color: string;
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
    { value: '', label: 'All Status', color: '' },
    { value: 'to-apply', label: 'To Apply', color: 'bg-gray-100 text-gray-800' },
    { value: 'applied', label: 'Applied', color: 'bg-blue-100 text-blue-800' },
    { value: 'interviewing', label: 'Interviewing', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'offer', label: 'Offer', color: 'bg-green-100 text-green-800' },
    { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' }
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
    return statusOption || { label: status, color: 'bg-gray-100 text-gray-800' };
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">GradTracker</h1>
              <p className="text-gray-600 mt-1">Track your job applications with ease</p>
            </div>
            <ApplicationForm onApplicationAdded={handleApplicationAdded} />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          {statusOptions.slice(1).map((status) => {
            const count = applications.filter(app => app.status === status.value).length;
            return (
              <div key={status.value} className="bg-white rounded-lg shadow p-4 text-center">
                <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${status.color} mb-2`}>
                  {status.label}
                </div>
                <div className="text-2xl font-bold text-gray-900">{count}</div>
              </div>
            );
          })}
        </div>

        {/* Filter Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Company Filter */}
              <div>
                <label htmlFor="company-filter" className="block text-sm font-medium text-gray-700 mb-2">
                  Search Company
                </label>
                <input
                  type="text"
                  id="company-filter"
                  value={filters.company}
                  onChange={(e) => handleFilterChange('company', e.target.value)}
                  placeholder="Type company name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <div>
                <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Status
                </label>
                <select
                  id="status-filter"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                <label htmlFor="sort-filter" className="block text-sm font-medium text-gray-700 mb-2">
                  Sort by
                </label>
                <select
                  id="sort-filter"
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition duration-200 whitespace-nowrap"
            >
              Clear Filters
            </button>
          </div>

          {/* Active Filters Display */}
          {(filters.company || filters.status) && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-sm text-gray-500">Active filters:</span>
              {filters.company && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Company: {filters.company}
                  <button
                    onClick={() => handleFilterChange('company', '')}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {filters.status && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Status: {getStatusInfo(filters.status).label}
                  <button
                    onClick={() => handleFilterChange('status', '')}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-600">
            {filteredAndSortedApplications.length} of {applications.length} applications
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading applications...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">⚠️ {error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-2 text-red-600 hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredAndSortedApplications.length === 0 && applications.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No applications yet</h2>
            <p className="text-gray-600 mb-6">Get started by adding your first job application!</p>
            <ApplicationForm onApplicationAdded={handleApplicationAdded} />
          </div>
        )}

        {/* No Results State */}
        {!loading && !error && filteredAndSortedApplications.length === 0 && applications.length > 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No matching applications</h2>
            <p className="text-gray-600 mb-4">Try adjusting your filters to see more results.</p>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
            >
              Clear all filters
            </button>
          </div>
        )}

        {/* Applications Grid */}
        {!loading && !error && filteredAndSortedApplications.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAndSortedApplications.map((app) => (
              <div
                key={app.id}
                className="bg-white shadow-md rounded-lg p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-200"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      {app.jobTitle}
                    </h3>
                    <p className="text-gray-600 font-medium">{app.company}</p>
                    {app.location && (
                      <p className="text-gray-500 text-sm">{app.location}</p>
                    )}
                  </div>
                  <div className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusInfo(app.status).color}`}>
                    {getStatusInfo(app.status).label}
                  </div>
                </div>

                {/* Notes Preview */}
                {app.notes && (
                  <div className="mb-4">
                    <p className="text-gray-700 text-sm">
                      {truncateText(app.notes)}
                    </p>
                  </div>
                )}

                {/* Footer */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <div className="text-xs text-gray-500">
                    <div>Added {formatDate(app.createdAt)}</div>
                    {app.updatedAt && app.updatedAt !== app.createdAt && (
                      <div>Updated {formatDate(app.updatedAt)}</div>
                    )}
                  </div>
                  {app.jobLink && (
                    <a
                      href={app.jobLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
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