# Overview

GradTrack is a comprehensive job application tracking system designed for recent graduates to organize their job search process. The application provides a focused solution for managing job applications, resume versions, and networking contacts, competing with existing tools like Teal and Trac through simplicity and focused functionality.

The system now features a comprehensive multi-view dashboard with Kanban board functionality, following industry standards from platforms like Huntr and Teal. The main dashboard includes view switching between Board, List, Map, and Analytics views, with the Kanban board implementing a professional status pipeline.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: Next.js 15.2.3 with React 19 using the Pages Router pattern
- **UI Components**: React functional components with TypeScript interfaces
- **Styling**: Tailwind CSS 4.1.12 with utility-first approach and custom component styling
- **State Management**: React hooks (useState, useEffect) for local component state
- **Real-time Updates**: Firebase onSnapshot listeners for live data synchronization

## Backend Architecture
- **Database**: Firebase Firestore NoSQL database for document-based data storage
- **Authentication**: Firebase Auth (configured but not yet implemented)
- **API Layer**: Next.js API routes with built-in rate limiting middleware
- **Rate Limiting**: Custom implementation using in-memory Map for request throttling (100 requests per minute default)

## Data Model Design
The application uses a simple document-based structure:
- **Applications Collection**: Stores job application records with fields for job details, status tracking, timestamps, and notes
- **Users Collection**: Planned for user authentication and profile management
- **Resumes Collection**: Planned for multiple resume version management

## Component Architecture
- **Multi-View Dashboard**: Implements industry-standard view switching (Board/List/Map/Analytics) with ViewSwitcher component
- **Kanban Board**: Professional pipeline visualization with KanbanBoard component following Huntr/Teal patterns
- **Networking System**: Comprehensive contact management with AddHiringManagerForm and HiringManagerCard components
- **Contact Database**: HiringManager collection with relationship tracking and follow-up scheduling
- **Modal-based Forms**: ApplicationForm component implements overlay modal pattern for data entry
- **Real-time Dashboard**: Main dashboard uses Firebase listeners for live data updates
- **Filtering System**: Client-side filtering and sorting with search, status, and date-based filters
- **Status Management**: Industry-standard 6-stage pipeline (Saved → Applied → Phone Screen → Interview → Offer → Rejected) with color-coded columns

# External Dependencies

## Core Framework Dependencies
- **Next.js**: React-based framework for server-side rendering and routing
- **React**: UI library for component-based architecture
- **TypeScript**: Type safety and development tooling

## Styling and UI
- **Tailwind CSS**: Utility-first CSS framework with PostCSS integration
- **Autoprefixer**: CSS vendor prefix automation

## Backend Services
- **Firebase**: Complete backend-as-a-service solution
  - Firestore: NoSQL database for application data
  - Authentication: User management and auth flows
  - Hosting: Deployment and static file serving

## Development Tools
- **ESLint**: Code linting with Next.js core web vitals configuration
- **PostCSS**: CSS processing pipeline for Tailwind integration

## Deployment Platform
- **Replit**: Cloud-based development and deployment environment with custom domain configuration and environment variable management for Firebase credentials

## Configuration Notes
- Firebase configuration uses environment variables for security
- Rate limiting implemented for API protection
- PostCSS configured for Tailwind CSS processing
- TypeScript strict mode disabled for development flexibility