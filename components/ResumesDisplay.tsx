import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

interface Resume {
  id: string;
  name: string;
  fileName: string;
  originalFileName: string;
  downloadURL: string;
  fileSize: number;
  uploadDate: any;
}

interface ResumesDisplayProps {
  refreshTrigger?: number;
}

export default function ResumesDisplay({ refreshTrigger }: ResumesDisplayProps) {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'resumes'), orderBy('uploadDate', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const resumeData: Resume[] = [];
      snapshot.forEach((doc) => {
        resumeData.push({
          id: doc.id,
          ...doc.data()
        } as Resume);
      });
      setResumes(resumeData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching resumes:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [refreshTrigger]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: any): string => {
    if (!date) return '';
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleDownload = (downloadURL: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = downloadURL;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-300 border-t-blue-600"></div>
      </div>
    );
  }

  if (resumes.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="mt-4 text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          No resumes uploaded yet
        </h3>
        <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Upload your first resume to get started with resume management.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {resumes.map((resume) => (
        <div
          key={resume.id}
          className="bg-white p-6 rounded-xl border border-slate-100 hover:border-slate-200 transition-all duration-200"
          style={{ boxShadow: 'var(--shadow-sm)' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* PDF Icon */}
              <div className="flex-shrink-0">
                <svg className="w-10 h-10 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                </svg>
              </div>

              {/* Resume Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                  {resume.name}
                </h3>
                <div className="flex items-center gap-4 text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  <span>{resume.originalFileName}</span>
                  <span>•</span>
                  <span>{formatFileSize(resume.fileSize)}</span>
                  <span>•</span>
                  <span>Uploaded {formatDate(resume.uploadDate)}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Download Button */}
              <button
                onClick={() => handleDownload(resume.downloadURL, resume.originalFileName)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                title="Download Resume"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download
              </button>

              {/* View Button */}
              <button
                onClick={() => window.open(resume.downloadURL, '_blank')}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                title="View Resume"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}