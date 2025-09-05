import React, { useState } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

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

interface AddHiringManagerFormProps {
  onManagerAdded: () => void;
}

export default function AddHiringManagerForm({ onManagerAdded }: AddHiringManagerFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    email: '',
    linkedinProfile: '',
    company: '',
    notes: '',
    lastContactDate: '',
    nextFollowUpDate: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.company.trim()) {
      alert('Please fill in required fields (Name and Company)');
      return;
    }

    setIsSubmitting(true);

    try {
      const hiringManagerData = {
        name: formData.name.trim(),
        role: formData.role.trim(),
        email: formData.email.trim() || null,
        linkedinProfile: formData.linkedinProfile.trim() || null,
        company: formData.company.trim(),
        notes: formData.notes.trim() || null,
        lastContactDate: formData.lastContactDate ? new Date(formData.lastContactDate) : null,
        nextFollowUpDate: formData.nextFollowUpDate ? new Date(formData.nextFollowUpDate) : null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'hiringManagers'), hiringManagerData);
      
      // Reset form
      setFormData({
        name: '',
        role: '',
        email: '',
        linkedinProfile: '',
        company: '',
        notes: '',
        lastContactDate: '',
        nextFollowUpDate: ''
      });
      
      setIsOpen(false);
      onManagerAdded();
    } catch (error) {
      console.error('Error adding hiring manager:', error);
      alert('Failed to add hiring manager. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      role: '',
      email: '',
      linkedinProfile: '',
      company: '',
      notes: '',
      lastContactDate: '',
      nextFollowUpDate: ''
    });
    setIsOpen(false);
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="btn-primary px-6 py-3 font-semibold flex items-center gap-2"
      >
        <span className="text-lg">👤</span>
        Add Contact
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-xl">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Add New Contact</h2>
                  <p className="text-blue-100 mt-1">Build your professional network</p>
                </div>
                <button
                  onClick={resetForm}
                  className="text-blue-100 hover:text-white text-2xl font-bold leading-none"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold mb-3 text-slate-900">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="input-modern w-full px-4 py-3 text-lg focus-ring"
                    placeholder="e.g., Sarah Johnson"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="role" className="block text-sm font-semibold mb-3 text-slate-900">
                    Job Title
                  </label>
                  <input
                    type="text"
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="input-modern w-full px-4 py-3 text-lg focus-ring"
                    placeholder="e.g., Senior Software Engineer"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-semibold mb-3 text-slate-900">
                  Company <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  className="input-modern w-full px-4 py-3 text-lg focus-ring"
                  placeholder="e.g., Google"
                  required
                />
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold mb-3 text-slate-900">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="input-modern w-full px-4 py-3 text-lg focus-ring"
                    placeholder="sarah.johnson@company.com"
                  />
                </div>

                <div>
                  <label htmlFor="linkedinProfile" className="block text-sm font-semibold mb-3 text-slate-900">
                    LinkedIn Profile
                  </label>
                  <input
                    type="url"
                    id="linkedinProfile"
                    name="linkedinProfile"
                    value={formData.linkedinProfile}
                    onChange={handleInputChange}
                    className="input-modern w-full px-4 py-3 text-lg focus-ring"
                    placeholder="https://linkedin.com/in/sarah-johnson"
                  />
                </div>
              </div>

              {/* Follow-up Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="lastContactDate" className="block text-sm font-semibold mb-3 text-slate-900">
                    Last Contact Date
                  </label>
                  <input
                    type="date"
                    id="lastContactDate"
                    name="lastContactDate"
                    value={formData.lastContactDate}
                    onChange={handleInputChange}
                    className="input-modern w-full px-4 py-3 text-lg focus-ring"
                  />
                </div>

                <div>
                  <label htmlFor="nextFollowUpDate" className="block text-sm font-semibold mb-3 text-slate-900">
                    Next Follow-up Date
                  </label>
                  <input
                    type="date"
                    id="nextFollowUpDate"
                    name="nextFollowUpDate"
                    value={formData.nextFollowUpDate}
                    onChange={handleInputChange}
                    className="input-modern w-full px-4 py-3 text-lg focus-ring"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-semibold mb-3 text-slate-900">
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={4}
                  className="input-modern w-full px-4 py-3 text-lg focus-ring resize-none"
                  placeholder="Add notes about this contact, previous conversations, mutual connections, etc."
                />
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-4 pt-6 border-t border-slate-200">
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn-secondary px-6 py-3 font-semibold"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary px-6 py-3 font-semibold flex items-center gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <span>💾</span>
                      Add Contact
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