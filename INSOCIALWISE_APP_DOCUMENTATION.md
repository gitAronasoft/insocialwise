# InSocialWise - Complete Application Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [User Authentication Flow](#user-authentication-flow)
4. [Social Media Account Connection](#social-media-account-connection)
5. [Post Management System](#post-management-system)
6. [Analytics & Insights](#analytics--insights)
7. [Inbox Messaging System](#inbox-messaging-system)
8. [Advertising Campaign Management](#advertising-campaign-management)
9. [Database Schema](#database-schema)
10. [API Endpoints](#api-endpoints)
11. [File Structure](#file-structure)
12. [Configuration & Environment Variables](#configuration--environment-variables)
13. [Scheduled Tasks & Cron Jobs](#scheduled-tasks--cron-jobs)
14. [Real-time Features (Socket.io)](#real-time-features-socketio)

---

## System Overview

InSocialWise is a full-stack social media management platform that allows users to:
- Connect and manage multiple Facebook and LinkedIn accounts from a single dashboard
- Create, schedule, and publish posts across multiple social media platforms
- Monitor analytics and engagement metrics for connected pages
- Manage inbox conversations in real-time
- Track advertising campaigns and ad performance
- View activity logs for audit trails

**Technology Stack:**
- **Frontend**: React 18.3.1, React Router DOM v7, React Context API, Socket.io-client
- **Backend**: Node.js, Express 4.21.1, Socket.io 4.8.1, Node-cron 3.0.3
- **Database**: Remote MySQL Server (Sequelize ORM 6.37.5)
- **Authentication**: JWT (jsonwebtoken 9.0.2) + Bcrypt
- **File Upload**: Multer 1.4.5-lts.1
- **Email**: Nodemailer 6.9.16 (via Hostinger SMTP)

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      User Browser                            │
│                    (React SPA - Port 5000)                   │
└───────────────┬─────────────────────────────────────────────┘
                │
                │ HTTP Requests (REST APIs)
                │ WebSocket Connection (Socket.io)
                │
┌───────────────▼─────────────────────────────────────────────┐
│              Backend Server (Node.js - Port 3001)            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Express REST API + Socket.io Server                 │   │
│  │  - Authentication Endpoints                          │   │
│  │  - Social Media Integration                          │   │
│  │  - Post Management APIs                              │   │
│  │  - Analytics APIs                                    │   │
│  │  - Inbox Messaging (Socket.io)                       │   │
│  │  - Ads Campaign APIs                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Scheduled Tasks (node-cron)                         │   │
│  │  - Every 2 minutes: Check & publish scheduled posts  │   │
│  │  - Every 2 minutes: Update analytics data            │   │
│  └─────────────────────────────────────────────────────┘   │
└───────────────┬─────────────────────────────────────────────┘
                │
                │ Sequelize ORM (MySQL2)
                │
┌───────────────▼─────────────────────────────────────────────┐
│          Remote MySQL Database (194.163.46.7:3306)          │
│  Tables: users, social_users, social_user_pages, posts,     │
│          analytics, demographics, ads_accounts, campaigns,   │
│          adsets, adsets_ads, ads_creative, inbox_messages,   │
│          inbox_conversations, post_comments, settings        │
└─────────────────────────────────────────────────────────────┘
                │
                │ External API Calls
                │
┌───────────────▼─────────────────────────────────────────────┐
│              External Services                               │
│  - Facebook Graph API (v22.0)                               │
│  - LinkedIn API                                              │
│  - N8N Webhooks (comments, hashtags)                        │
│  - Hostinger SMTP (email notifications)                     │
└─────────────────────────────────────────────────────────────┘
```

### Frontend Architecture

```
src/
├── App.js                    # Root component with routing
├── index.js                  # React entry point
├── PrivateRoute.js          # Protected route wrapper
│
├── context/
│   └── AuthContext.js       # Global authentication state management
│
├── components/
│   ├── Header.js            # Main navigation header
│   ├── Sidebar.js           # Dashboard sidebar navigation
│   └── Footer.js            # Footer component
│
└── pages/
    ├── Login.js             # User login
    ├── CreateAccount.js     # User registration
    ├── ForgetPassword.js    # Password reset request
    ├── ResetPasswordForm.js # Password reset form
    │
    └── auth/                # Authenticated pages
        ├── Dashboard.js              # Main dashboard
        ├── CreatePost.js             # Create new posts
        ├── EditPost.js               # Edit existing posts
        ├── PostsList.js              # View all posts
        ├── PostCalendar.js           # Calendar view of posts
        ├── AllConnectedAccount.js    # Manage social accounts
        ├── PagesAnalytics.js         # Analytics dashboard
        ├── FacebookAnalyticsDetailPage.js
        ├── LinkedinAnalyticsDetailPage.js
        ├── InboxPage.js              # Real-time inbox messaging
        ├── AdCampaignComponent.js    # Ad campaigns list
        ├── AdCampaignDetailPage.js   # Ad campaign details
        └── Settings.js               # User settings
```

### Backend Architecture

```
backend/
├── index.js                 # Main server file (9000+ lines)
│
├── routes/
│   ├── facebookRoutes.js   # Facebook-specific API routes
│   └── linkedInRoutes.js   # LinkedIn-specific API routes
│
├── models/mysql/           # Sequelize models
│   ├── User.js
│   ├── SocialUser.js
│   ├── SocialUserPage.js
│   ├── UserPost.js
│   ├── Analytics.js
│   ├── Demographics.js
│   ├── AdsAccounts.js
│   ├── Campaigns.js
│   ├── Adsets.js
│   ├── AdsetsAds.js
│   ├── AdsCreative.js
│   ├── InboxConversations.js
│   ├── InboxMessages.js
│   ├── PostComments.js
│   ├── Settings.js
│   └── Activity.js
│
├── app/
│   ├── middleware/
│   │   └── verifyToken.js  # JWT token verification
│   └── mail/
│       └── verifyMail.js   # Email transporter setup
│
├── utils/
│   ├── encrypt.js          # Token encryption
│   ├── decrypt.js          # Token decryption
│   └── activityCreate.js   # Activity logging utility
│
├── db/
│   └── mysql.js            # Sequelize database connection
│
└── public/
    └── uploads/            # File storage
        └── posts/
            ├── images/
            └── videos/
```

---

## User Authentication Flow

### 1. User Registration

**Frontend Flow (`src/pages/CreateAccount.js`):**
```
User fills form → Submit → POST /api/sign-up
  ↓
Backend creates user account
  ↓
Sends verification email (Nodemailer)
  ↓
User redirected to email verification page
```

**Backend Logic (`backend/index.js`):**
- Validates email uniqueness
- Hashes password with bcrypt (10 rounds)
- Creates UUID for user
- Stores user in database with `status: false` (unverified)
- Sends verification email with unique link

**Database Table: users**
```sql
uuid, firstName, lastName, email, password (hashed), 
role, profileImage, timeZone, status, 
resetPasswordToken, resetPasswordRequestTime, 
createdAt, updatedAt
```

### 2. Email Verification

**Process:**
```
User clicks email link → GET /api/verify-email/:uuid
  ↓
Backend validates UUID
  ↓
Updates user status to true
  ↓
User redirected to login
```

### 3. User Login

**Frontend Flow (`src/pages/Login.js`):**
```
User enters credentials → POST /sign-in
  ↓
Backend validates email & password
  ↓
Checks if email is verified
  ↓
Generates JWT token (expires in 1 hour)
  ↓
Returns token + user info + social data
  ↓
Frontend stores token in localStorage
  ↓
AuthContext updates global state
  ↓
Navigate to /dashboard
```

**Backend Logic:**
- Validates email exists
- Compares password with bcrypt
- Checks email verification status
- Generates JWT with payload: `{userData: {uuid, firstName, lastName, email}}`
- Fetches user's social accounts and pages
- Returns comprehensive user data

**Response Structure:**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "expirationTime": "timestamp",
  "message": "Login successfully",
  "userInfo": {
    "uuid": "user_uuid",
    "firstName": "John",
    "lastName": "Doe",
    "email": "user@example.com",
    "socialData": [
      {
        "id": 1,
        "pageId": "facebook_page_id",
        "pageName": "My Page",
        "page_platform": "facebook",
        "status": "Connected",
        "token": "encrypted_page_token"
      }
    ]
  }
}
```

### 4. Password Reset

**Flow:**
```
User requests reset → POST /api/forget-password
  ↓
Backend generates crypto token
  ↓
Sends email with reset link
  ↓
User clicks link → GET /reset-password/:token
  ↓
User enters new password → POST /api/reset-password/:token
  ↓
Backend validates token & updates password
```

### 5. Token Management

**JWT Structure:**
```javascript
{
  userData: {
    uuid: "user_uuid",
    firstName: "John",
    lastName: "Doe",
    email: "user@example.com"
  }
}
```

**Token Verification Middleware:**
- Extracts token from `Authorization: Bearer <token>` header
- Verifies with JWT_SECRET
- Attaches decoded user data to request object
- Used for all protected API routes

---

## Social Media Account Connection

### Facebook Connection Flow

**1. Frontend Initiates Connection (`src/pages/auth/ConnectFacebook.js`):**
```javascript
// User clicks "Connect Facebook"
FacebookLogin.loginWithRedirect({
  appId: FACEBOOK_APP_ID,
  scope: [
    'public_profile',
    'email',
    'pages_show_list',
    'pages_manage_posts',
    'pages_read_engagement',
    'pages_messaging',
    'ads_read'
  ]
})
```

**2. Facebook Returns Short-Lived Token:**
```
Facebook redirects back → Frontend receives accessToken
  ↓
Frontend sends token to backend → POST /api/fb/account-connection
```

**3. Backend Processing (`backend/routes/facebookRoutes.js`):**

```javascript
// Step 1: Get user info from Facebook
GET https://graph.facebook.com/v22.0/me?access_token={token}
  &fields=id,name,email,picture

// Step 2: Get user's pages
GET https://graph.facebook.com/v22.0/me/accounts?access_token={token}

// Step 3: Exchange short-lived token for long-lived token (60 days)
GET https://graph.facebook.com/v22.0/oauth/access_token
  ?grant_type=fb_exchange_token
  &client_id={APP_ID}
  &client_secret={APP_SECRET}
  &fb_exchange_token={shortToken}

// Step 4: Save user and pages to database
```

**4. Database Storage:**

**social_users table:**
```sql
user_uuid, social_user_id, user_name, user_email, 
user_picture, user_cover, platform, status (Connected/Disconnected)
```

**social_user_pages table:**
```sql
user_uuid, social_userid, pageName, page_picture, page_cover,
pageId, category, total_followers, page_platform, 
status, token (encrypted page access token)
```

**5. Token Encryption:**
```javascript
// Encrypts long-lived tokens before storing
encryptToken(token, ENCRYPTION_SECRET)
// Decrypts when needed for API calls
decryptToken(encryptedToken, ENCRYPTION_SECRET)
```

### LinkedIn Connection Flow

Similar process using LinkedIn OAuth, but with limited functionality currently implemented.

### Page Token Management

- Each Facebook page has its own page access token
- Tokens are encrypted using AES-256 encryption
- Tokens are exchanged for long-lived versions (60 days)
- Backend automatically refreshes tokens when needed

---

## Post Management System

### Post States

Posts can be in three states:
- **Draft (status: 0)**: Saved but not published
- **Published (status: 1)**: Already published to social media
- **Scheduled (status: 2)**: Waiting to be published at scheduled time

### Creating a Post

**Frontend Flow (`src/pages/auth/CreatePost.js`):**

```
1. User selects platform(s): Facebook, LinkedIn
2. User selects connected page(s) to post to
3. User writes post content (max 2000 characters)
4. User optionally uploads media:
   - Images: JPEG, PNG, GIF (max 50MB)
   - Videos: MP4, MOV, AVI (max 50MB)
   - Multiple files supported
5. User chooses action:
   - Save as Draft
   - Publish Now
   - Schedule for Later
```

**Backend Processing:**

**1. Media Upload (`multer` configuration):**
```javascript
// Separate folders for images and videos
storage: multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.mimetype.startsWith('image/'))
      cb(null, "public/uploads/posts/images")
    else if (file.mimetype.startsWith('video/'))
      cb(null, "public/uploads/posts/videos")
  },
  filename: (req, file, cb) => {
    cb(null, `upload-${type}-${Date.now()}-${random}.${ext}`)
  }
})
```

**2. Save as Draft (`POST /api/post/save-draft`):**
```javascript
{
  user_uuid: "uuid",
  social_user_id: "facebook_user_id",
  page_id: "facebook_page_id",
  content: "Post content here",
  post_media: JSON.stringify([
    {
      url: "/uploads/posts/images/img-123.jpg",
      type: "image",
      platform: "local"
    }
  ]),
  post_platform: "facebook",
  status: 0  // Draft
}
```

**3. Publish Now (`POST /api/post/publish`):**

For each selected page:
```javascript
// Get page token from database
const page = await SocialUserPage.findOne({
  where: { pageId, user_uuid }
})

// Decrypt token
const pageToken = decryptToken(page.token)

// Upload media to Facebook first (if exists)
if (hasMedia) {
  // For images
  POST https://graph.facebook.com/v22.0/{pageId}/photos
    ?access_token={pageToken}
    &message={content}
    &url={imageUrl}
  
  // For videos
  POST https://graph.facebook.com/v22.0/{pageId}/videos
    ?access_token={pageToken}
    &description={content}
    &file_url={videoUrl}
}

// For text-only posts
POST https://graph.facebook.com/v22.0/{pageId}/feed
  ?access_token={pageToken}
  &message={content}

// Save to database
UserPost.create({
  user_uuid,
  social_user_id,
  page_id: pageId,
  content,
  post_media: JSON.stringify(mediaArray),
  platform_post_id: response.id,  // Facebook's post ID
  post_platform: "facebook",
  status: 1  // Published
})
```

**4. Schedule for Later (`POST /api/post/schedule`):**
```javascript
{
  content: "Post content",
  schedule_time: "1731349200",  // Unix timestamp
  status: 2  // Scheduled
}
```

### Post Scheduling System (Cron Job)

**Runs every 2 minutes:**
```javascript
cron.schedule('*/2 * * * *', async () => {
  const currentTime = Math.floor(Date.now() / 1000)
  
  // Find scheduled posts due for publishing
  const posts = await UserPost.findAll({
    where: {
      schedule_time: { [Op.lte]: currentTime },
      status: 2  // Scheduled
    }
  })
  
  // Publish each post
  for (const post of posts) {
    const page = await SocialUserPage.findOne({
      where: { pageId: post.page_id }
    })
    
    const token = decryptToken(page.token)
    
    // Publish to Facebook/LinkedIn
    const response = await publishToSocialMedia(post, token)
    
    // Update post status
    await post.update({
      platform_post_id: response.id,
      status: 1  // Published
    })
  }
})
```

### Editing Posts

**Frontend (`src/pages/auth/EditPost.js`):**
- Can only edit Draft posts
- Published posts cannot be edited
- Changes save back to database

### Post Analytics Tracking

When posts are published, the system stores:
- `platform_post_id`: Facebook/LinkedIn post ID
- `likes`, `comments`, `shares`: Engagement metrics
- `impressions`, `unique_impressions`: Reach metrics
- `engagements`: Total engagement count

These are updated by the analytics cron job.

---

## Analytics & Insights

### Data Collection Flow

**1. Automatic Data Updates (Cron Job - Every 2 minutes):**

```javascript
cron.schedule('*/2 * * * *', async () => {
  // Find pages that need analytics update
  const activities = await Activity.findAll({
    where: {
      activity_type: ['like', 'share', 'comment'],
      activity_subType: 'posts',
      nextAPI_call_dateTime: { [Op.lte]: currentTime }
    }
  })
  
  for (const activity of activities) {
    await updatePageAnalytics(activity.user_uuid, activity.reference_pageID)
  }
})
```

**2. Page Analytics Update Process:**

```javascript
// Get page token
const page = await SocialUserPage.findOne({ where: { pageId } })
const token = decryptToken(page.token)

// Fetch page insights from Facebook
GET https://graph.facebook.com/v22.0/{pageId}/insights
  ?metric=page_impressions,page_engaged_users,page_fan_adds,
         page_post_engagements
  &period=day
  &since={startDate}
  &until={endDate}
  &access_token={token}

// Fetch page posts
GET https://graph.facebook.com/v22.0/{pageId}/posts
  ?fields=id,message,created_time,likes.summary(true),
         comments.summary(true),shares
  &access_token={token}

// Update post engagement metrics
for (const post of posts) {
  await UserPost.update({
    likes: post.likes.summary.total_count,
    comments: post.comments.summary.total_count,
    shares: post.shares?.count || 0,
    engagements: likes + comments + shares
  }, {
    where: { platform_post_id: post.id }
  })
}

// Save analytics data
await Analytics.create({
  user_uuid,
  page_id: pageId,
  page_followers: pageData.followers_count,
  page_impressions: insightsData.page_impressions,
  page_engaged_users: insightsData.page_engaged_users,
  page_fan_adds: insightsData.page_fan_adds,
  total_posts: posts.length,
  week_date: weekIdentifier
})
```

### Analytics Dashboard

**Page-Level Analytics (`src/pages/auth/PagesAnalytics.js`):**
- Total followers across all connected pages
- Total posts published
- Total engagement (likes + comments + shares)
- Total impressions
- Week-over-week comparison
- Charts using ApexCharts

**Post-Level Analytics:**
- Individual post performance
- Engagement rate calculation
- Reach and impressions
- Comments sentiment analysis

**Demographics Data:**
```javascript
GET https://graph.facebook.com/v22.0/{pageId}/insights
  ?metric=page_fans_gender_age,page_fans_country,page_fans_city
  &access_token={token}

// Stored in demographics table
{
  user_uuid,
  page_id,
  age_gender_data: JSON,  // {"M.25-34": 150, "F.25-34": 200}
  country_data: JSON,     // {"US": 500, "UK": 200}
  city_data: JSON         // {"New York": 100, "London": 80}
}
```

---

## Inbox Messaging System

### Real-Time Messaging Architecture (Socket.io)

**1. WebSocket Connection Setup:**

**Backend (`backend/index.js`):**
```javascript
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
})

io.on('connection', (socket) => {
  // Verify JWT token
  const token = socket.handshake.auth.token
  const userData = jwt.verify(token, JWT_SECRET)
  socket.user = userData
  
  // Join user's room
  socket.join(socket.user.userData.uuid)
})
```

**Frontend (`src/pages/auth/InboxPage.js`):**
```javascript
import io from 'socket.io-client'

const socket = io('http://backend-url:3001', {
  auth: {
    token: localStorage.getItem('authToken')
  }
})

// Join specific conversation room
socket.emit('join_conversation', conversationId)
```

### Conversation Management

**2. Loading Conversations:**
```javascript
// Backend API: GET /api/inbox/conversations
const conversations = await InboxConversations.findAll({
  where: { user_uuid },
  include: [{
    model: InboxMessages,
    limit: 1,
    order: [['createdAt', 'DESC']]
  }],
  order: [['updatedAt', 'DESC']]
})
```

**inbox_conversations table:**
```sql
id, user_uuid, page_id, conversation_id (Facebook PSID),
participant_name, participant_id, participant_profile_pic,
last_message_text, last_message_time, unread_count,
createdAt, updatedAt
```

**3. Loading Messages:**
```javascript
// Backend API: GET /api/inbox/messages/:conversationId
const messages = await InboxMessages.findAll({
  where: { conversation_id: conversationId },
  order: [['createdAt', 'ASC']]
})
```

**inbox_messages table:**
```sql
id, user_uuid, page_id, conversation_id,
message_id, message_text, sender_id, sender_type (page/user),
message_time, read_status, createdAt, updatedAt
```

### Sending Messages (Real-Time)

**4. Client sends message:**
```javascript
// Frontend
socket.emit('send_message', {
  page_id: 'facebook_page_id',
  recipient_id: 'facebook_psid',
  message_text: 'Hello!',
  conversation_id: 'conv_id'
})
```

**5. Backend processes and broadcasts:**
```javascript
socket.on('send_message', async (message) => {
  // Get page token
  const page = await SocialUserPage.findOne({
    where: { pageId: message.page_id, user_uuid: socket.user.userData.uuid }
  })
  
  // Send via Facebook Messenger API
  const response = await axios.post(
    'https://graph.facebook.com/v18.0/me/messages',
    {
      recipient: { id: message.recipient_id },
      message: { text: message.message_text }
    },
    { params: { access_token: page.token } }
  )
  
  // Save to database
  const savedMessage = await InboxMessages.create({
    user_uuid: socket.user.userData.uuid,
    page_id: message.page_id,
    conversation_id: message.conversation_id,
    message_id: response.data.message_id,
    message_text: message.message_text,
    sender_id: message.page_id,
    sender_type: 'page',
    message_time: new Date()
  })
  
  // Broadcast to all connected clients in the conversation room
  io.to(message.conversation_id).emit('new_message', savedMessage)
})
```

### Receiving Messages

**6. Webhook Integration (Facebook → Backend):**
```javascript
// Facebook sends webhook when user messages the page
POST /api/facebook/webhook
{
  object: 'page',
  entry: [{
    messaging: [{
      sender: { id: 'user_psid' },
      recipient: { id: 'page_id' },
      message: { text: 'Hi!' }
    }]
  }]
}

// Backend processes and broadcasts
const message = await InboxMessages.create({...})
io.to(user_uuid).emit('new_message', message)
```

---

## Advertising Campaign Management

### Ad Accounts

**Fetching Ad Accounts:**
```javascript
GET https://graph.facebook.com/v19.0/me/adaccounts
  ?fields=name,account_id,account_status
  &access_token={token}

// Stored in ads_accounts table
{
  user_uuid,
  social_account_id,
  account_id,
  account_name,
  account_status,
  currency,
  timezone
}
```

### Campaigns

**Fetching Campaigns:**
```javascript
GET https://graph.facebook.com/v19.0/{adAccountId}/campaigns
  ?fields=id,name,objective,status,daily_budget,lifetime_budget,
         created_time,start_time,stop_time
  &access_token={token}

// Stored in campaigns table
{
  user_uuid,
  social_page_id,
  ad_account_id,
  campaign_id,
  campaign_name,
  objective,
  status,
  daily_budget,
  lifetime_budget
}
```

### Ad Sets

**Fetching Ad Sets:**
```javascript
GET https://graph.facebook.com/v19.0/{campaignId}/adsets
  ?fields=id,name,status,billing_event,optimization_goal,
         daily_budget,lifetime_budget,bid_amount
  &access_token={token}
```

### Ad Creative

**Fetching Ad Creatives:**
```javascript
GET https://graph.facebook.com/v19.0/{adId}/adcreatives
  ?fields=id,name,title,body,image_url,video_id,
         call_to_action_type,link_url
  &access_token={token}
```

### Campaign Insights

**Performance Metrics:**
```javascript
GET https://graph.facebook.com/v19.0/{adId}/insights
  ?fields=impressions,clicks,spend,reach,frequency,ctr,cpc,cpm
  &time_range={"since":"2024-01-01","until":"2024-12-31"}
  &access_token={token}
```

---

## Database Schema

### Core Tables

**users:**
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  uuid VARCHAR(255) NOT NULL,
  firstName VARCHAR(255) NOT NULL,
  lastName VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  bio TEXT,
  company VARCHAR(255),
  jobTitle VARCHAR(255),
  userLocation VARCHAR(255),
  userWebsite VARCHAR(255),
  role VARCHAR(50) DEFAULT 'User',
  profileImage VARCHAR(255),
  timeZone VARCHAR(100),
  resetPasswordToken VARCHAR(255),
  resetPasswordRequestTime VARCHAR(255),
  status BOOLEAN DEFAULT 0,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
)
```

**social_users:**
```sql
CREATE TABLE social_users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_uuid VARCHAR(255) NOT NULL,
  social_user_id VARCHAR(255) NOT NULL,
  user_name VARCHAR(255),
  user_email VARCHAR(255),
  user_picture TEXT,
  user_cover TEXT,
  platform VARCHAR(50),
  status VARCHAR(50),
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
)
```

**social_user_pages:**
```sql
CREATE TABLE social_user_pages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_uuid VARCHAR(255) NOT NULL,
  social_userid VARCHAR(255),
  pageName VARCHAR(255),
  page_picture TEXT,
  page_cover TEXT,
  pageId VARCHAR(255) NOT NULL,
  category VARCHAR(255),
  total_followers INT DEFAULT 0,
  page_platform VARCHAR(50),
  status VARCHAR(50),
  token TEXT,  -- Encrypted page access token
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
)
```

**posts:**
```sql
CREATE TABLE posts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_uuid VARCHAR(255) NOT NULL,
  social_user_id VARCHAR(255) NOT NULL,
  page_id VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  schedule_time VARCHAR(255),
  post_media LONGTEXT,  -- JSON array
  platform_post_id VARCHAR(255),
  post_platform VARCHAR(50),
  source ENUM('Platform', 'API') DEFAULT 'Platform',
  form_id VARCHAR(255),
  likes VARCHAR(50) DEFAULT '0',
  comments VARCHAR(50) DEFAULT '0',
  shares VARCHAR(50) DEFAULT '0',
  engagements VARCHAR(50) DEFAULT '0',
  impressions VARCHAR(50) DEFAULT '0',
  unique_impressions VARCHAR(50) DEFAULT '0',
  week_date VARCHAR(50),
  status BOOLEAN DEFAULT 0,  -- 0=Draft, 1=Published, 2=Scheduled
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
)
```

**analytics:**
```sql
CREATE TABLE analytics (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_uuid VARCHAR(255),
  page_id VARCHAR(255),
  page_followers INT,
  page_impressions INT,
  page_engaged_users INT,
  page_fan_adds INT,
  total_posts INT,
  week_date VARCHAR(50),
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
)
```

**inbox_conversations:**
```sql
CREATE TABLE inbox_conversations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_uuid VARCHAR(255),
  page_id VARCHAR(255),
  conversation_id VARCHAR(255),
  participant_name VARCHAR(255),
  participant_id VARCHAR(255),
  participant_profile_pic TEXT,
  last_message_text TEXT,
  last_message_time DATETIME,
  unread_count INT DEFAULT 0,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
)
```

**inbox_messages:**
```sql
CREATE TABLE inbox_messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_uuid VARCHAR(255),
  page_id VARCHAR(255),
  conversation_id VARCHAR(255),
  message_id VARCHAR(255),
  message_text TEXT,
  sender_id VARCHAR(255),
  sender_type VARCHAR(50),  -- 'page' or 'user'
  message_time DATETIME,
  read_status BOOLEAN DEFAULT 0,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
)
```

---

## API Endpoints

### Authentication Endpoints

```
POST   /sign-in                     # User login
POST   /api/sign-up                 # User registration
POST   /api/sign-out                # User logout
GET    /api/verify-email/:uuid     # Email verification
POST   /api/forget-password         # Request password reset
POST   /api/reset-password/:token  # Reset password
GET    /api/profile                 # Get user profile
PUT    /api/profile                 # Update user profile
```

### Social Account Endpoints

```
POST   /api/fb/account-connection       # Connect Facebook account
GET    /api/get-social-accounts          # Get all connected accounts
POST   /api/disconnect-social-account    # Disconnect social account
GET    /api/refresh-social-data          # Refresh account data
```

### Post Management Endpoints

```
POST   /api/post/save-draft         # Save post as draft
POST   /api/post/publish            # Publish post immediately
POST   /api/post/schedule           # Schedule post for later
GET    /api/posts                   # Get all posts
GET    /api/posts/:id               # Get single post
PUT    /api/posts/:id               # Update post
DELETE /api/posts/:id               # Delete post
GET    /api/posts/drafts            # Get draft posts
GET    /api/posts/scheduled         # Get scheduled posts
GET    /api/posts/published         # Get published posts
```

### Analytics Endpoints

```
GET    /api/analytics/pages             # Get page analytics
GET    /api/analytics/page/:pageId      # Get specific page analytics
GET    /api/analytics/posts             # Get posts analytics
GET    /api/analytics/demographics      # Get demographics data
POST   /api/analytics/refresh           # Trigger analytics update
```

### Inbox Endpoints

```
GET    /api/inbox/conversations         # Get all conversations
GET    /api/inbox/messages/:convId      # Get conversation messages
POST   /api/inbox/send-message          # Send message (also via Socket.io)
PUT    /api/inbox/mark-read/:convId     # Mark conversation as read
```

### Advertising Endpoints

```
GET    /api/ads/accounts                # Get ad accounts
GET    /api/ads/campaigns/:accountId    # Get campaigns
GET    /api/ads/adsets/:campaignId      # Get ad sets
GET    /api/ads/ads/:adsetId            # Get ads
GET    /api/ads/creative/:adId          # Get ad creative
GET    /api/ads/insights/:adId          # Get ad insights
```

---

## Configuration & Environment Variables

### Frontend (.env)

```env
PORT=5000
REACT_APP_BACKEND_URL=http://0.0.0.0:3001
REACT_APP_FACEBOOK_APP_ID=1177681116717331
REACT_APP_FACEBOOK_APP_SECRET=650156e2e5ab3e75a7d4ff1bce972d87
REACT_APP_HASHTAGS_WEBHOOK_URL=https://n8n.insocialwise.com/webhook/get-hashtags
REACT_APP_LINKEDIN_CLIENT_ID=865s7azczjsxgw
REACT_APP_ENCRYPTION_SECRET=Aronasoft1@1@1
```

### Backend (backend/.env)

```env
NODE_ENV=development
LOCAL_PORT=3001

# URLs
FRONTEND_URL=https://[replit-domain]
BACKEND_URL=https://[replit-domain]

# Database
DB_HOST=194.163.46.7
DB_PORT=3306
DB_USER=u742355347_insocial_newdb
DB_PASSWORD=Insocial1@1@1
DB_NAME=u742355347_insocial_newdb

# JWT
JWT_SECRET=aronasoft@insocialize.nodejs

# Email
EMAIL_HOST=smtp.hostinger.com
EMAIL_PORT=465
EMAIL_USER=no-reply@insocialwise.com
EMAIL_PASSWORD=Arona1@1@1@1
EMAIL_SECURE=true

# Facebook
facebook_APP_ID=1177681116717331
facebook_APP_Secret=650156e2e5ab3e75a7d4ff1bce972d87

# LinkedIn
LINKEDIN_CLIENT_ID=865s7azczjsxgw
LINKEDIN_CLIENT_SECRET=WPL_AP1.X7Lz9RHjsCTj8nOj.LFtltw==

# Encryption
ENCRYPTION_SECRET=Aronasoft1@1@1

# Webhooks
N8N_COMMENT_WEBHOOK_URL=https://n8n.insocialwise.com/webhook/fb-comment-webhook
```

---

## Scheduled Tasks & Cron Jobs

### Post Publishing Job (Every 2 minutes)

```javascript
cron.schedule('*/2 * * * *', async () => {
  const currentTime = Math.floor(Date.now() / 1000)
  
  // Find scheduled posts that are due
  const scheduledPosts = await UserPost.findAll({
    where: {
      schedule_time: {
        [Op.not]: null,
        [Op.lte]: currentTime.toString()
      },
      status: 2  // Scheduled
    }
  })
  
  // Publish each post
  for (const post of scheduledPosts) {
    try {
      // Get page token
      const page = await SocialUserPage.findOne({
        where: { pageId: post.page_id }
      })
      
      const token = decryptToken(page.token)
      
      // Publish to Facebook
      const response = await publishToFacebook(post, token)
      
      // Update post status
      await post.update({
        platform_post_id: response.id,
        status: 1  // Published
      })
      
      console.log(`Post ${post.id} published successfully`)
    } catch (error) {
      console.error(`Failed to publish post ${post.id}:`, error)
    }
  }
})
```

### Analytics Update Job (Every 2 minutes)

```javascript
cron.schedule('*/2 * * * *', async () => {
  // Find activities that need updating
  const activities = await Activity.findAll({
    where: {
      activity_type: ['like', 'share', 'comment'],
      activity_subType: 'posts',
      action: ['create', 'delete', 'update'],
      nextAPI_call_dateTime: {
        [Op.lte]: new Date()
      }
    },
    group: ['user_uuid', 'reference_pageID'],
    order: [['activity_dateTime', 'ASC']]
  })
  
  // Update analytics for each page
  for (const activity of activities) {
    try {
      await updatePageAnalytics(
        activity.user_uuid,
        activity.reference_pageID
      )
      
      // Update next call time (5 minutes later)
      await activity.update({
        nextAPI_call_dateTime: new Date(Date.now() + 5 * 60 * 1000)
      })
    } catch (error) {
      console.error('Analytics update failed:', error)
    }
  }
})
```

---

## Real-time Features (Socket.io)

### Socket Events

**Client → Server:**
```javascript
'join_conversation'      // Join a conversation room
'leave_conversation'     // Leave a conversation room
'send_message'           // Send a message
'typing_start'           // User started typing
'typing_stop'            // User stopped typing
```

**Server → Client:**
```javascript
'new_message'            // New message received
'message_sent'           // Message sent confirmation
'user_typing'            // Another user is typing
'error'                  // Error occurred
```

### Connection Authentication

```javascript
// Client-side
const socket = io(BACKEND_URL, {
  auth: {
    token: authToken
  }
})

// Server-side
io.on('connection', (socket) => {
  const token = socket.handshake.auth.token
  
  if (!token) {
    return socket.disconnect()
  }
  
  try {
    const userData = jwt.verify(token, JWT_SECRET)
    socket.user = userData
    socket.join(userData.uuid)
  } catch (err) {
    return socket.disconnect()
  }
})
```

### Room-Based Messaging

```javascript
// User joins conversation room
socket.join(conversationId)

// Broadcast message to all in conversation
io.to(conversationId).emit('new_message', messageData)

// Broadcast to specific user
io.to(user_uuid).emit('notification', notificationData)
```

---

## Security Features

### Password Security
- Bcrypt hashing with 10 salt rounds
- Minimum 8 characters
- Password reset with time-limited tokens

### Token Security
- JWT with 1-hour expiration
- Tokens stored in localStorage
- Verified on every protected API call
- Encrypted social media tokens (AES-256)

### API Security
- CORS configured for specific frontend domain
- JWT verification middleware on protected routes
- Input validation and sanitization
- File upload validation (type, size)

### Database Security
- Parameterized queries via Sequelize (prevents SQL injection)
- Connection pooling for MySQL
- Encrypted storage of sensitive tokens
- Unique indexes on critical fields

---

## Error Handling

### Frontend Error Handling
```javascript
try {
  const response = await fetch(API_URL, options)
  const data = await response.json()
  
  if (data.success) {
    // Handle success
    toast.success(data.message)
  } else {
    // Handle error
    toast.error(data.message)
  }
} catch (error) {
  toast.error('Network error. Please try again.')
  console.error(error)
}
```

### Backend Error Handling
```javascript
try {
  // Business logic
} catch (error) {
  console.error('Error:', error)
  res.status(500).json({
    success: false,
    message: error.message || 'Internal server error'
  })
}
```

---

## Deployment Considerations

### Current Setup
- **Frontend**: Port 5000 (webview)
- **Backend**: Port 3001 (console)
- **Database**: Remote MySQL (not local)

### Environment-Specific Configuration
- Development: Replit environment variables
- Production: Custom domain configuration
- Database: Shared across all environments

### File Storage
- Images: `public/uploads/posts/images/`
- Videos: `public/uploads/posts/videos/`
- User profiles: `public/uploads/users/`

---

## Future Enhancement Opportunities

### Potential Improvements
1. Instagram integration
2. Twitter/X integration
3. Post templates and AI-generated content
4. Advanced analytics with custom date ranges
5. Team collaboration features
6. Multi-user account support
7. Bulk post scheduling
8. Content calendar with drag-and-drop
9. Automated response for inbox messages
10. Performance optimization for large datasets

---

## Troubleshooting Guide

### Common Issues

**1. Posts not publishing:**
- Check if page token is valid
- Verify page permissions
- Check scheduled time format
- Review cron job logs

**2. Analytics not updating:**
- Verify cron job is running
- Check Facebook API rate limits
- Ensure page tokens are not expired
- Review activity table entries

**3. Inbox messages not loading:**
- Verify Socket.io connection
- Check page messaging permissions
- Ensure webhook is configured
- Review conversation table data

**4. Media upload failures:**
- Check file size (max 50MB)
- Verify file type (images/videos only)
- Ensure upload directories exist
- Check disk space

---

## Conclusion

InSocialWise is a comprehensive social media management platform with robust features for post management, analytics tracking, real-time messaging, and advertising campaign monitoring. The architecture leverages modern technologies (React, Node.js, Socket.io, MySQL) to provide a seamless user experience for managing multiple social media accounts from a single dashboard.

The system is designed with security, scalability, and maintainability in mind, using industry best practices for authentication, data encryption, and error handling. The scheduled tasks ensure that posts are published on time and analytics data stays up-to-date automatically.

---

**Document Version:** 1.0  
**Last Updated:** November 11, 2025  
**Created by:** Replit Agent
