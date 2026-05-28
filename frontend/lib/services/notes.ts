import { getDb } from '@/lib/mongo';
import { Note } from '@/types/notes';

export const getNotesByHearing = async (userId: string, hearingId: string): Promise<Note[]> =>
{
	const db = await getDb();
	return db.collection('notes')
		.find({ user_id: userId, hearing_id: hearingId }, { projection: { _id: 0 } })
		.sort({ created_at: 1 })
		.toArray() as unknown as Note[];
};

export const createNote = async (data: Omit<Note, 'note_id' | 'created_at'>): Promise<Note> =>
{
	const db = await getDb();
	const note: Note = {
		...data,
		note_id: crypto.randomUUID(),
		created_at: new Date().toISOString(),
	};
	await db.collection('notes').insertOne(note);
	return note;
};

export const deleteNote = async (userId: string, noteId: string): Promise<boolean> =>
{
	const db = await getDb();
	const result = await db.collection('notes').deleteOne({ note_id: noteId, user_id: userId });
	return result.deletedCount > 0;
};
