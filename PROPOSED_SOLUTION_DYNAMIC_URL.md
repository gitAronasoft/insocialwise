# Proposed Solution: Dynamic Backend URL Configuration

## Current Problem

**Frontend Configuration Issue:**
```
Frontend .env: REACT_APP_BACKEND_URL=http://0.0.0.0:3001
```

This configuration **DOES NOT WORK** in the browser because:
1. Browsers cannot access `0.0.0.0:3001` directly
2. `0.0.0.0` is a bind address for servers, not a client-accessible URL
3. The frontend needs the actual Replit domain to make API calls

## Analysis

**Current Setup:**
- Frontend: Port 5000 (webview) - React development server
- Backend: Port 3001 (console) - Node.js Express server

**Replit Environment Variables Available:**
```bash
REPLIT_DEV_DOMAIN=f7800e36-8014-45da-b905-e73ca2d301ea-00-1ita257v22ptm.janeway.replit.dev
```

## Proposed Solution

Create a **runtime configuration system** that dynamically determines the correct backend URL based on the environment, without hardcoding URLs.

### Solution Architecture

```
┌─────────────────────────────────────────────────────┐
│  Browser (Frontend)                                  │
│  https://[replit-domain]                             │
└────────────────┬────────────────────────────────────┘
                 │
                 │ HTTP Request to Backend API
                 │ URL determined dynamically
                 │
┌────────────────▼────────────────────────────────────┐
│  Backend Server                                      │
│  Port 3001 (accessible via Replit proxy)             │
└─────────────────────────────────────────────────────┘
```

### Implementation Plan

I will create **NEW FILES** without modifying existing code:

#### 1. Create Frontend Config File: `src/config/apiConfig.js`

```javascript
/**
 * Dynamic API Configuration
 * Automatically detects environment and sets correct backend URL
 */

const getBackendURL = () => {
  // Check if we're in Replit environment
  if (window.location.hostname.includes('replit.dev')) {
    // Extract the Replit domain
    const replitDomain = window.location.hostname;
    // Backend is on same domain but port 3001
    return `https://${replitDomain}`;
  }
  
  // For production
  if (process.env.REACT_APP_BACKEND_URL) {
    return process.env.REACT_APP_BACKEND_URL;
  }
  
  // Fallback for local development
  return 'http://localhost:3001';
};

export const API_CONFIG = {
  BACKEND_URL: getBackendURL(),
  FACEBOOK_APP_ID: process.env.REACT_APP_FACEBOOK_APP_ID,
  LINKEDIN_CLIENT_ID: process.env.REACT_APP_LINKEDIN_CLIENT_ID,
  ENCRYPTION_SECRET: process.env.REACT_APP_ENCRYPTION_SECRET,
  HASHTAGS_WEBHOOK_URL: process.env.REACT_APP_HASHTAGS_WEBHOOK_URL
};

// Export for easy use
export const BACKEND_URL = API_CONFIG.BACKEND_URL;
```

#### 2. Update Frontend .env File

```env
# Remove hardcoded URL, use dynamic detection
# REACT_APP_BACKEND_URL=http://0.0.0.0:3001  # OLD - DELETE THIS

# For production deployment only (optional)
# REACT_APP_BACKEND_URL=https://api.insocialwise.com

# Keep other configs
REACT_APP_FACEBOOK_APP_ID=1177681116717331
REACT_APP_FACEBOOK_APP_SECRET=650156e2e5ab3e75a7d4ff1bce972d87
REACT_APP_HASHTAGS_WEBHOOK_URL=https://n8n.insocialwise.com/webhook/get-hashtags
REACT_APP_LINKEDIN_CLIENT_ID=865s7azczjsxgw
REACT_APP_ENCRYPTION_SECRET=Aronasoft1@1@1
```

#### 3. Backend Configuration Update

The backend `.env` already has the correct dynamic domain setup:
```env
FRONTEND_URL=https://f7800e36-8014-45da-b905-e73ca2d301ea-00-1ita257v22ptm.janeway.replit.dev
BACKEND_URL=https://f7800e36-8014-45da-b905-e73ca2d301ea-00-1ita257v22ptm.janeway.replit.dev
```

However, for better dynamic configuration, we can use Replit environment variables:

```env
# Dynamic URL configuration using Replit env vars
FRONTEND_URL=https://${REPLIT_DEV_DOMAIN}
BACKEND_URL=https://${REPLIT_DEV_DOMAIN}
```

### How This Solution Works

1. **Development (Replit):**
   - Frontend detects it's on `*.replit.dev` domain
   - Automatically uses `https://[same-domain]` for backend calls
   - No hardcoded URLs needed

2. **Production:**
   - Can set `REACT_APP_BACKEND_URL` to production API URL
   - Falls back to dynamic detection if not set

3. **Local Development:**
   - Falls back to `http://localhost:3001`
   - Developers can override with .env

### Files to Modify (WITH YOUR PERMISSION)

After you approve, I will need to update these files to use the new config:

1. **src/pages/Login.js** - Replace `process.env.REACT_APP_BACKEND_URL` with `import { BACKEND_URL } from '../config/apiConfig'`
2. **src/context/AuthContext.js** - Same replacement
3. **All other files** that use `process.env.REACT_APP_BACKEND_URL` (approximately 40 files)

### Alternative: Create New Files as Examples

I can create **EXAMPLE FILES** with the correct implementation:
- `src/pages/Login_UPDATED.js` - Updated version with new config
- `src/context/AuthContext_UPDATED.js` - Updated version
- Then you can review and choose to replace or keep both versions

## Benefits of This Solution

✅ **Dynamic**: Automatically adapts to environment  
✅ **No Hardcoding**: No manual URL updates needed  
✅ **Environment-Aware**: Works in Replit, production, and local development  
✅ **Maintainable**: Single source of truth for API configuration  
✅ **Flexible**: Can override with environment variables when needed  

## Testing Plan

After implementation:
1. Test login functionality
2. Verify API calls work correctly
3. Test post creation and publishing
4. Verify Socket.io connection
5. Check analytics data loading

## Your Decision Required

**Option 1: I create the config file + create updated copies of existing files**
- You review the changes
- You decide which files to use

**Option 2: I create the config file only**
- You manually update your files when ready
- Less automated but more control

**Option 3: I create the config file + update all files directly**
- Fastest solution
- I will make all necessary changes
- You review after completion

Which option would you prefer?
