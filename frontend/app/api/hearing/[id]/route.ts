import { getHearing } from '@/lib/services/hearingStore';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
)
{
	const { id } = await params;
	const state = await getHearing(id);
	if(!state) return NextResponse.json({ error: 'Hearing not found' }, { status: 404 });
	return NextResponse.json(state);
}
