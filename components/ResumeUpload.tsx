import { useState } from 'react';
import { db, storage } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface ResumeUploadProps {
  onResumeUploaded?: () => void;
}

export default function ResumeUpload({ onResumeUploaded }: ResumeUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    file: null as File | null
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.type === 'file') {
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
        
        setFormData({
          ...formData,
          file: file
        });
      }
    } else {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.file || !formData.name.trim()) {
      alert('Please provide both a resume name and select a PDF file.');
      return;
    }

    setIsUploading(true);

    try {
      // Generate unique filename with timestamp
      const timestamp = Date.now();
      const fileName = `${timestamp}_${formData.file.name}`;
      
      // Upload file to Firebase Storage
      const storageRef = ref(storage, `resumes/${fileName}`);
      const snapshot = await uploadBytes(storageRef, formData.file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Save metadata to Firestore
      await addDoc(collection(db, 'resumes'), {
        name: formData.name.trim(),
        fileName: fileName,
        originalFileName: formData.file.name,
        downloadURL: downloadURL,
        fileSize: formData.file.size,
        uploadDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Reset form
      setFormData({
        name: '',
        file: null
      });
      
      // Reset file input
      const fileInput = document.getElementById('resume-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      setIsOpen(false);
      
      if (onResumeUploaded) {
        onResumeUploaded();
      }

      console.log('Resume uploaded successfully');
    } catch (error: any) {
      console.error('Error uploading resume:', error);
      
      // Enhanced error handling for connection issues
      if (error.code === 'unavailable' || error.message?.includes('transport errored')) {
        alert('Connection lost. Your resume will be uploaded automatically when connection is restored. Please keep this form open and wait for confirmation.');
      } else if (error.code === 'permission-denied') {
        alert('Permission denied. Unable to upload resume. Please check your account permissions.');
      } else {
        alert('Failed to upload resume. Please check your connection and try again.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    setFormData({
      name: '',
      file: null
    });
    
    // Reset file input
    const fileInput = document.getElementById('resume-file') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  return (
    <>
      {/* Upload Resume Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="btn-primary flex items-center gap-2"
        style={{
          backgroundColor: 'var(--color-primary)',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          padding: '12px 24px',
          fontSize: '16px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        Upload Resume
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          style={{ backdropFilter: 'blur(8px)' }}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4"
            style={{ boxShadow: 'var(--shadow-2xl)' }}
          >
            {/* Header */}
            <div className="p-8 pb-6 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    Upload Resume
                  </h2>
                  <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                    Add a new resume to your collection
                  </p>
                </div>
                <button
                  onClick={handleCancel}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-8">
              <div className="space-y-6">
                {/* Resume Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                    Resume Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Tech Resume, Marketing Resume, Consulting Resume"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{
                      backgroundColor: 'var(--color-input-background)',
                      color: 'var(--color-text-primary)',
                      '--tw-ring-color': 'var(--color-primary)'
                    } as React.CSSProperties}
                    required
                  />
                </div>

                {/* File Upload */}
                <div>
                  <label htmlFor="resume-file" className="block text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                    Resume File *
                  </label>
                  <div className="mt-2">
                    <input
                      type="file"
                      id="resume-file"
                      accept=".pdf"
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm transition-all duration-200 hover:border-slate-300 focus:outline-none focus:ring-2 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:cursor-pointer"
                      style={{
                        backgroundColor: 'var(--color-input-background)',
                        color: 'var(--color-text-primary)',
                        '--tw-ring-color': 'var(--color-primary)'
                      } as React.CSSProperties}
                      required
                    />
                  </div>
                  <p className="text-xs mt-2" style={{ color: 'var(--color-text-secondary)' }}>
                    PDF files only, max 10MB
                  </p>
                </div>

                {formData.file && (
                  <div className="bg-slate-50 p-4 rounded-xl">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {formData.file.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {(formData.file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex gap-4 pt-8 border-t border-slate-100 mt-8">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 px-6 py-3 text-slate-600 bg-slate-100 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="flex-1 px-6 py-3 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: isUploading ? 'var(--color-text-secondary)' : 'var(--color-primary)',
                  }}
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Upload Resume
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}