import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { invitations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');
    const projectId = searchParams.get('projectId');
    const email = searchParams.get('email');
    const status = searchParams.get('status') || 'pending';
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = db.select().from(invitations);

    // Build where conditions
    const conditions = [];
    
    if (organizationId) {
      if (typeof organizationId !== 'string' || organizationId.trim() === '') {
        return NextResponse.json(
          { error: 'Valid organizationId is required', code: 'INVALID_ORGANIZATION_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(invitations.organizationId, organizationId));
    }

    if (projectId) {
      if (typeof projectId !== 'string' || projectId.trim() === '') {
        return NextResponse.json(
          { error: 'Valid projectId is required', code: 'INVALID_PROJECT_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(invitations.projectId, projectId));
    }
    
    if (email) {
      conditions.push(eq(invitations.email, email.trim().toLowerCase()));
    }
    
    conditions.push(eq(invitations.status, status));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query.limit(limit).offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, organizationId, projectId, role, invitedBy } = body;

    // Validate required fields
    if (!email || typeof email !== 'string' || email.trim() === '') {
      return NextResponse.json(
        { error: 'Email is required', code: 'MISSING_EMAIL' },
        { status: 400 }
      );
    }

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId is required', code: 'MISSING_ORGANIZATION_ID' },
        { status: 400 }
      );
    }

    if (typeof organizationId !== 'string' || organizationId.trim() === '') {
      return NextResponse.json(
        { error: 'Valid organizationId is required', code: 'INVALID_ORGANIZATION_ID' },
        { status: 400 }
      );
    }

    if (!role || typeof role !== 'string' || role.trim() === '') {
      return NextResponse.json(
        { error: 'Role is required', code: 'MISSING_ROLE' },
        { status: 400 }
      );
    }

    // Validate role is one of the allowed values
    const validRoles = ['owner', 'admin', 'member'];
    if (!validRoles.includes(role.trim())) {
      return NextResponse.json(
        { error: 'Role must be one of: owner, admin, member', code: 'INVALID_ROLE' },
        { status: 400 }
      );
    }

    // Sanitize email
    const sanitizedEmail = email.trim().toLowerCase();

    // Auto-generate system fields
    const createdAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // Prepare insert data
    const insertData: any = {
      id: nanoid(),
      email: sanitizedEmail,
      organizationId: organizationId.trim(),
      role: role.trim(),
      status: 'pending',
      createdAt,
      expiresAt,
    };

    // projectId is optional - null means invitation is for all organization projects
    if (projectId !== undefined && projectId !== null) {
      if (typeof projectId !== 'string' || projectId.trim() === '') {
        return NextResponse.json(
          { error: 'Valid projectId is required when provided', code: 'INVALID_PROJECT_ID' },
          { status: 400 }
        );
      }
      insertData.projectId = projectId.trim();
    }

    // invitedBy is now string type
    if (invitedBy !== undefined && invitedBy !== null) {
      if (typeof invitedBy !== 'string' || invitedBy.trim() === '') {
        return NextResponse.json(
          { error: 'Valid invitedBy is required when provided', code: 'INVALID_INVITED_BY' },
          { status: 400 }
        );
      }
      insertData.invitedBy = invitedBy.trim();
    }

    const newInvitation = await db.insert(invitations)
      .values(insertData)
      .returning();

    return NextResponse.json(newInvitation[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Validate ID
    if (!id || typeof id !== 'string' || id.trim() === '') {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if invitation exists
    const existingInvitation = await db.select()
      .from(invitations)
      .where(eq(invitations.id, id))
      .limit(1);

    if (existingInvitation.length === 0) {
      return NextResponse.json(
        { error: 'Invitation not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete invitation
    const deleted = await db.delete(invitations)
      .where(eq(invitations.id, id))
      .returning();

    return NextResponse.json(
      { 
        message: 'Invitation deleted successfully',
        invitation: deleted[0]
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}