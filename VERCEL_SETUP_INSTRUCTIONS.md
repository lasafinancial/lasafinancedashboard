# Vercel Environment Variables Setup

## Required Environment Variables

You need to add the following environment variables in your Vercel project settings.

### Step 1: Get Your Firebase Service Account JSON

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `lasa-dashboard-2f21d`
3. Click the gear icon → Project Settings
4. Go to "Service Accounts" tab
5. Click "Generate New Private Key"
6. Download the JSON file (e.g., `firebase-service-account.json`)

### Step 2: Get Your Google Sheets Service Account JSON

This should be the same file you use locally:
- `key-partition-484615-n5-67743fa5e288.json`

### Step 3: Convert to Base64

**On Mac/Linux:**
```bash
# Firebase credentials
cat firebase-service-account.json | base64 | tr -d '\n' > firebase-base64.txt

# Google Sheets credentials  
cat key-partition-484615-n5-67743fa5e288.json | base64 | tr -d '\n' > google-base64.txt
```

**On Windows PowerShell:**
```powershell
# Firebase credentials
$json = Get-Content firebase-service-account.json -Raw
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($json)) | Out-File firebase-base64.txt

# Google Sheets credentials
$json = Get-Content key-partition-484615-n5-67743fa5e288.json -Raw
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($json)) | Out-File google-base64.txt
```

### Step 4: Add to Vercel

1. Go to your Vercel project dashboard
2. Click "Settings" → "Environment Variables"
3. Add the following variables:

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `FIREBASE_SERVICE_ACCOUNT_KEY_BASE64` | (paste content from firebase-base64.txt) | Production, Preview, Development |
| `GOOGLE_SERVICE_ACCOUNT_KEY_BASE64` | (paste content from google-base64.txt) | Production, Preview, Development |
| `CRON_SECRET` | (any random string, e.g., `your-secret-key-123`) | Production, Preview, Development |

**Important Notes:**
- Do NOT add quotes around the base64 strings
- Make sure there are NO newlines in the base64 strings
- The base64 strings will be very long (several thousand characters)
- Select all three environments (Production, Preview, Development)

### Step 5: Redeploy

After adding the environment variables:
1. Go to "Deployments" tab
2. Click the three dots on the latest deployment
3. Click "Redeploy"

OR simply push a new commit to trigger a deployment.

### Step 6: Test

1. Go to your deployed site: `https://lasa.vercel.app`
2. Enable notifications (click the bell icon)
3. Try sending a test notification
4. Check Vercel logs if there are any errors

---

## Troubleshooting

### If you still see "Cannot find module 'gaxios'" error:

The `api/package.json` file should fix this. If not, try:
1. Delete `node_modules` and `package-lock.json` locally
2. Run `npm install` again
3. Commit and push

### If you see "Invalid JSON" error:

Make sure:
1. You're using the Base64 environment variables (ending with `_BASE64`)
2. The base64 strings have NO newlines or extra characters
3. You copied the ENTIRE base64 string

### Check Vercel Logs:

You should see these console logs if everything is working:
```
Using Base64 encoded Firebase credentials
Firebase credentials parsed successfully
Using Base64 encoded Google credentials
Google credentials parsed successfully
```

If you see "Using direct JSON" instead, it means the Base64 variables are not set.
