# InSocialWise - Social Media Management Platform

## Overview
InSocialWise is a comprehensive full-stack social media management application designed to streamline the management and analysis of social media presence across platforms like Facebook and LinkedIn from a single dashboard. Its core purpose is to enable users to connect multiple social accounts, create, schedule, and publish posts, monitor analytics, manage inbox messages in real-time, and track advertising campaigns. The platform aims to provide a consolidated view of all social media activities, enhancing efficiency for businesses and individuals managing their online presence.

## User Preferences
I prefer detailed explanations.
Do not make changes to the folder `Z`.
Do not make changes to the file `Y`.

## System Architecture

### High-Level Architecture
The system employs a client-server architecture. The frontend, a React Single Page Application (SPA) on Port 5000, handles user interaction, authentication UI, dashboard, post management, and real-time inbox features via WebSocket. The backend, a Node.js/Express server on Port 3001, provides RESTful APIs for authentication, account connection, post management, analytics, and advertising campaigns. It also hosts a Socket.io server for real-time communication and utilizes cron jobs for scheduled tasks. Data is persisted in a remote MySQL database managed by Sequelize ORM. The system integrates with external APIs such as Facebook Graph API and LinkedIn API.

### UI/UX Decisions
The frontend is built with React 18.3.1, utilizing React Bootstrap and custom components for UI. React Router DOM v7 manages navigation, and React Context API handles global state. Data visualization is powered by ApexCharts and React Big Calendar.

### Technical Implementations
- **Authentication**: JWT-based authentication with email verification and password reset.
- **Social Media Integration**: OAuth-based connection for Facebook and LinkedIn, supporting multiple accounts and page management. Long-lived tokens are exchanged for secure, extended access.
- **Post Management**: Features include multi-platform posting (Facebook, LinkedIn), media uploads (images/videos), scheduling, and draft management. Posts can be in Draft, Published, or Scheduled states.
- **Analytics & Insights**: Tracks metrics such as page followers, post engagement, impressions, reach, and demographics sourced from Facebook Graph API. Data is updated via periodic cron jobs.
- **Inbox & Messaging**: Real-time communication powered by Socket.io, enabling conversation management and message exchange with connected pages. Messages are stored in the database and broadcast instantly.
- **Advertising Campaigns**: Supports viewing and managing ad accounts, campaigns, ad sets, and creatives, providing insights into campaign performance.
- **Activity Logging**: Comprehensive logging of user actions (login, post creation, account connections) for audit trails.

### System Design Choices
- **Frontend**: React 18.3.1, React Router DOM v7, React Context API, Socket.io-client, React Bootstrap, ApexCharts.
- **Backend**: Node.js, Express v4.21.1, Sequelize v6.37.5, MySQL2, jsonwebtoken v9.0.2, bcryptjs v2.4.3, Socket.io v4.8.1, Multer v1.4.5-lts.1, Nodemailer v6.9.16, node-cron v3.0.3.
- **Database**: Remote MySQL Server, accessed via Sequelize ORM. All developers share a single database instance, requiring careful coordination for schema changes.
- **Security**: JWT tokens, Bcrypt password hashing, token encryption for sensitive social media tokens, CORS, environment variable separation, SQL injection protection via Sequelize, and file upload validation.
- **Performance**: Axios retry, connection pooling for MySQL, Socket.io room-based messaging, and cron jobs for background tasks.

## External Dependencies
- **Facebook Graph API (v22.0)**: Used for social media account connection, post publishing, analytics retrieval, and inbox messaging.
- **LinkedIn API**: Configured for social media account connection, with limited functionality currently implemented.
- **Nodemailer (via Hostinger SMTP)**: Used for sending email notifications, specifically for user registration and password resets.
- **N8N Webhooks**: Utilized for handling comments and hashtags (if configured).