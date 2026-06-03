import { getAllHistoricalUIJudges, getBenchForYear, getHistoricalUIJudge } from '@/lib/services/historicalJudges';
import { UIJudge } from '@/types/hearing';

const CURRENT_BENCH_IDS = getBenchForYear(2023).map(j => j.id);

export const JUDGES: UIJudge[] = CURRENT_BENCH_IDS.map(id => getHistoricalUIJudge(id));

export const JUDGE_MAP: Record<string, UIJudge> = Object.fromEntries(
	getAllHistoricalUIJudges().map(j => [j.id, j])
);

export const FALLBACK_JUDGES = JUDGES;
