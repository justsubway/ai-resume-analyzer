# Owner Account Setup

## How to Set Owner Accounts

To grant premium access to specific users without payment, edit the file:

`app/config/ownerAccounts.ts`

### Example:

```typescript
export const OWNER_ACCOUNTS = [
  'your-email@gmail.com',        // Replace with your actual email
  'admin@yourcompany.com',       // Add more owner emails as needed
  'test@example.com',            // Test accounts
];
```

### How it Works:

1. **Owner Accounts** - Users with emails in this list get full premium access
2. **Free Users** - Can see basic resume analysis but not detailed feedback
3. **Premium Features** - Detailed analysis, resume improvement, job applications

### Testing:

1. Add your email to the `OWNER_ACCOUNTS` array
2. Sign in with that email
3. You should see "👑 Owner" status in the navbar
4. All premium features will be unlocked

### Features by Access Level:

#### Free Users:
- ✅ Basic resume upload
- ✅ Overall score display
- ❌ Detailed analysis breakdown
- ❌ AI resume improvement
- ❌ Job application features

#### Premium/Owner Users:
- ✅ All free features
- ✅ Detailed analysis breakdown
- ✅ AI resume improvement
- ✅ Job application features
- ✅ Download improved resumes

### Sign Out:

The sign-out button is available in the navbar and will:
- Clear user session
- Reset premium status
- Reload the page to clear all state




