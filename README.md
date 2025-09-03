# GradTrack - Job Application Tracker

A comprehensive job application tracking system designed for graduates to organize their job search process.

## Project Requirements Document (PRD)

### **Problem Statement**
Recent graduates struggle to organize their job applications across multiple companies, leading to missed follow-ups, duplicate applications, and poor tracking of networking contacts.

### **Solution Overview**
GradTrack is a web application that helps users track job applications, manage multiple resume versions, and maintain a database of hiring managers and recruiters.

### **Target Audience**
* Recent graduates actively job searching
* Career changers managing multiple applications
* Students preparing for internship applications

### **Tech Stack**
* **Frontend**: Next.js (React-based)
* **Backend**: Firebase (Firestore + Authentication)
* **Styling**: Tailwind CSS
* **Deployment**: Replit

### **Key Features**

#### **Milestone 1: Core Application Tracking**
* Application Status Categories (To Apply, Applied, Interviewing, Offer, Rejected)
* Application Details Form (job title, company, location, job link, notes)
* Filtering & Sorting by company, date, and status

#### **Milestone 2: Resume Management**
* Resume Uploads (multiple versions)
* Tag applications with the resume used
* Resume success rate tracking

#### **Milestone 3: Networking Assistance**
* Hiring Manager Database (name, role, email, LinkedIn)
* Link managers to specific applications
* Networking reminders and follow-ups

### **Data Model**

#### **User**
* userId, name, email, resumes[], applications[]

#### **Application**
* applicationId, userId, jobTitle, company, location, jobLink, status, resumeId, hiringManagerId, notes, createdAt

#### **Resume**
* resumeId, userId, resumeName, fileUrl, uploadedAt

#### **Hiring Manager**
* hiringManagerId, userId, name, role, email, linkedIn, company, applications[]

### **User Stories**
* As a user, I want to **add a job application** so I can track it later
* As a user, I want to **categorize applications by status**
* As a user, I want to **upload multiple resumes** and tag them to applications
* As a user, I want to **store recruiter details**
* As a user, I want to **see my progress visually**
* As a user, I want to **sign in securely with Google**

### **Non-functional Requirements**
* **Performance**: Load in under 2s
* **Security**: Authentication required for personal data
* **Mobile responsiveness**: Works on both desktop and phone
* **Scalability**: Handle 1,000+ applications per user

### **Getting Started**

1. Clone this repository
2. Install dependencies: `npm install`
3. Set up Firebase configuration in Replit Secrets
4. Run the development server: `npm run dev`

### **Firebase Setup**
Required environment variables in Replit Secrets:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

### **Contributing**
This project follows standard Git workflow. Create feature branches and submit pull requests for review.

### **License**
MIT License - See LICENSE file for details.