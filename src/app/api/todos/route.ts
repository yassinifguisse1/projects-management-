import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { todos, projectMembers } from '@/db/schema';
import { eq, and, inArray, isNull } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// Helper function to parse attachments
const parseAttachments = (todo: any) => {
  if (todo.attachments && typeof todo.attachments === 'string') {
    try {
      todo.attachments = JSON.parse(todo.attachments);
    } catch (e) {
      // Keep as string if parsing fails
    }
  }
  return todo;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const projectId = searchParams.get('projectId');
    const userId = searchParams.get('userId');
    const includeSubtasks = searchParams.get('includeSubtasks') !== 'false'; // default true

    // Single todo by ID
    if (id) {
      if (!id || typeof id !== 'string' || id.trim() === '') {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const todo = await db
        .select()
        .from(todos)
        .where(eq(todos.id, id))
        .limit(1);

      if (todo.length === 0) {
        return NextResponse.json(
          { error: 'Todo not found', code: 'TODO_NOT_FOUND' },
          { status: 404 }
        );
      }

      // Get subtasks if requested
      if (includeSubtasks) {
        const subtasks = await db
          .select()
          .from(todos)
          .where(eq(todos.parentId, id));

        const parsedSubtasks = subtasks.map(parseAttachments);
        return NextResponse.json({ ...parseAttachments(todo[0]), subtasks: parsedSubtasks }, { status: 200 });
      }

      return NextResponse.json(parseAttachments(todo[0]), { status: 200 });
    }

    // List todos with optional filters and pagination
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Filter by userId - show only todos from projects where user is a member
    if (userId) {
      if (typeof userId !== 'string' || userId.trim() === '') {
        return NextResponse.json(
          { error: 'Valid userId is required', code: 'INVALID_USER_ID' },
          { status: 400 }
        );
      }

      // Get all project IDs where user is a member
      const userProjectMemberships = await db
        .select({ projectId: projectMembers.projectId })
        .from(projectMembers)
        .where(eq(projectMembers.userId, userId));

      const userProjectIds = userProjectMemberships.map(pm => pm.projectId);

      if (userProjectIds.length === 0) {
        return NextResponse.json([], { status: 200 });
      }

      // Get todos from user's projects (only parent todos if includeSubtasks is true)
      let query = db.select().from(todos).where(inArray(todos.projectId, userProjectIds));

      // Apply additional projectId filter if provided
      if (projectId) {
        if (typeof projectId !== 'string' || projectId.trim() === '') {
          return NextResponse.json(
            { error: 'Valid project ID is required', code: 'INVALID_PROJECT_ID' },
            { status: 400 }
          );
        }
        query = db.select().from(todos).where(
          and(
            inArray(todos.projectId, userProjectIds),
            eq(todos.projectId, projectId),
            includeSubtasks ? isNull(todos.parentId) : undefined
          )
        );
      } else if (includeSubtasks) {
        query = db.select().from(todos).where(
          and(
            inArray(todos.projectId, userProjectIds),
            isNull(todos.parentId)
          )
        );
      }

      const results = await query.limit(limit).offset(offset);

      // Attach subtasks to each parent todo
      if (includeSubtasks) {
        const todosWithSubtasks = await Promise.all(
          results.map(async (todo) => {
            const subtasks = await db
              .select()
              .from(todos)
              .where(eq(todos.parentId, todo.id));
            const parsedSubtasks = subtasks.map(parseAttachments);
            return { ...parseAttachments(todo), subtasks: parsedSubtasks };
          })
        );
        return NextResponse.json(todosWithSubtasks, { status: 200 });
      }

      return NextResponse.json(results.map(parseAttachments), { status: 200 });
    }

    // Filter by projectId only
    let query = db.select().from(todos);

    if (projectId) {
      if (typeof projectId !== 'string' || projectId.trim() === '') {
        return NextResponse.json(
          { error: 'Valid project ID is required', code: 'INVALID_PROJECT_ID' },
          { status: 400 }
        );
      }
      query = query.where(
        and(
          eq(todos.projectId, projectId),
          includeSubtasks ? isNull(todos.parentId) : undefined
        )
      );
    } else if (includeSubtasks) {
      query = query.where(isNull(todos.parentId));
    }

    const results = await query.limit(limit).offset(offset);

    // Attach subtasks to each parent todo
    if (includeSubtasks) {
      const todosWithSubtasks = await Promise.all(
        results.map(async (todo) => {
          const subtasks = await db
            .select()
            .from(todos)
            .where(eq(todos.parentId, todo.id));
          const parsedSubtasks = subtasks.map(parseAttachments);
          return { ...parseAttachments(todo), subtasks: parsedSubtasks };
        })
      );
      return NextResponse.json(todosWithSubtasks, { status: 200 });
    }

    return NextResponse.json(results.map(parseAttachments), { status: 200 });
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
    const { text, projectId, completed, createdBy, parentId, description, attachments } = body;

    // Validate required fields
    if (!text || typeof text !== 'string' || text.trim() === '') {
      return NextResponse.json(
        { error: 'Text is required and must be a non-empty string', code: 'MISSING_TEXT' },
        { status: 400 }
      );
    }

    if (!projectId || typeof projectId !== 'string' || projectId.trim() === '') {
      return NextResponse.json(
        { error: 'Valid project ID is required', code: 'MISSING_PROJECT_ID' },
        { status: 400 }
      );
    }

    // If parentId is provided, validate it exists
    if (parentId !== undefined && parentId !== null) {
      if (typeof parentId !== 'string' || parentId.trim() === '') {
        return NextResponse.json(
          { error: 'Valid parent ID is required when provided', code: 'INVALID_PARENT_ID' },
          { status: 400 }
        );
      }

      const parentTodo = await db
        .select()
        .from(todos)
        .where(eq(todos.id, parentId))
        .limit(1);

      if (parentTodo.length === 0) {
        return NextResponse.json(
          { error: 'Parent todo not found', code: 'PARENT_TODO_NOT_FOUND' },
          { status: 404 }
        );
      }

      // Ensure parent and child are in the same project
      if (parentTodo[0].projectId !== projectId.trim()) {
        return NextResponse.json(
          { error: 'Parent todo must be in the same project', code: 'PARENT_PROJECT_MISMATCH' },
          { status: 400 }
        );
      }
    }

    // Prepare insert data
    const insertData: {
      id: string;
      text: string;
      projectId: string;
      completed: boolean;
      parentId?: string | null;
      createdBy?: string | null;
      description?: string | null;
      attachments?: string | null;
      createdAt: string;
      updatedAt: string;
    } = {
      id: nanoid(),
      text: text.trim(),
      projectId: projectId.trim(),
      completed: completed !== undefined ? Boolean(completed) : false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Add parentId if provided
    if (parentId !== undefined && parentId !== null && typeof parentId === 'string' && parentId.trim() !== '') {
      insertData.parentId = parentId.trim();
    }

    // Add createdBy if provided
    if (createdBy !== undefined && typeof createdBy === 'string' && createdBy.trim() !== '') {
      insertData.createdBy = createdBy.trim();
    }

    // Add description if provided
    if (description !== undefined && description !== null && typeof description === 'string' && description.trim() !== '') {
      insertData.description = description.trim();
    }

    // Add attachments if provided - store as JSON string
    if (attachments !== undefined && attachments !== null) {
      if (Array.isArray(attachments) || typeof attachments === 'object') {
        insertData.attachments = JSON.stringify(attachments);
      } else if (typeof attachments === 'string') {
        insertData.attachments = attachments;
      }
    }

    const newTodo = await db.insert(todos).values(insertData).returning();

    // Parse attachments back to JSON for response
    const todoResponse = { ...newTodo[0] };
    if (todoResponse.attachments && typeof todoResponse.attachments === 'string') {
      try {
        todoResponse.attachments = JSON.parse(todoResponse.attachments);
      } catch (e) {
        // Keep as string if parsing fails
      }
    }

    return NextResponse.json(todoResponse, { status: 201 });
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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate ID parameter
    if (!id || typeof id !== 'string' || id.trim() === '') {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if todo exists
    const existingTodo = await db
      .select()
      .from(todos)
      .where(eq(todos.id, id))
      .limit(1);

    if (existingTodo.length === 0) {
      return NextResponse.json(
        { error: 'Todo not found', code: 'TODO_NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { text, completed, parentId, description, attachments } = body;

    // Prepare update data
    const updateData: {
      text?: string;
      completed?: boolean;
      parentId?: string | null;
      description?: string | null;
      attachments?: string | null;
      updatedAt: string;
    } = {
      updatedAt: new Date().toISOString(),
    };

    // Add text if provided
    if (text !== undefined) {
      if (typeof text !== 'string' || text.trim() === '') {
        return NextResponse.json(
          { error: 'Text must be a non-empty string', code: 'INVALID_TEXT' },
          { status: 400 }
        );
      }
      updateData.text = text.trim();
    }

    // Add completed if provided
    if (completed !== undefined) {
      updateData.completed = Boolean(completed);
    }

    // Add description if provided
    if (description !== undefined) {
      if (description === null || description === '') {
        updateData.description = null;
      } else if (typeof description === 'string') {
        updateData.description = description.trim();
      } else {
        return NextResponse.json(
          { error: 'Description must be a string or null', code: 'INVALID_DESCRIPTION' },
          { status: 400 }
        );
      }
    }

    // Add attachments if provided - store as JSON string
    if (attachments !== undefined) {
      if (attachments === null) {
        updateData.attachments = null;
      } else if (Array.isArray(attachments) || typeof attachments === 'object') {
        updateData.attachments = JSON.stringify(attachments);
      } else if (typeof attachments === 'string') {
        updateData.attachments = attachments;
      }
    }

    // Handle parentId updates (moving tasks between parents or removing parent)
    if (parentId !== undefined) {
      if (parentId === null || parentId === '') {
        // Remove parent (make it a top-level task)
        updateData.parentId = null;
      } else if (typeof parentId === 'string' && parentId.trim() !== '') {
        // Prevent circular reference (task cannot be its own parent)
        if (parentId.trim() === id.trim()) {
          return NextResponse.json(
            { error: 'Task cannot be its own parent', code: 'CIRCULAR_REFERENCE' },
            { status: 400 }
          );
        }

        // Validate new parent exists
        const newParent = await db
          .select()
          .from(todos)
          .where(eq(todos.id, parentId.trim()))
          .limit(1);

        if (newParent.length === 0) {
          return NextResponse.json(
            { error: 'Parent todo not found', code: 'PARENT_TODO_NOT_FOUND' },
            { status: 404 }
          );
        }

        // Ensure parent and child are in the same project
        if (newParent[0].projectId !== existingTodo[0].projectId) {
          return NextResponse.json(
            { error: 'Parent todo must be in the same project', code: 'PARENT_PROJECT_MISMATCH' },
            { status: 400 }
          );
        }

        // Prevent making a parent task a child of its own descendant
        const checkCircular = async (currentParentId: string): Promise<boolean> => {
          if (currentParentId === id.trim()) return true;
          
          const parent = await db
            .select()
            .from(todos)
            .where(eq(todos.id, currentParentId))
            .limit(1);

          if (parent.length > 0 && parent[0].parentId) {
            return checkCircular(parent[0].parentId);
          }
          return false;
        };

        const isCircular = await checkCircular(parentId.trim());
        if (isCircular) {
          return NextResponse.json(
            { error: 'Cannot create circular task relationship', code: 'CIRCULAR_REFERENCE' },
            { status: 400 }
          );
        }

        updateData.parentId = parentId.trim();
      } else {
        return NextResponse.json(
          { error: 'Parent ID must be a valid string or null', code: 'INVALID_PARENT_ID' },
          { status: 400 }
        );
      }
    }

    const updatedTodo = await db
      .update(todos)
      .set(updateData)
      .where(eq(todos.id, id))
      .returning();

    // Parse attachments back to JSON for response
    const todoResponse = { ...updatedTodo[0] };
    if (todoResponse.attachments && typeof todoResponse.attachments === 'string') {
      try {
        todoResponse.attachments = JSON.parse(todoResponse.attachments);
      } catch (e) {
        // Keep as string if parsing fails
      }
    }

    return NextResponse.json(todoResponse, { status: 200 });
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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate ID parameter
    if (!id || typeof id !== 'string' || id.trim() === '') {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if todo exists
    const existingTodo = await db
      .select()
      .from(todos)
      .where(eq(todos.id, id))
      .limit(1);

    if (existingTodo.length === 0) {
      return NextResponse.json(
        { error: 'Todo not found', code: 'TODO_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Get all subtasks recursively
    const getAllSubtasks = async (parentId: string): Promise<string[]> => {
      const directSubtasks = await db
        .select()
        .from(todos)
        .where(eq(todos.parentId, parentId));

      let allSubtaskIds = directSubtasks.map(t => t.id);

      for (const subtask of directSubtasks) {
        const nestedSubtasks = await getAllSubtasks(subtask.id);
        allSubtaskIds = [...allSubtaskIds, ...nestedSubtasks];
      }

      return allSubtaskIds;
    };

    const subtaskIds = await getAllSubtasks(id);

    // Delete all subtasks first (cascading delete)
    if (subtaskIds.length > 0) {
      await db
        .delete(todos)
        .where(inArray(todos.id, subtaskIds));
    }

    // Delete the parent todo
    const deleted = await db
      .delete(todos)
      .where(eq(todos.id, id))
      .returning();

    return NextResponse.json(
      {
        message: 'Todo deleted successfully',
        deletedTodo: deleted[0],
        deletedSubtasksCount: subtaskIds.length,
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