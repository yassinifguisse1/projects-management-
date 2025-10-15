import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { projectMembers, user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

const VALID_ROLES = ['owner', 'admin', 'member'] as const;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    const userId = searchParams.get('userId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required', code: 'MISSING_PROJECT_ID' },
        { status: 400 }
      );
    }

    if (typeof projectId !== 'string' || projectId.trim() === '') {
      return NextResponse.json(
        { error: 'Valid projectId is required', code: 'INVALID_PROJECT_ID' },
        { status: 400 }
      );
    }

    // Join with user table to get full user details
    let query = db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.image,
        role: projectMembers.role,
        joinedAt: projectMembers.joinedAt,
      })
      .from(projectMembers)
      .innerJoin(user, eq(projectMembers.userId, user.id))
      .where(eq(projectMembers.projectId, projectId))
      .limit(limit)
      .offset(offset);

    // Add userId filter if provided
    if (userId && typeof userId === 'string' && userId.trim() !== '') {
      const members = await db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.image,
          role: projectMembers.role,
          joinedAt: projectMembers.joinedAt,
        })
        .from(projectMembers)
        .innerJoin(user, eq(projectMembers.userId, user.id))
        .where(eq(projectMembers.projectId, projectId))
        .limit(limit)
        .offset(offset);
      
      const filtered = members.filter(m => m.id === userId.trim());
      return NextResponse.json(filtered, { status: 200 });
    }

    const members = await query;
    return NextResponse.json(members, { status: 200 });
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
    const { projectId, userId, role } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required', code: 'MISSING_PROJECT_ID' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

    if (!role) {
      return NextResponse.json(
        { error: 'role is required', code: 'MISSING_ROLE' },
        { status: 400 }
      );
    }

    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { 
          error: `role must be one of: ${VALID_ROLES.join(', ')}`, 
          code: 'INVALID_ROLE' 
        },
        { status: 400 }
      );
    }

    if (typeof projectId !== 'string' || projectId.trim() === '') {
      return NextResponse.json(
        { error: 'Valid projectId is required', code: 'INVALID_PROJECT_ID' },
        { status: 400 }
      );
    }

    if (typeof userId !== 'string' || userId.trim() === '') {
      return NextResponse.json(
        { error: 'Valid userId is required', code: 'INVALID_USER_ID' },
        { status: 400 }
      );
    }

    const newMember = await db
      .insert(projectMembers)
      .values({
        id: nanoid(),
        projectId: projectId.trim(),
        userId: userId.trim(),
        role,
        joinedAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newMember[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'id is required', code: 'MISSING_ID' },
        { status: 400 }
      );
    }

    if (typeof id !== 'string' || id.trim() === '') {
      return NextResponse.json(
        { error: 'Valid id is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { role } = body;

    if (!role) {
      return NextResponse.json(
        { error: 'role is required', code: 'MISSING_ROLE' },
        { status: 400 }
      );
    }

    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { 
          error: `role must be one of: ${VALID_ROLES.join(', ')}`, 
          code: 'INVALID_ROLE' 
        },
        { status: 400 }
      );
    }

    const existingMember = await db
      .select()
      .from(projectMembers)
      .where(eq(projectMembers.id, id))
      .limit(1);

    if (existingMember.length === 0) {
      return NextResponse.json(
        { error: 'Project member not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const updated = await db
      .update(projectMembers)
      .set({ role })
      .where(eq(projectMembers.id, id))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
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

    if (!id) {
      return NextResponse.json(
        { error: 'id is required', code: 'MISSING_ID' },
        { status: 400 }
      );
    }

    if (typeof id !== 'string' || id.trim() === '') {
      return NextResponse.json(
        { error: 'Valid id is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const existingMember = await db
      .select()
      .from(projectMembers)
      .where(eq(projectMembers.id, id))
      .limit(1);

    if (existingMember.length === 0) {
      return NextResponse.json(
        { error: 'Project member not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(projectMembers)
      .where(eq(projectMembers.id, id))
      .returning();

    return NextResponse.json(
      { 
        message: 'Project member removed successfully',
        deletedMember: deleted[0]
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