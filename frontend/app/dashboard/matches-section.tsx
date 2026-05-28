import { MultiplayerMatch } from '@/types/multiplayer';
import MatchRow from './match-row';

interface Props
{
	matches: MultiplayerMatch[];
	userId: string;
}

const MatchesSection = ({ matches, userId }: Props) =>
{
	const visible = matches.filter(m => m.status !== 'cancelled');
	if(!visible.length) return null;

	return (
		<div className='mb-10'>
			<p className='label-caps text-muted-foreground mb-4'>Your Matches</p>
			<div className='flex flex-col border border-border rounded-sm overflow-hidden'>
				{visible.map(match => (
					<MatchRow key={match.match_id} match={match} userId={userId} />
				))}
			</div>
		</div>
	);
};

export default MatchesSection;
