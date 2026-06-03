import { getHistoricalJudgeConfig, getBenchForYear } from './services/historicalJudges';
import { JudgeConfig } from '@/types/hearing';

const CURRENT_BENCH_IDS = getBenchForYear(2023).map(j => j.id);

export const JUDGES: JudgeConfig[] = CURRENT_BENCH_IDS
	.map(id => getHistoricalJudgeConfig(id))
	.filter((j): j is JudgeConfig => j !== undefined);

export function getJudgeById(id: string): JudgeConfig
{
	const judge = JUDGES.find(j => j.id === id) ?? getHistoricalJudgeConfig(id);
	if(!judge) throw new Error(`Judge not found: ${id}`);
	return judge;
}
