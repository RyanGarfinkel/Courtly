import { NextRequest, NextResponse } from 'next/server';
import { deleteNote } from '@/lib/services/notes';
import { auth0 } from '@/lib/auth0';

export const DELETE = async (_req: NextRequest, { params }: { params: Promise<{ note_id: string }> }) =>
{
	const session = await auth0.getSession();
	if(!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

	const { note_id } = await params;

	try
	{
		const deleted = await deleteNote(session.user.sub, note_id);
		return NextResponse.json({ deleted });
	}
	catch
	{
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
};
