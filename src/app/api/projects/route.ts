import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { projects, projectMembers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const organizationId = searchParams.get('organizationId');
    const userId = searchParams.get('userId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Single project by ID
    if (id) {
      if (!id || typeof id !== 'string' || id.trim() === '') {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const project = await db
        .select()
        .from(projects)
        .where(eq(projects.id, id))
        .limit(1);

      if (project.length === 0) {
        return NextResponse.json(
          { error: 'Project not found', code: 'PROJECT_NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(project[0], { status: 200 });
    }

    // List projects with filtering
    if (userId) {
      // Filter by user membership - join with project_members
      if (typeof userId !== 'string' || userId.trim() === '') {
        return NextResponse.json(
          { error: 'Valid userId is required', code: 'INVALID_USER_ID' },
          { status: 400 }
        );
      }

      let query = db
        .select({
          id: projects.id,
          name: projects.name,
          logoUrl: projects.logoUrl,
          organizationId: projects.organizationId,
          createdAt: projects.createdAt,
          createdBy: projects.createdBy,
        })
        .from(projects)
        .innerJoin(projectMembers, eq(projects.id, projectMembers.projectId))
        .where(eq(projectMembers.userId, userId));

      // If organizationId is also provided, add additional filter
      if (organizationId) {
        if (typeof organizationId !== 'string' || organizationId.trim() === '') {
          return NextResponse.json(
            { error: 'Valid organizationId is required', code: 'INVALID_ORGANIZATION_ID' },
            { status: 400 }
          );
        }
        query = db
          .select({
            id: projects.id,
            name: projects.name,
            logoUrl: projects.logoUrl,
            organizationId: projects.organizationId,
            createdAt: projects.createdAt,
            createdBy: projects.createdBy,
          })
          .from(projects)
          .innerJoin(projectMembers, eq(projects.id, projectMembers.projectId))
          .where(
            and(
              eq(projectMembers.userId, userId),
              eq(projects.organizationId, organizationId)
            )
          );
      }

      const results = await query.limit(limit).offset(offset);

      return NextResponse.json(results, { status: 200 });
    }

    // Filter by organizationId only
    if (organizationId) {
      if (typeof organizationId !== 'string' || organizationId.trim() === '') {
        return NextResponse.json(
          { error: 'Valid organizationId is required', code: 'INVALID_ORGANIZATION_ID' },
          { status: 400 }
        );
      }

      const results = await db
        .select()
        .from(projects)
        .where(eq(projects.organizationId, organizationId))
        .limit(limit)
        .offset(offset);

      return NextResponse.json(results, { status: 200 });
    }

    // Return all projects
    const results = await db
      .select()
      .from(projects)
      .limit(limit)
      .offset(offset);

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
    const { name, logoUrl, organizationId, createdBy } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Name is required and must be a non-empty string', code: 'MISSING_NAME' },
        { status: 400 }
      );
    }

    if (!organizationId || typeof organizationId !== 'string' || organizationId.trim() === '') {
      return NextResponse.json(
        { error: 'Organization ID is required and must be a string', code: 'MISSING_ORGANIZATION_ID' },
        { status: 400 }
      );
    }

    // Prepare insert data
    const insertData: any = {
      id: nanoid(),
      name: name.trim(),
      organizationId: organizationId.trim(),
      createdAt: new Date().toISOString(),
    };

    if (logoUrl && typeof logoUrl === 'string') {
      insertData.logoUrl = logoUrl.trim();
    }

    if (createdBy && typeof createdBy === 'string' && createdBy.trim() !== '') {
      insertData.createdBy = createdBy.trim();
    }

    const newProject = await db
      .insert(projects)
      .values(insertData)
      .returning();

    return NextResponse.json(newProject[0], { status: 201 });
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

    if (!id || typeof id !== 'string' || id.trim() === '') {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if project exists
    const existingProject = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1);

    if (existingProject.length === 0) {
      return NextResponse.json(
        { error: 'Project not found', code: 'PROJECT_NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, logoUrl, organizationId } = body;

    // Prepare update data
    const updateData: any = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        return NextResponse.json(
          { error: 'Name must be a non-empty string', code: 'INVALID_NAME' },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    if (logoUrl !== undefined) {
      if (logoUrl === null) {
        updateData.logoUrl = null;
      } else if (typeof logoUrl === 'string') {
        updateData.logoUrl = logoUrl.trim();
      } else {
        return NextResponse.json(
          { error: 'Logo URL must be a string or null', code: 'INVALID_LOGO_URL' },
          { status: 400 }
        );
      }
    }

    if (organizationId !== undefined) {
      if (typeof organizationId !== 'string' || organizationId.trim() === '') {
        return NextResponse.json(
          { error: 'Organization ID must be a string', code: 'INVALID_ORGANIZATION_ID' },
          { status: 400 }
        );
      }
      updateData.organizationId = organizationId.trim();
    }

    // If no valid fields to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(existingProject[0], { status: 200 });
    }

    const updatedProject = await db
      .update(projects)
      .set(updateData)
      .where(eq(projects.id, id))
      .returning();

    return NextResponse.json(updatedProject[0], { status: 200 });
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

    if (!id || typeof id !== 'string' || id.trim() === '') {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if project exists
    const existingProject = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1);

    if (existingProject.length === 0) {
      return NextResponse.json(
        { error: 'Project not found', code: 'PROJECT_NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(projects)
      .where(eq(projects.id, id))
      .returning();

    return NextResponse.json(
      {
        message: 'Project deleted successfully',
        project: deleted[0],
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