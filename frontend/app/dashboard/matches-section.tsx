import { MultiplayerMatch } from '@/types/multiplayer';
import MatchRow from './match-row';

interface Props
{
	matches: MultiplayerMatch[];
	userId: string;
}

export default function MatchesSection({ matches, userId }: Props)
{
	const visible = matches.filter(m => m.status !== 'cancelled');
	if(!visible.length) return null;

	return (
		<div className="mb-10">
			<h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
				Your Matches
			</h2>
			<div className="flex flex-col gap-2">
				{visible.map(match => (
					<MatchRow key={match.match_id} match={match} userId={userId} />
				))}
			</div>
		</div>
	);
}
