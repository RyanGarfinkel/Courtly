import { getRecordByHearingId } from '@/lib/services/recordStore';
import { NextRequest, NextResponse } from 'next/server';

export const GET = async (_: NextRequest, { params }: { params: Promise<{ hearingId: string }> }) =>
{
	const { hearingId } = await params;
	const record = await getRecordByHearingId(hearingId);
	if(!record) return NextResponse.json({ error: 'Not found' }, { status: 404 });
	const { user_id, ...publicRecord } = record;
	return NextResponse.json(publicRecord);
};
