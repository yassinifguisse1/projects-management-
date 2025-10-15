import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user, organizations, projects } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  // Check if Resend API key is configured
  if (!process.env.RESEND_API_KEY) {
    console.log('=== EMAIL NOT SENT (No Resend API Key) ===');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('Configure RESEND_API_KEY to send real emails');
    console.log('==================');
    return { success: true, mode: 'development' };
  }

  try {
    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to,
      subject,
      html,
    });

    if (error) {
      console.error('Resend error:', JSON.stringify(error, null, 2));
      throw new Error(JSON.stringify(error));
    }

    console.log('✅ Email sent successfully via Resend:', data?.id);
    return { success: true, mode: 'production', emailId: data?.id };
  } catch (error: any) {
    console.error('Failed to send email via Resend:', error);
    throw new Error(error.message || String(error));
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      email, 
      invitationId, 
      organizationId, 
      projectId, 
      inviterUserId,
      role 
    } = body;

    if (!email || !invitationId || !organizationId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Fetch organization details
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1);

    if (!org) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Fetch inviter details
    let inviterName = 'Someone';
    if (inviterUserId) {
      const [inviter] = await db
        .select()
        .from(user)
        .where(eq(user.id, inviterUserId))
        .limit(1);
      
      if (inviter) {
        inviterName = inviter.name || inviter.email;
      }
    }

    // Fetch project details if applicable
    let projectName = null;
    if (projectId) {
      const [proj] = await db
        .select()
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1);
      
      if (proj) {
        projectName = proj.name;
      }
    }

    // Build invitation link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const invitationLink = `${baseUrl}/invitations/${invitationId}`;

    // Create email content
    const subject = projectName
      ? `Invitation to join ${projectName} on ${org.name}`
      : `Invitation to join ${org.name}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: #ffffff;
              border: 1px solid #e0e0e0;
              border-radius: 8px;
              padding: 32px;
              margin: 20px 0;
            }
            .header {
              text-align: center;
              margin-bottom: 32px;
            }
            .header h1 {
              color: #1a1a1a;
              font-size: 24px;
              margin: 0 0 8px 0;
            }
            .content {
              margin: 24px 0;
            }
            .button {
              display: inline-block;
              padding: 12px 32px;
              background-color: #1a1a1a;
              color: #ffffff !important;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 500;
              margin: 24px 0;
            }
            .button:hover {
              background-color: #333;
            }
            .button-container {
              text-align: center;
            }
            .footer {
              margin-top: 32px;
              padding-top: 24px;
              border-top: 1px solid #e0e0e0;
              font-size: 14px;
              color: #666;
            }
            .details {
              background: #f5f5f5;
              padding: 16px;
              border-radius: 6px;
              margin: 16px 0;
            }
            .details p {
              margin: 8px 0;
            }
            .role-badge {
              display: inline-block;
              padding: 4px 12px;
              background: #e8e8e8;
              border-radius: 4px;
              font-size: 13px;
              font-weight: 500;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 You've been invited!</h1>
            </div>
            
            <div class="content">
              <p><strong>${inviterName}</strong> has invited you to join:</p>
              
              <div class="details">
                <p><strong>Organization:</strong> ${org.name}</p>
                ${projectName ? `<p><strong>Project:</strong> ${projectName}</p>` : '<p><strong>Access:</strong> All organization projects</p>'}
                <p><strong>Role:</strong> <span class="role-badge">${role || 'member'}</span></p>
              </div>
              
              <p>Click the button below to accept your invitation and get started:</p>
              
              <div class="button-container">
                <a href="${invitationLink}" class="button">Accept Invitation</a>
              </div>
              
              <p style="font-size: 14px; color: #666;">
                Or copy and paste this link into your browser:<br>
                <a href="${invitationLink}" style="color: #1a1a1a; word-break: break-all;">${invitationLink}</a>
              </p>
            </div>
            
            <div class="footer">
              <p>This invitation will expire in 7 days.</p>
              <p>If you weren't expecting this invitation, you can safely ignore this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email
    const result = await sendEmail({ to: email, subject, html });

    return NextResponse.json(
      { 
        success: true, 
        message: 'Invitation email sent',
        mode: result.mode,
        emailId: result.emailId
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Email sending error:', error);
    return NextResponse.json(
      { error: 'Failed to send invitation email', details: error.message || String(error) },
      { status: 500 }
    );
  }
}