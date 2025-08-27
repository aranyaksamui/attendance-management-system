# Overview

This is a full-stack attendance management system built for educational institutions. The application allows teachers to mark student attendance and students to view their attendance records. It features role-based authentication with separate dashboards for teachers and students, comprehensive attendance tracking with filtering capabilities, and a modern, responsive user interface.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript for type safety and developer experience
- **Routing**: Wouter for lightweight client-side routing with role-based route protection
- **State Management**: TanStack Query for server state management and caching
- **UI Framework**: Radix UI components with shadcn/ui for consistent, accessible design system
- **Styling**: Tailwind CSS with CSS variables for theming and responsive design
- **Form Handling**: React Hook Form with Zod validation for type-safe form management
- **Build Tool**: Vite for fast development and optimized production builds

## Backend Architecture
- **Runtime**: Node.js with Express.js server framework
- **Language**: TypeScript for end-to-end type safety
- **API Design**: RESTful API with role-based endpoints
- **Authentication**: Session-based authentication with bcrypt password hashing
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL with Neon serverless hosting
- **Development**: Hot module replacement with Vite integration

## Database Design
- **Users Table**: Central authentication with role field (teacher/student)
- **Students/Teachers Tables**: Role-specific data linked to users
- **Batches/Semesters/Subjects**: Academic structure for organizing students and courses
- **Attendance Table**: Core attendance records with date, status, and relationships
- **Schema Sharing**: Common schema definitions between client and server

## Authentication & Authorization
- **Role-Based Access**: Separate authentication flows for teachers and students
- **Protected Routes**: Client-side route guards based on user roles
- **Session Management**: Server-side session handling with secure credentials
- **Password Security**: Bcrypt hashing for secure password storage

## Key Features
- **Teacher Dashboard**: Student management, attendance marking, batch/semester filtering
- **Student Dashboard**: Personal attendance viewing with subject and date filtering
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Real-time Updates**: Optimistic updates with server synchronization
- **Data Validation**: Zod schemas for consistent validation across client and server

# External Dependencies

## Database & Hosting
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Drizzle Kit**: Database migration and schema management tools

## UI & Styling
- **Radix UI**: Headless component library for accessibility and customization
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Lucide React**: Icon library for consistent iconography

## Development Tools
- **TypeScript**: Static typing across the entire application stack
- **Vite**: Build tool with development server and production optimization
- **ESBuild**: Fast bundling for server-side production builds

## Authentication & Security
- **bcrypt**: Password hashing library for secure authentication
- **express-session**: Session management middleware
- **connect-pg-simple**: PostgreSQL session store for persistence

## Data Management
- **TanStack Query**: Server state management with caching and synchronization
- **React Hook Form**: Form state management with performance optimization
- **Zod**: Schema validation library for type-safe data handling