# Google OAuth Client ID Setup Guide

To enable Google authentication, you need to create a Google OAuth Client ID:

## Steps:

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Create or Select a Project**
   - Click "Select a project" → "New Project"
   - Name it "Black Box Vending" or similar
   - Click "Create"

3. **Enable Google+ API**
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Choose "Web application"
   - Name: "Black Box Web Client"
   - Authorized JavaScript origins:
     - `http://localhost:5173`
     - `http://localhost:5174` (backup port)
   - Click "Create"

5. **Copy Your Client ID**
   - Copy the Client ID (looks like: `xxxxxx.apps.googleusercontent.com`)
   - Add it to your `.env` file:
     ```
     VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
     ```

6. **Restart Dev Server**
   - After adding to `.env`, restart your dev server with `npm run dev`

## For Production Deployment:

When you deploy, add your production domain to "Authorized JavaScript origins" in the Google Cloud Console.
