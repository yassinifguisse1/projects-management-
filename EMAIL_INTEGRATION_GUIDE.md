# Email Integration Guide

## Overview

The invitation system now includes email notifications! When you invite team members to your organization or projects, they'll receive a beautifully formatted email with a link to accept their invitation.

## Current Status

✅ **Email Infrastructure Ready**
- Email API endpoint created (`/api/send-invitation-email`)
- HTML email templates with professional styling
- Integration with invitation flow
- Invitation acceptance page with full UI

🔧 **Development Mode**
- Emails are currently logged to the console (not sent)
- All functionality works and is ready for production email service integration

## How It Works

### 1. Sending Invitations

When you click "Invite" from the Team page and submit the form:

1. **Organization Invitation** is created in database
2. **Email notification** is sent to the invitee
3. **Project Invitations** are created (if specific projects selected)
4. **Additional emails** are sent for each project invitation

### 2. Email Content

The invitation email includes:
- 🎉 Friendly welcome message
- Organization name and logo
- Project name (if applicable) or "All projects" access
- Role assignment (Member/Admin)
- One-click "Accept Invitation" button
- Expiration date (7 days)
- Direct invitation link

### 3. Accepting Invitations

When a user clicks the invitation link:
1. They're taken to `/invitations/[id]` page
2. If not logged in, they're prompted to log in
3. Email address must match the invitation
4. They can accept or decline the invitation
5. Upon acceptance, they're automatically added to:
   - The organization
   - All selected projects (or all organization projects)

## Production Integration

To enable actual email sending, integrate with an email service provider:

### Option 1: Resend (Recommended)

```bash
npm install resend
```

Add to `.env`:
```env
RESEND_API_KEY=your_api_key_here
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

Update `/api/send-invitation-email/route.ts`:
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to,
    subject,
    html,
  });
  return { success: true };
}
```

### Option 2: SendGrid

```bash
npm install @sendgrid/mail
```

Add to `.env`:
```env
SENDGRID_API_KEY=your_api_key_here
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

Update the `sendEmail` function:
```typescript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  await sgMail.send({
    from: process.env.SENDGRID_FROM_EMAIL!,
    to,
    subject,
    html,
  });
  return { success: true };
}
```

### Option 3: AWS SES

```bash
npm install @aws-sdk/client-ses
```

Add to `.env`:
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_SES_FROM_EMAIL=noreply@yourdomain.com
```

Update the `sendEmail` function:
```typescript
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const ses = new SESClient({ 
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  }
});

async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  await ses.send(new SendEmailCommand({
    Source: process.env.AWS_SES_FROM_EMAIL!,
    Destination: { ToAddresses: [to] },
    Message: {
      Subject: { Data: subject },
      Body: { Html: { Data: html } }
    }
  }));
  return { success: true };
}
```

## Testing in Development

Since emails are logged to console, you can see the full email content:

1. Send an invitation from the Team page
2. Check your terminal/console for the email log
3. Copy the invitation link from the logs
4. Open it in your browser to test the acceptance flow

Example console output:
```
=== EMAIL SENT ===
To: colleague@example.com
Subject: Invitation to join Acme Corp
Body: [Full HTML email content]
==================
```

## Features Implemented

✅ Toast notifications with Sonner
✅ Email sending infrastructure
✅ Professional HTML email templates
✅ Invitation acceptance page
✅ Email validation and matching
✅ Session-based authentication checks
✅ Automatic redirect after acceptance
✅ Error handling with user-friendly messages
✅ Invitation expiration checking
✅ Status tracking (pending/accepted/rejected)

## Environment Variables

Current `.env` setup:
```env
TURSO_CONNECTION_URL=...
TURSO_AUTH_TOKEN=...
BETTER_AUTH_SECRET=...
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Used for invitation links
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/invitations` | POST | Create new invitation |
| `/api/invitations/[id]` | GET | Get invitation details |
| `/api/invitations/[id]/accept` | POST | Accept/reject invitation |
| `/api/send-invitation-email` | POST | Send invitation email |

## User Flow

```
1. Admin clicks "Invite" → InviteDialog opens
2. Admin enters email, selects org/projects, chooses role
3. Submit → Creates invitations in database
4. For each invitation → Sends email with unique link
5. Invitee receives email → Clicks "Accept Invitation"
6. Opens `/invitations/[id]` → Shows invitation details
7. Must log in with matching email
8. Clicks "Accept" → Added to org/projects
9. Redirects to organization or project page
```

## Next Steps

1. **Choose an email service provider** (Resend recommended for ease of use)
2. **Add API keys** to `.env`
3. **Update the sendEmail function** in `/api/send-invitation-email/route.ts`
4. **Test with real emails** in production
5. **Optional**: Customize email template styling to match your brand

## Troubleshooting

**Q: Invitation emails not appearing?**
- Check console logs to see if email is being sent
- Verify NEXT_PUBLIC_APP_URL is set correctly
- Check spam folder for real emails in production

**Q: Can't accept invitation?**
- Ensure you're logged in with the correct email
- Check if invitation has expired (7 days default)
- Verify invitation status is "pending"

**Q: Toast notifications not showing?**
- Toaster component is added to layout.tsx
- Sonner package is already installed
- Check browser console for any errors