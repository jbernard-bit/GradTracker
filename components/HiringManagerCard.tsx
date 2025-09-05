import React from 'react';

interface HiringManager {
  id: string;
  name: string;
  role: string;
  email?: string;
  linkedinProfile?: string;
  company: string;
  notes?: string;
  lastContactDate?: any;
  nextFollowUpDate?: any;
  createdAt: any;
  updatedAt: any;
}

interface HiringManagerCardProps {
  manager: HiringManager;
  onEdit?: (manager: HiringManager) => void;
  onDelete?: (manager: HiringManager) => void;
}

export default function HiringManagerCard({ manager, onEdit, onDelete }: HiringManagerCardProps) {
  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const isFollowUpDue = () => {
    if (!manager.nextFollowUpDate) return false;
    const today = new Date();
    const followUpDate = manager.nextFollowUpDate.toDate ? 
      manager.nextFollowUpDate.toDate() : 
      new Date(manager.nextFollowUpDate);
    return followUpDate <= today;
  };

  const getDaysUntilFollowUp = () => {
    if (!manager.nextFollowUpDate) return null;
    const today = new Date();
    const followUpDate = manager.nextFollowUpDate.toDate ? 
      manager.nextFollowUpDate.toDate() : 
      new Date(manager.nextFollowUpDate);
    const diffTime = followUpDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const followUpDays = getDaysUntilFollowUp();
  const isOverdue = isFollowUpDue();

  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-slate-900 mb-1">
            {manager.name}
          </h3>
          <p className="text-blue-600 font-semibold text-sm">
            {manager.role}
          </p>
          <p className="text-slate-500 text-sm mt-1">
            {manager.company}
          </p>
        </div>
        
        {/* Follow-up Status Badge */}
        {manager.nextFollowUpDate && (
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            isOverdue 
              ? 'bg-red-100 text-red-700' 
              : followUpDays !== null && followUpDays <= 3
                ? 'bg-amber-100 text-amber-700'
                : 'bg-green-100 text-green-700'
          }`}>
            {isOverdue 
              ? 'Overdue' 
              : followUpDays !== null 
                ? followUpDays === 0 
                  ? 'Today'
                  : followUpDays === 1
                    ? 'Tomorrow'
                    : `${followUpDays} days`
                : 'Scheduled'
            }
          </div>
        )}
      </div>

      {/* Contact Information */}
      <div className="space-y-2 mb-4">
        {manager.email && (
          <div className="flex items-center text-sm text-slate-600">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <a href={`mailto:${manager.email}`} className="hover:text-blue-600 transition-colors">
              {manager.email}
            </a>
          </div>
        )}
        
        {manager.linkedinProfile && (
          <div className="flex items-center text-sm text-slate-600">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            <a 
              href={manager.linkedinProfile} 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-blue-600 transition-colors"
            >
              LinkedIn Profile
            </a>
          </div>
        )}
      </div>

      {/* Notes Preview */}
      {manager.notes && (
        <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
          <p className="text-sm text-slate-700 leading-relaxed">
            {manager.notes.length > 100 
              ? `${manager.notes.substring(0, 100)}...` 
              : manager.notes
            }
          </p>
        </div>
      )}

      {/* Contact History */}
      <div className="space-y-2 mb-4 text-xs text-slate-500">
        {manager.lastContactDate && (
          <div className="flex items-center">
            <span className="mr-1">📅</span>
            Last contact: {formatDate(manager.lastContactDate)}
          </div>
        )}
        {manager.nextFollowUpDate && (
          <div className="flex items-center">
            <span className="mr-1">🔔</span>
            Next follow-up: {formatDate(manager.nextFollowUpDate)}
          </div>
        )}
        <div className="flex items-center">
          <span className="mr-1">➕</span>
          Added: {formatDate(manager.createdAt)}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-4 border-t border-slate-100">
        <div className="flex gap-2">
          {onEdit && (
            <button
              onClick={() => onEdit(manager)}
              className="btn-secondary px-3 py-2 text-sm font-medium flex items-center gap-2 hover:bg-blue-50"
            >
              <span className="text-blue-600">✏️</span>
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(manager)}
              className="btn-secondary px-3 py-2 text-sm font-medium flex items-center gap-2 hover:bg-red-50 text-red-600 border-red-200"
            >
              <span>🗑️</span>
              Delete
            </button>
          )}
        </div>
        
        {/* Quick Actions */}
        <div className="flex gap-2">
          {manager.email && (
            <a
              href={`mailto:${manager.email}`}
              className="btn-primary px-3 py-2 text-sm font-medium flex items-center gap-1"
            >
              📧 Email
            </a>
          )}
          {manager.linkedinProfile && (
            <a
              href={manager.linkedinProfile}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary px-3 py-2 text-sm font-medium flex items-center gap-1"
            >
              💼 LinkedIn
            </a>
          )}
        </div>
      </div>
    </div>
  );
}