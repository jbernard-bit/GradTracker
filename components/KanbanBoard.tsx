import React from 'react';

interface Application {
  id: string;
  jobTitle: string;
  company: string;
  location?: string;
  jobLink?: string;
  status: 'saved' | 'applied' | 'phone-screen' | 'interview' | 'offer' | 'rejected';
  notes?: string;
  resumeId?: string;
  createdAt: any;
  updatedAt: any;
}

interface KanbanBoardProps {
  applications: Application[];
  onApplicationEdit: (application: Application) => void;
  onApplicationDelete: (application: Application) => void;
  getResumeName: (resumeId: string) => string;
}

interface KanbanColumn {
  id: string;
  title: string;
  status: Application['status'];
  bgColor: string;
  textColor: string;
  dotColor: string;
}

export default function KanbanBoard({ 
  applications, 
  onApplicationEdit, 
  onApplicationDelete, 
  getResumeName 
}: KanbanBoardProps) {
  
  const columns: KanbanColumn[] = [
    { id: 'saved', title: 'Saved', status: 'saved', bgColor: 'bg-slate-50', textColor: 'text-slate-700', dotColor: 'bg-slate-400' },
    { id: 'applied', title: 'Applied', status: 'applied', bgColor: 'bg-blue-50', textColor: 'text-blue-700', dotColor: 'bg-blue-500' },
    { id: 'phone-screen', title: 'Phone Screen', status: 'phone-screen', bgColor: 'bg-purple-50', textColor: 'text-purple-700', dotColor: 'bg-purple-500' },
    { id: 'interview', title: 'Interview', status: 'interview', bgColor: 'bg-amber-50', textColor: 'text-amber-700', dotColor: 'bg-amber-500' },
    { id: 'offer', title: 'Offer', status: 'offer', bgColor: 'bg-emerald-50', textColor: 'text-emerald-700', dotColor: 'bg-emerald-500' },
    { id: 'rejected', title: 'Rejected', status: 'rejected', bgColor: 'bg-red-50', textColor: 'text-red-700', dotColor: 'bg-red-500' }
  ];

  const getApplicationsForStatus = (status: Application['status']) => {
    return applications.filter(app => app.status === status);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex gap-6 overflow-x-auto pb-6">
      {columns.map((column) => {
        const columnApplications = getApplicationsForStatus(column.status);
        
        return (
          <div key={column.id} className="flex-shrink-0 w-80">
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${column.dotColor}`}></div>
                <h3 className="font-semibold text-slate-900">{column.title}</h3>
                <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-full">
                  {columnApplications.length}
                </span>
              </div>
            </div>

            {/* Column Content */}
            <div className={`${column.bgColor} rounded-lg p-3 min-h-[500px] space-y-3`}>
              {columnApplications.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <div className="text-3xl mb-2">💼</div>
                  <p className="text-sm">No applications</p>
                </div>
              ) : (
                columnApplications.map((app) => (
                  <div
                    key={app.id}
                    className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow cursor-pointer group"
                  >
                    {/* Application Header */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 pr-2">
                        <h4 className="font-semibold text-slate-900 text-sm leading-tight">
                          {app.jobTitle}
                        </h4>
                        <p className="text-blue-600 font-medium text-sm mt-1">
                          {app.company}
                        </p>
                        {app.location && (
                          <p className="text-slate-500 text-xs mt-1 flex items-center">
                            <span className="mr-1">📍</span>
                            {app.location}
                          </p>
                        )}
                      </div>
                      
                      {/* Action Menu */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex space-x-1">
                          <button
                            onClick={() => onApplicationEdit(app)}
                            className="text-slate-400 hover:text-blue-600 p-1"
                            title="Edit application"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => onApplicationDelete(app)}
                            className="text-slate-400 hover:text-red-600 p-1"
                            title="Delete application"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Resume Badge */}
                    {app.resumeId && getResumeName(app.resumeId) && (
                      <div className="mb-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                          </svg>
                          {getResumeName(app.resumeId)}
                        </span>
                      </div>
                    )}

                    {/* Notes Preview */}
                    {app.notes && (
                      <div className="mb-3">
                        <p className="text-slate-600 text-xs leading-relaxed line-clamp-2">
                          {app.notes}
                        </p>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex justify-between items-center text-xs text-slate-500 mt-3">
                      <span>Applied {formatDate(app.createdAt)}</span>
                      {app.jobLink && (
                        <a
                          href={app.jobLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-700"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View Job
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}