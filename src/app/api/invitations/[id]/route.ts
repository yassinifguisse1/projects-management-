import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { invitations } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
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

    return NextResponse.json(invitation[0], { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + error
      },
      { status: 500 }
    );
  }
}