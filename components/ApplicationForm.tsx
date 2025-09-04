import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';

interface ApplicationFormProps {
  onApplicationAdded?: () => void;
}

interface Resume {
  id: string;
  name: string;
}

export default function ApplicationForm({ onApplicationAdded }: ApplicationFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [formData, setFormData] = useState({
    jobTitle: '',
    company: '',
    location: '',
    jobLink: '',
    status: 'to-apply',
    notes: '',
    resumeId: ''
  });

  const statusOptions = [
    { value: 'to-apply', label: 'To Apply', bgColor: 'bg-slate-50', textColor: 'text-slate-700', dotColor: 'bg-slate-400' },
    { value: 'applied', label: 'Applied', bgColor: 'bg-blue-50', textColor: 'text-blue-700', dotColor: 'bg-blue-500' },
    { value: 'interviewing', label: 'Interviewing', bgColor: 'bg-amber-50', textColor: 'text-amber-700', dotColor: 'bg-amber-500' },
    { value: 'offer', label: 'Offer', bgColor: 'bg-emerald-50', textColor: 'text-emerald-700', dotColor: 'bg-emerald-500' },
    { value: 'rejected', label: 'Rejected', bgColor: 'bg-red-50', textColor: 'text-red-700', dotColor: 'bg-red-500' }
  ];

  // Fetch resumes on component mount
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await addDoc(collection(db, 'applications'), {
        ...formData,
        resumeId: formData.resumeId || null, // Store null if no resume selected
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Reset form
      setFormData({
        jobTitle: '',
        company: '',
        location: '',
        jobLink: '',
        status: 'to-apply',
        notes: '',
        resumeId: ''
      });

      setIsOpen(false);
      
      if (onApplicationAdded) {
        onApplicationAdded();
      }
    } catch (error) {
      console.error('Error adding application:', error);
      alert('Failed to add application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    setFormData({
      jobTitle: '',
      company: '',
      location: '',
      jobLink: '',
      status: 'to-apply',
      notes: '',
      resumeId: ''
    });
  };

  return (
    <>
      {/* Modern Add Application Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="btn-primary px-8 py-4 text-lg font-semibold flex items-center gap-3 shadow-lg"
        style={{ boxShadow: 'var(--shadow-lg)' }}
      >
        <span className="text-2xl font-light">+</span>
        Add Application
      </button>

      {/* Enhanced Modal Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
          style={{ backdropFilter: 'blur(8px)' }}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200"
            style={{ boxShadow: 'var(--shadow-xl)' }}
          >
            {/* Enhanced Modal Header */}
            <div className="px-8 py-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-slate-50">
              <h2 className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                Add New Application
              </h2>
              <p className="text-lg mt-2" style={{ color: 'var(--color-text-secondary)' }}>
                Track a new job opportunity
              </p>
            </div>

            {/* Enhanced Modal Body */}
            <form onSubmit={handleSubmit} className="px-8 py-8 space-y-8">
              {/* Job Title */}
              <div>
                <label htmlFor="jobTitle" className="block text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                  Job Title *
                </label>
                <input
                  type="text"
                  id="jobTitle"
                  name="jobTitle"
                  value={formData.jobTitle}
                  onChange={handleInputChange}
                  required
                  className="input-modern w-full px-4 py-3 text-lg focus-ring"
                  placeholder="e.g. Frontend Developer"
                />
              </div>

              {/* Company */}
              <div>
                <label htmlFor="company" className="block text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                  Company *
                </label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  required
                  className="input-modern w-full px-4 py-3 text-lg focus-ring"
                  placeholder="e.g. Google"
                />
              </div>

              {/* Location and Job Link Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Location */}
                <div>
                  <label htmlFor="location" className="block text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                    Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="input-modern w-full px-4 py-3 text-lg focus-ring"
                    placeholder="San Francisco, CA / Remote"
                  />
                </div>

                {/* Job Link */}
                <div>
                  <label htmlFor="jobLink" className="block text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                    Job Link
                  </label>
                  <input
                    type="url"
                    id="jobLink"
                    name="jobLink"
                    value={formData.jobLink}
                    onChange={handleInputChange}
                    className="input-modern w-full px-4 py-3 text-lg focus-ring"
                    placeholder="https://..."
                  />
                </div>
              </div>

              {/* Enhanced Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="input-modern w-full px-4 py-3 text-lg focus-ring"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                
                {/* Status Preview */}
                {formData.status && (
                  <div className="mt-3">
                    <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                      Preview:
                    </span>
                    <div className="mt-2">
                      {(() => {
                        const selectedStatus = statusOptions.find(opt => opt.value === formData.status);
                        return selectedStatus ? (
                          <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${selectedStatus.bgColor} ${selectedStatus.textColor} status-badge`}>
                            <div className={`w-2 h-2 rounded-full ${selectedStatus.dotColor} mr-2`}></div>
                            {selectedStatus.label}
                          </span>
                        ) : null;
                      })()}
                    </div>
                  </div>
                )}
              </div>

              {/* Resume Selection */}
              <div>
                <label htmlFor="resumeId" className="block text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                  Resume Used <span className="text-sm font-normal" style={{ color: 'var(--color-text-secondary)' }}>(Optional)</span>
                </label>
                <select
                  id="resumeId"
                  name="resumeId"
                  value={formData.resumeId}
                  onChange={handleInputChange}
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
                {formData.resumeId && (
                  <div className="mt-3">
                    <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                      Selected:
                    </span>
                    <div className="mt-2">
                      {(() => {
                        const selectedResume = resumes.find(resume => resume.id === formData.resumeId);
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
                <label htmlFor="notes" className="block text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={5}
                  className="input-modern w-full px-4 py-3 text-lg focus-ring resize-none"
                  placeholder="Add any additional notes, requirements, or thoughts about this position..."
                />
                <div className="mt-2 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                  {formData.notes.length}/500 characters
                </div>
              </div>

              {/* Enhanced Modal Footer */}
              <div className="flex justify-end gap-4 pt-6 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn-secondary px-6 py-3 text-base font-medium"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.jobTitle.trim() || !formData.company.trim()}
                  className="btn-primary px-8 py-3 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Adding...
                    </span>
                  ) : (
                    'Add Application'
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