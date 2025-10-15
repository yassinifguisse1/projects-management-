import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { organizations, organizationMembers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Single organization by ID
    if (id) {
      if (!id || typeof id !== 'string' || id.trim() === '') {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const organization = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, id))
        .limit(1);

      if (organization.length === 0) {
        return NextResponse.json(
          { error: 'Organization not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(organization[0], { status: 200 });
    }

    // List organizations with optional userId filter
    if (userId) {
      if (typeof userId !== 'string' || userId.trim() === '') {
        return NextResponse.json(
          { error: 'Valid userId is required', code: 'INVALID_USER_ID' },
          { status: 400 }
        );
      }

      // Join organizations with organization_members to filter by userId
      const userOrganizations = await db
        .select({
          id: organizations.id,
          name: organizations.name,
          logoUrl: organizations.logoUrl,
          createdAt: organizations.createdAt,
          createdBy: organizations.createdBy,
        })
        .from(organizations)
        .innerJoin(
          organizationMembers,
          eq(organizations.id, organizationMembers.organizationId)
        )
        .where(eq(organizationMembers.userId, userId))
        .limit(limit)
        .offset(offset);

      return NextResponse.json(userOrganizations, { status: 200 });
    }

    // List all organizations with pagination
    const allOrganizations = await db
      .select()
      .from(organizations)
      .limit(limit)
      .offset(offset);

    return NextResponse.json(allOrganizations, { status: 200 });
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
    const { name, logoUrl, createdBy } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name is required and must be a non-empty string', code: 'MISSING_NAME' },
        { status: 400 }
      );
    }

    // Validate createdBy if provided
    if (createdBy !== undefined && createdBy !== null && (typeof createdBy !== 'string' || createdBy.trim() === '')) {
      return NextResponse.json(
        { error: 'createdBy must be a valid string', code: 'INVALID_CREATED_BY' },
        { status: 400 }
      );
    }

    // Prepare organization data with nanoid
    const organizationData: {
      id: string;
      name: string;
      logoUrl?: string;
      createdAt: string;
      createdBy?: string;
    } = {
      id: nanoid(),
      name: name.trim(),
      createdAt: new Date().toISOString(),
    };

    if (logoUrl && typeof logoUrl === 'string') {
      organizationData.logoUrl = logoUrl.trim();
    }

    if (createdBy !== undefined && createdBy !== null) {
      organizationData.createdBy = createdBy.trim();
    }

    // Insert organization
    const newOrganization = await db
      .insert(organizations)
      .values(organizationData)
      .returning();

    // Add creator as organization owner in organization_members table
    if (createdBy !== undefined && createdBy !== null) {
      await db.insert(organizationMembers).values({
        id: nanoid(),
        organizationId: newOrganization[0].id,
        userId: createdBy.trim(),
        role: 'owner',
        joinedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json(newOrganization[0], { status: 201 });
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

    // Validate ID parameter
    if (!id || typeof id !== 'string' || id.trim() === '') {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, logoUrl } = body;

    // Check if organization exists
    const existingOrganization = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, id))
      .limit(1);

    if (existingOrganization.length === 0) {
      return NextResponse.json(
        { error: 'Organization not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: {
      name?: string;
      logoUrl?: string | null;
    } = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json(
          { error: 'Name must be a non-empty string', code: 'INVALID_NAME' },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    if (logoUrl !== undefined) {
      if (logoUrl === null || logoUrl === '') {
        updateData.logoUrl = null;
      } else if (typeof logoUrl === 'string') {
        updateData.logoUrl = logoUrl.trim();
      } else {
        return NextResponse.json(
          { error: 'logoUrl must be a string or null', code: 'INVALID_LOGO_URL' },
          { status: 400 }
        );
      }
    }

    // Update organization
    const updatedOrganization = await db
      .update(organizations)
      .set(updateData)
      .where(eq(organizations.id, id))
      .returning();

    return NextResponse.json(updatedOrganization[0], { status: 200 });
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

    // Validate ID parameter
    if (!id || typeof id !== 'string' || id.trim() === '') {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if organization exists
    const existingOrganization = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, id))
      .limit(1);

    if (existingOrganization.length === 0) {
      return NextResponse.json(
        { error: 'Organization not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete organization
    const deletedOrganization = await db
      .delete(organizations)
      .where(eq(organizations.id, id))
      .returning();

    return NextResponse.json(
      {
        message: 'Organization deleted successfully',
        organization: deletedOrganization[0],
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