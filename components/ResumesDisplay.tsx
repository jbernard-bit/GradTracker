import { useState, useEffect } from 'react';
import { db, storage } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

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
  applications?: Array<{id: string; resumeId?: string}>; // For usage count
}

export default function ResumesDisplay({ refreshTrigger, applications = [] }: ResumesDisplayProps) {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingResumeId, setEditingResumeId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [replacingResumeId, setReplacingResumeId] = useState<string | null>(null);
  const [replacingFile, setReplacingFile] = useState<File | null>(null);
  const [isReplacing, setIsReplacing] = useState(false);
  const [deletingResumeId, setDeletingResumeId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // Calculate usage count for a resume
  const getUsageCount = (resumeId: string): number => {
    return applications.filter(app => app.resumeId === resumeId).length;
  };

  // Start editing resume name
  const handleStartEdit = (resume: Resume) => {
    setEditingResumeId(resume.id);
    setEditingName(resume.name);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingResumeId(null);
    setEditingName('');
  };

  // Save edited name with database update
  const handleSaveEdit = async () => {
    if (!editingResumeId || !editingName.trim()) return;
    
    try {
      // Update resume name in Firestore
      await updateDoc(doc(db, 'resumes', editingResumeId), {
        name: editingName.trim(),
        updatedAt: new Date()
      });
      
      console.log('Resume name updated successfully');
      setEditingResumeId(null);
      setEditingName('');
    } catch (error: any) {
      console.error('Error updating resume name:', error);
      
      // Enhanced error handling for connection issues
      if (error.code === 'unavailable' || error.message?.includes('transport errored')) {
        alert('Connection lost. Your resume name will be updated when connection is restored. Please keep the page open.');
      } else if (error.code === 'permission-denied') {
        alert('Permission denied. Unable to rename resume.');
      } else {
        alert('Failed to rename resume. Please check your connection and try again.');
      }
    }
  };

  // Handle replace resume file
  const handleReplace = (resumeId: string) => {
    setReplacingResumeId(resumeId);
  };

  const handleReplaceFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type (PDF only)
      if (file.type !== 'application/pdf') {
        alert('Please select a PDF file only.');
        e.target.value = '';
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB.');
        e.target.value = '';
        return;
      }
      
      setReplacingFile(file);
    }
  };

  const handleConfirmReplace = async () => {
    if (!replacingResumeId || !replacingFile) return;
    
    const resumeToReplace = resumes.find(r => r.id === replacingResumeId);
    if (!resumeToReplace) return;

    setIsReplacing(true);

    try {
      // Generate unique filename with timestamp
      const timestamp = Date.now();
      const fileName = `${timestamp}_${replacingFile.name}`;
      
      // Upload new file to Firebase Storage
      const storageRef = ref(storage, `resumes/${fileName}`);
      const snapshot = await uploadBytes(storageRef, replacingFile);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Update Firestore with new file info (keeping same name and ID)
      await updateDoc(doc(db, 'resumes', replacingResumeId), {
        fileName: fileName,
        originalFileName: replacingFile.name,
        downloadURL: downloadURL,
        fileSize: replacingFile.size,
        updatedAt: new Date()
      });

      // Delete old file from storage
      try {
        await deleteObject(ref(storage, `resumes/${resumeToReplace.fileName}`));
      } catch (deleteError) {
        console.warn('Could not delete old file:', deleteError);
        // Continue anyway - the important part is the new file is uploaded
      }

      console.log('Resume file replaced successfully');
      setReplacingResumeId(null);
      setReplacingFile(null);
    } catch (error: any) {
      console.error('Error replacing resume file:', error);
      
      if (error.code === 'unavailable' || error.message?.includes('transport errored')) {
        alert('Connection lost. Your file will be replaced when connection is restored. Please keep the page open.');
      } else {
        alert('Failed to replace resume file. Please check your connection and try again.');
      }
    } finally {
      setIsReplacing(false);
    }
  };

  // Handle delete resume
  const handleDelete = (resumeId: string) => {
    setDeletingResumeId(resumeId);
  };

  const handleConfirmDelete = async () => {
    if (!deletingResumeId) return;
    
    const resumeToDelete = resumes.find(r => r.id === deletingResumeId);
    if (!resumeToDelete) return;

    setIsDeleting(true);

    try {
      // Delete from Firestore first
      await deleteDoc(doc(db, 'resumes', deletingResumeId));

      // Delete file from storage
      try {
        await deleteObject(ref(storage, `resumes/${resumeToDelete.fileName}`));
      } catch (deleteError) {
        console.warn('Could not delete file from storage:', deleteError);
        // Continue anyway - the important part is the document is deleted
      }

      console.log('Resume deleted successfully');
      setDeletingResumeId(null);
    } catch (error: any) {
      console.error('Error deleting resume:', error);
      
      if (error.code === 'unavailable' || error.message?.includes('transport errored')) {
        alert('Connection lost. Resume will be deleted when connection is restored. Please keep the page open.');
      } else {
        alert('Failed to delete resume. Please check your connection and try again.');
      }
    } finally {
      setIsDeleting(false);
    }
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
    <div>
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
                {editingResumeId === resume.id ? (
                  /* Inline Editing Mode */
                  <div className="flex items-center gap-2 mb-1">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="text-lg font-semibold bg-white border border-blue-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ color: 'var(--color-text-primary)' }}
                      autoFocus
                    />
                    <button
                      onClick={handleSaveEdit}
                      className="text-green-600 hover:text-green-800 p-1"
                      title="Save changes"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Cancel editing"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  /* Normal Display Mode */
                  <h3 className="text-lg font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                    {resume.name}
                  </h3>
                )}
                
                {/* Enhanced Info Row */}
                <div className="flex items-center gap-4 text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  <span>{resume.originalFileName}</span>
                  <span>•</span>
                  <span>{formatFileSize(resume.fileSize)}</span>
                  <span>•</span>
                  <span>Uploaded {formatDate(resume.uploadDate)}</span>
                  {/* Usage Count */}
                  <span>•</span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    getUsageCount(resume.id) > 0 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M16,6L18.29,8.29L13.41,13.17L9.41,9.17L2,16.59L3.41,18L9.41,12L13.41,16L19.71,9.71L22,12V6H16Z" />
                    </svg>
                    {getUsageCount(resume.id)} applications
                  </span>
                </div>
              </div>
            </div>

            {/* Enhanced Action Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Rename Button */}
              <button
                onClick={() => handleStartEdit(resume)}
                className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                title="Rename Resume"
                disabled={editingResumeId !== null}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Rename
              </button>

              {/* Download Button */}
              <button
                onClick={() => handleDownload(resume.downloadURL, resume.originalFileName)}
                className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
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
                className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                title="View Resume"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View
              </button>

              {/* Replace Button */}
              <button
                onClick={() => handleReplace(resume.id)}
                className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-orange-700 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
                title="Replace Resume File"
                disabled={editingResumeId !== null}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Replace
              </button>

              {/* Delete Button */}
              <button
                onClick={() => handleDelete(resume.id)}
                className={`inline-flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  getUsageCount(resume.id) > 0
                    ? 'text-red-400 bg-red-50 cursor-not-allowed opacity-60'
                    : 'text-red-700 bg-red-50 hover:bg-red-100'
                }`}
                title={getUsageCount(resume.id) > 0 
                  ? `Cannot delete - used by ${getUsageCount(resume.id)} application(s)`
                  : 'Delete Resume'
                }
                disabled={getUsageCount(resume.id) > 0 || editingResumeId !== null}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>

    {/* Replace Resume Modal */}
    {replacingResumeId && (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl w-full max-w-md border border-slate-200" style={{ boxShadow: 'var(--shadow-xl)' }}>
          <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-orange-50 to-slate-50">
            <h3 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              Replace Resume File
            </h3>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              Select a new PDF file to replace the current one
            </p>
          </div>

          <div className="px-6 py-4">
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                Select New PDF File
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={handleReplaceFileSelect}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {replacingFile && (
              <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-orange-800 truncate">{replacingFile.name}</p>
                    <p className="text-xs text-orange-600">{formatFileSize(replacingFile.size)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
            <button
              onClick={() => {
                setReplacingResumeId(null);
                setReplacingFile(null);
              }}
              className="btn-secondary px-4 py-2 text-sm font-medium"
              disabled={isReplacing}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmReplace}
              className="btn-primary px-4 py-2 text-sm font-medium bg-orange-600 hover:bg-orange-700"
              disabled={!replacingFile || isReplacing}
            >
              {isReplacing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Replacing...
                </>
              ) : (
                'Replace File'
              )}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Delete Resume Modal */}
    {deletingResumeId && (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl w-full max-w-md border border-slate-200" style={{ boxShadow: 'var(--shadow-xl)' }}>
          <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-red-50 to-slate-50">
            <h3 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              Delete Resume
            </h3>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              This action cannot be undone
            </p>
          </div>

          <div className="px-6 py-4">
            {(() => {
              const resumeToDelete = resumes.find(r => r.id === deletingResumeId);
              return resumeToDelete ? (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-3">
                      <svg className="w-8 h-8 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-900">{resumeToDelete.name}</h4>
                        <p className="text-sm text-slate-600 truncate">{resumeToDelete.originalFileName}</p>
                        <p className="text-xs text-slate-500">{formatFileSize(resumeToDelete.fileSize)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-red-800">
                        Are you sure you want to delete this resume?
                      </p>
                      <p className="text-xs text-red-700 mt-1">
                        This will permanently remove the file from storage and cannot be recovered.
                      </p>
                    </div>
                  </div>
                </div>
              ) : null;
            })()}
          </div>

          <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
            <button
              onClick={() => setDeletingResumeId(null)}
              className="btn-secondary px-4 py-2 text-sm font-medium"
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Deleting...
                </>
              ) : (
                'Delete Resume'
              )}
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
  );
}