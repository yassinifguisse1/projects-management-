import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { organizationMembers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

const VALID_ROLES = ['owner', 'admin', 'member'] as const;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');
    const userId = searchParams.get('userId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!organizationId) {
      return NextResponse.json(
        { 
          error: 'organizationId is required',
          code: 'MISSING_ORGANIZATION_ID'
        },
        { status: 400 }
      );
    }

    if (typeof organizationId !== 'string' || organizationId.trim() === '') {
      return NextResponse.json(
        { 
          error: 'organizationId must be a valid string',
          code: 'INVALID_ORGANIZATION_ID'
        },
        { status: 400 }
      );
    }

    let query = db.select()
      .from(organizationMembers)
      .where(eq(organizationMembers.organizationId, organizationId))
      .limit(limit)
      .offset(offset);

    const members = await query;

    // Filter by userId if provided (client-side filtering for simplicity)
    if (userId && typeof userId === 'string' && userId.trim() !== '') {
      const filtered = members.filter(m => m.userId === userId.trim());
      return NextResponse.json(filtered, { status: 200 });
    }

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
    const { organizationId, userId, role } = body;

    if (!organizationId) {
      return NextResponse.json(
        { 
          error: 'organizationId is required',
          code: 'MISSING_ORGANIZATION_ID'
        },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { 
          error: 'userId is required',
          code: 'MISSING_USER_ID'
        },
        { status: 400 }
      );
    }

    if (!role) {
      return NextResponse.json(
        { 
          error: 'role is required',
          code: 'MISSING_ROLE'
        },
        { status: 400 }
      );
    }

    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { 
          error: 'role must be one of: owner, admin, member',
          code: 'INVALID_ROLE'
        },
        { status: 400 }
      );
    }

    if (typeof organizationId !== 'string' || organizationId.trim() === '') {
      return NextResponse.json(
        { 
          error: 'organizationId must be a valid string',
          code: 'INVALID_ORGANIZATION_ID'
        },
        { status: 400 }
      );
    }

    if (typeof userId !== 'string' || userId.trim() === '') {
      return NextResponse.json(
        { 
          error: 'userId must be a valid string',
          code: 'INVALID_USER_ID'
        },
        { status: 400 }
      );
    }

    const newMember = await db.insert(organizationMembers)
      .values({
        id: nanoid(),
        organizationId: organizationId.trim(),
        userId: userId.trim(),
        role,
        joinedAt: new Date().toISOString()
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
        { 
          error: 'id is required',
          code: 'MISSING_ID'
        },
        { status: 400 }
      );
    }

    if (typeof id !== 'string' || id.trim() === '') {
      return NextResponse.json(
        { 
          error: 'id must be a valid string',
          code: 'INVALID_ID'
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { role } = body;

    if (!role) {
      return NextResponse.json(
        { 
          error: 'role is required',
          code: 'MISSING_ROLE'
        },
        { status: 400 }
      );
    }

    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { 
          error: 'role must be one of: owner, admin, member',
          code: 'INVALID_ROLE'
        },
        { status: 400 }
      );
    }

    const existing = await db.select()
      .from(organizationMembers)
      .where(eq(organizationMembers.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Organization member not found' },
        { status: 404 }
      );
    }

    const updated = await db.update(organizationMembers)
      .set({ role })
      .where(eq(organizationMembers.id, id))
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
        { 
          error: 'id is required',
          code: 'MISSING_ID'
        },
        { status: 400 }
      );
    }

    if (typeof id !== 'string' || id.trim() === '') {
      return NextResponse.json(
        { 
          error: 'id must be a valid string',
          code: 'INVALID_ID'
        },
        { status: 400 }
      );
    }

    const existing = await db.select()
      .from(organizationMembers)
      .where(eq(organizationMembers.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Organization member not found' },
        { status: 404 }
      );
    }

    const deleted = await db.delete(organizationMembers)
      .where(eq(organizationMembers.id, id))
      .returning();

    return NextResponse.json(
      { 
        message: 'Organization member removed successfully',
        member: deleted[0]
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