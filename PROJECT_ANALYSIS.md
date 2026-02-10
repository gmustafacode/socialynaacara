# PROJECT_ANALYSIS.md

## STEP 1: Technology Stack Inventory

### Detected Technologies
- **Programming Language**: TypeScript (v5+)
- **Frontend Framework**: Next.js (v16.1.6) - *App Router architecture*
- **Base UI Libraries**: React (v19.2.3), Lucide React
- **Styling**: Tailwind CSS (v4), Radix UI (Headless components), Lucide Icons
- **Database**: PostgreSQL (hosted on Supabase)
- **ORM**: Prisma (v5.22.0)
- **Authentication**: NextAuth.js (v4.24), bcryptjs
- **Background Jobs / Queues**: Inngest (v3.51.0)
- **Email Services**: Resend (v6.9.1), Nodemailer (v7.0.13)
- **HTTP/API Client**: Axios (v1.13.4)
- **State & Notifications**: Sonner (v2.0.7)
- **Encryption**: Node.js `crypto` (AES-256-CBC)
- **Environment Configuration**: `dotenv-cli`

---

### Technology Explanations

#### Next.js (v16.1.6)
- **What it is**: A React framework for building full-stack web applications.
- **Where it is used**: The entire frontend and API layer (`/app` directory) is built using Next.js.
- **Role**: Provides the foundation for the application, including routing (App Router), server components, and API routes.
- **Interactions**: Serves as the orchestrator, connecting the UI (React) with the backend logic (Prisma, Inngest, Auth).

#### TypeScript
- **What it is**: A syntactical superset of JavaScript that adds static typing.
- **Where it is used**: Throughout the entire project (`.ts`, `.tsx` files).
- **Role**: Ensures type safety and improves developer productivity by catching errors at compile-time.
- **Interactions**: Defines interfaces for models, API responses, and function signatures across the stack.

#### Prisma
- **What it is**: A modern ORM (Object-Relational Mapper) for Node.js and TypeScript.
- **Where it is used**: Database schema defined in `prisma/schema.prisma` and queried in `lib/db.ts`.
- **Role**: Manages database schema migrations and provides a type-safe client for interacting with the PostgreSQL database.
- **Interactions**: Connects the Next.js API routes and Inngest jobs to the Supabase database.

#### Supabase (PostgreSQL)
- **What it is**: An open-source Firebase alternative providing a managed PostgreSQL database.
- **Where it is used**: Defined in `.env` via `DATABASE_URL` and `DIRECT_URL`.
- **Role**: Acts as the primary persistent data store for users, accounts, posts, and configurations.
- **Interactions**: Communicates with Prisma to store and retrieve application data.

#### Inngest
- **What it is**: An event-driven durable execution engine for background jobs.
- **Where it is used**: Defined in `lib/inngest/` and triggered via `/api/inngest`.
- **Role**: Handles long-running or delayed tasks, such as scheduling and publishing LinkedIn posts.
- **Interactions**: Triggers business logic in `lib/linkedin-posting-service.ts` based on events sent from the Next.js app.

#### NextAuth.js
- **What it is**: A complete open-source authentication solution for Next.js.
- **Where it is used**: Configured in `lib/auth.ts` and `/app/api/auth/[...nextauth]`.
- **Role**: Manages user login, registration (via Credentials provider), and sessions.
- **Interactions**: Works with Prisma to persist user data and sessions in the database.

#### Resend & Nodemailer
- **What it is**: Email delivery services and libraries.
- **Where it is used**: `lib/mail.ts`.
- **Role**: Sends transactional emails, such as verification tokens and system alerts.
- **Interactions**: Triggered by authentication flows or system events to communicate with users.

#### Tailwind CSS (v4)
- **What it is**: A utility-first CSS framework.
- **Where it is used**: Styles defined across all components in `/components` and `/app`.
- **Role**: Provides a modern, responsive design system.
- **Interactions**: Styles the React components to create a "premium" aesthetic.

---

## STEP 2: High-Level Project Explanation

**Socialyncara** is a next-generation AI-powered social media command center designed to architect, manage, and automate a professional social presence. Its primary focus is on LinkedIn, though the architecture is built to support multiple platforms (X, YouTube, Instagram, etc.). The project solves the problem of manual content management and the lack of robust scheduling tools for multi-platform distribution.

### Overall Architecture
The project follows a modern full-stack architecture using the **Next.js App Router**. It is divided into three main layers:
1.  **Presentational Layer**: A high-end React frontend styled with Tailwind CSS, featuring a dashboard for overseeing social accounts, content queues, and AI logs.
2.  **API & Logic Layer**: A series of Next.js Server Actions and Route Handlers that handle authentication, social platform connections, and manual post creation. This layer uses specialized services (e.g., `LinkedInPostingService`) to interact with third-party APIs.
3.  **Durable Execution Layer**: Powered by **Inngest**, this layer manages background jobs, retries, and scheduled executions (like waiting until a specific time to publish a post).

### Data Flow
The system's data flow is primarily event-driven and secure:
- **Authentication**: Users sign up via traditional email/password (secured by `bcryptjs`) or link OAuth accounts for social platforms.
- **Credential Storage**: Sensitive tokens (Access Tokens, Client Secrets) are encrypted using **AES-256-CBC** before being stored in the database, ensuring that even if the database is compromised, the credentials remain secure.
- **Content Ingestion**: Content is queued into the `ContentQueue` (manually or via AI).
- **Posting Workflow**: When a post is scheduled or published, an event is sent to **Inngest**. Inngest then triggers a background function that:
    1.  Decrypts the necessary social account credentials.
    2.  Validates the tokens (refreshing them if necessary).
    3.  Builds the platform-specific payload (Text, Image, Video, or Group post).
    4.  Calls the external API (e.g., LinkedIn's REST API).
    5.  Updates the database with the result (URN/ID if successful, Error Message if failed).

### Security and Constraints
The project implements a strict **Platform Guard** system, enforcing a "One Account Per Platform" rule to prevent duplicate connections. It also uses a "Direct URL" and "Transaction URL" strategy for Prisma to handle connection pooling efficiently on Supabase.

---

## STEP 3: Deep-Dive Technical Analysis

### 1. Folder & File Structure

#### Root Directory
- `app/`: Contains the Next.js routes, layouts, and API endpoints.
- `components/`: Reusable UI components (Buttons, Cards, Modals).
- `lib/`: Core business logic, services, and utility functions.
- `prisma/`: Database schema definitions and migrations.
- `public/`: Static assets (images, icons).
- `automation-worker.ts`: A specialized script for background automation logic.

#### Key Files in `lib/`
- `encryption.ts`: Implements AES-256-CBC encryption/decryption for sensitive tokens.
- `auth.ts`: NextAuth configuration and helper functions.
- `db.ts`: Singleton Prisma client instance.
- `linkedin-posting-service.ts`: The "heavy lifter" containing complex logic for creating LinkedIn media posts and group shares.
- `platform-guard.ts`: Enforces business rules regarding account connections.
- `mail.ts`: Logic for sending emails via Resend.

---

### 2. Routes / Endpoints

#### User Facing Routes
- `/`: Landing page with hero section and feature highlights.
- `/dashboard`: Main overview of accounts, queue, and engagement stats.
- `/login` / `/signup`: Authentication entry points.
- `/dashboard/connect`: UI for linkng new social accounts.
- `/linkedin-documentation`: Informational page regarding LinkedIn API requirements.

#### API Endpoints (`/app/api/...`)
- **GET /api/accounts/connect**: Lists all social accounts connected by the current user.
- **POST /api/accounts/connect**: Initiates the connection of a new account (handled by Platform Guard).
- **POST /api/posts**: Creates a new manual post in the system.
- **GET /api/content**: Retrieves the current content queue.
- **POST /api/inngest**: Entry point for Inngest background job triggers.
- **POST /api/oauth/linkedin/callback**: Handles the OAuth2.0 callback from LinkedIn to securely exchange codes for tokens.
- **GET /api/linkedin/groups**: Fetches a user's LinkedIn groups for targeted posting.

---

### 3. Services / Controllers / Business Logic

#### LinkedInPostingService (`lib/linkedin-posting-service.ts`)
This service is the most complex part of the logic. It performs several steps:
1.  **Validation**: Verifies the post exists and the social account is active.
2.  **Authentication**: Decrypts the access token and checks it against `LinkedInTokenValidator`.
3.  **Media Handling**: If the post includes images or video, it coordinates the multi-step LinkedIn upload process (Register Upload -> Upload Binary -> Finalize).
4.  **Distribution**: Sends the final payload to the user's personal feed or specifically selected LinkedIn Groups.
5.  **State Management**: Updates the `LinkedInPost` record with `PUBLISHED` or `FAILED` status.

#### PlatformGuard (`lib/platform-guard.ts`)
- **Purpose**: Enforces the business rule that a user cannot connect two LinkedIn accounts simultaneously.
- **Logic**: Queries the `SocialAccount` table for a unique combination of `userId` and `platform`. If found, it blocks the new connection attempt.




---
### 4. Database & Models (`prisma/schema.prisma`)
#### Core Tables
  **users**: Stores basic profile and credentials.
- **social_accounts**: The heart of the integration layer. Stores `encryptedAccessToken`, `encryptedRefreshToken`, `platformAccountId`, and OAuth metadata.
- **content_queue**: A staging area for content waiting to be refined or posted.
- **linkedin_posts**: Specialized table for LinkedIn content, tracking `postType` (TEXT, IMAGE, VIDEO, GROUP), `visibility`, and `linkedinPostUrn`.
- **scheduled_posts**: Generic table for scheduling tasks across any future platform.
- **ai_logs**: Tracks actions taken by the AI agent (e.g., "Generated LinkedIn post from RSS feed").

#### Relationships
- A `User` has many `SocialAccount`s, `ContentQueue` items, and `LinkedInPost`s.
- `LinkedInPost` and `ScheduledPost` are linked to a specific `SocialAccount` to identify the posting identity.

---

### 5. External Integrations

#### LinkedIn API (OAuth 2.0 & REST)
- **Flow**: Uses the standard Authorization Code Flow.
- **Scopes**: Request `w_member_social`, `openid`, `profile`, `email`, and `w_sharing` (legacy support).
- **Post Types**: Supports `TEXT`, `IMAGE`, `VIDEO` (via YouTube URL or direct upload), and `GROUP` posting.

#### Inngest Integration
- **Mechanism**: The app sends events like `linkedin/post.publish` to Inngest.
- **Functions**:
    - `publishLinkedInPost`: Executes the posting service logic with automatic retries.
    - `scheduleLinkedInPost`: Handles the "Sleep until" logic for future-dated posts.

#### Resend Integration
- Used for sending verification emails during the signup process, ensuring a secure and verified user base.

---

## FINAL DOCUMENTATION SUMMARY
The **Socialyncara** project is a robust, production-ready system that prioritizes data security (through AES encryption) and reliability (through Inngest's durable execution). It provides a seamless bridge between a user's creative content and the complex requirements of the LinkedIn API.