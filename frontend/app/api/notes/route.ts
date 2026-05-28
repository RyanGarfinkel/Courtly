import { getNotesByHearing, createNote } from '@/lib/services/notes';
import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

export const GET = async (req: NextRequest) =>
{
	const session = await auth0.getSession();
	if(!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

	const hearingId = req.nextUrl.searchParams.get('hearing_id');
	if(!hearingId) return NextResponse.json({ error: 'Missing hearing_id' }, { status: 400 });

	try
	{
		const notes = await getNotesByHearing(session.user.sub, hearingId);
		return NextResponse.json({ notes });
	}
	catch
	{
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
};

export const POST = async (req: NextRequest) =>
{
	const session = await auth0.getSession();
	if(!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

	try
	{
		const { hearing_id, case_id, message_id, message_text, speaker, note_text } = await req.json();

		if(!hearing_id || !note_text?.trim())
			return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });

		const note = await createNote({
			user_id: session.user.sub,
			hearing_id,
			case_id: case_id ?? '',
			message_id: message_id ?? '',
			message_text: message_text ?? '',
			speaker: speaker ?? '',
			note_text: note_text.trim(),
		});

		return NextResponse.json({ note });
	}
	catch
	{
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
};
