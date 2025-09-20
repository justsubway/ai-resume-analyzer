# Premium System Testing Guide

## How to Test Owner Accounts

### 1. Set Up Owner Account
Edit `app/config/ownerAccounts.ts` and add your username:
```typescript
export const OWNER_ACCOUNTS = [
  'your-username',  // Add your actual username here
  'admin',
  'owner',
  'testuser',
];
```

### 2. Test the System

**Step 1: Sign In**
- Go to the app and sign in with Puter.js
- Use a username that's in the `OWNER_ACCOUNTS` list

**Step 2: Check Navbar**
- You should see your username in the navbar
- Status should show "Owner" in yellow text
- Sign out button should be visible

**Step 3: Test Premium Features**
- Upload a resume
- Click on the resume to view details
- All accordion sections should show full content (not locked)
- ATS suggestions should be visible
- AI Resume Improvement should be available

**Step 4: Test Free User Experience**
- Sign out and sign in with a different username (not in owner list)
- Status should show "Free" in gray text
- Accordion sections should show locked content
- ATS suggestions should be locked
- AI Resume Improvement should show upgrade prompt

### 3. Sign Out Functionality

**What happens when you sign out:**
1. Signs out from Puter.js authentication
2. Clears premium service state
3. Redirects to `/auth` page
4. All premium features become locked

### 4. Expected Behavior

**Owner Accounts:**
- ✅ Full access to all features
- ✅ "Owner" status in navbar
- ✅ No locked content
- ✅ All AI features available

**Free Accounts:**
- ✅ Basic resume viewing
- ✅ Overall score display
- ❌ Detailed analysis locked
- ❌ ATS suggestions locked
- ❌ AI improvement locked

### 5. Troubleshooting

**If premium features don't work:**
1. Check if your username is in `OWNER_ACCOUNTS`
2. Make sure you're signed in with Puter.js
3. Check browser console for errors
4. Try refreshing the page

**If sign out doesn't work:**
1. Check browser console for errors
2. Make sure Puter.js is loaded
3. Try refreshing the page

### 6. Development Notes

- Owner accounts are checked by username
- Premium status is determined at runtime
- All authentication goes through Puter.js
- Premium service integrates with Puter.js user data
