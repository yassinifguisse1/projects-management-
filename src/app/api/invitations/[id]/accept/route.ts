import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { invitations, organizationMembers, projectMembers, projects } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Validate ID format
    if (!id || typeof id !== 'string' || id.trim() === '') {
      return NextResponse.json(
        { 
          error: 'Valid invitation ID is required',
          code: 'INVALID_ID'
        },
        { status: 400 }
      );
    }

    // Extract from request body
    const body = await request.json();
    const { userId, reject } = body;

    // Fetch invitation
    const invitation = await db.select()
      .from(invitations)
      .where(eq(invitations.id, id))
      .limit(1);

    if (invitation.length === 0) {
      return NextResponse.json(
        { 
          error: 'Invitation not found',
          code: 'INVITATION_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    const invitationRecord = invitation[0];

    // Check if invitation is pending
    if (invitationRecord.status !== 'pending') {
      return NextResponse.json(
        { 
          error: `Invitation has already been ${invitationRecord.status}`,
          code: 'INVITATION_ALREADY_PROCESSED'
        },
        { status: 400 }
      );
    }

    // Check if invitation has expired
    const currentDate = new Date();
    const expirationDate = new Date(invitationRecord.expiresAt);

    if (currentDate > expirationDate) {
      return NextResponse.json(
        { 
          error: 'Invitation has expired',
          code: 'INVITATION_EXPIRED'
        },
        { status: 400 }
      );
    }

    // Handle rejection
    if (reject) {
      const updatedInvitation = await db.update(invitations)
        .set({ status: 'rejected' })
        .where(eq(invitations.id, id))
        .returning();

      return NextResponse.json(
        {
          message: 'Invitation declined',
          invitation: updatedInvitation[0]
        },
        { status: 200 }
      );
    }

    // Handle acceptance
    if (!userId) {
      return NextResponse.json(
        { 
          error: 'User ID is required',
          code: 'MISSING_USER_ID'
        },
        { status: 400 }
      );
    }

    // Validate userId is string type
    if (typeof userId !== 'string' || userId.trim() === '') {
      return NextResponse.json(
        { 
          error: 'User ID must be a valid string',
          code: 'INVALID_USER_ID'
        },
        { status: 400 }
      );
    }

    const joinedAt = new Date().toISOString();

    // Add user to organization_members
    const newOrganizationMember = await db.insert(organizationMembers)
      .values({
        id: nanoid(),
        organizationId: invitationRecord.organizationId!,
        userId: userId.trim(),
        role: invitationRecord.role,
        joinedAt: joinedAt
      })
      .returning();

    const createdProjectMembers = [];

    // Handle project memberships
    if (invitationRecord.projectId !== null) {
      // Add user to specific project
      const newProjectMember = await db.insert(projectMembers)
        .values({
          id: nanoid(),
          projectId: invitationRecord.projectId,
          userId: userId.trim(),
          role: invitationRecord.role,
          joinedAt: joinedAt
        })
        .returning();

      createdProjectMembers.push(newProjectMember[0]);
    } else {
      // Get all projects for the organization
      const organizationProjects = await db.select()
        .from(projects)
        .where(eq(projects.organizationId, invitationRecord.organizationId!));

      // Add user to all projects
      for (const project of organizationProjects) {
        const newProjectMember = await db.insert(projectMembers)
          .values({
            id: nanoid(),
            projectId: project.id,
            userId: userId.trim(),
            role: invitationRecord.role,
            joinedAt: joinedAt
          })
          .returning();

        createdProjectMembers.push(newProjectMember[0]);
      }
    }

    // Update invitation status to 'accepted'
    const updatedInvitation = await db.update(invitations)
      .set({
        status: 'accepted'
      })
      .where(eq(invitations.id, id))
      .returning();

    return NextResponse.json(
      {
        message: 'Invitation accepted successfully',
        invitation: updatedInvitation[0],
        organizationMember: newOrganizationMember[0],
        projectMembers: createdProjectMembers
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + error
      },
      { status: 500 }
    );
  }
}