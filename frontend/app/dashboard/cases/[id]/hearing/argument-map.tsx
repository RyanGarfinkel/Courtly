'use client';

import { ReactFlow, Background, Handle, Position, MarkerType } from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { cn } from '@/lib/utils';

interface Claim
{
	id: string;
	text: string;
	strength: number;
}

interface Counter
{
	id: string;
	text: string;
	attacks: string[];
	severity: 'high' | 'medium' | 'low';
}

interface ArgumentMapData
{
	claims: Claim[];
	counters: Counter[];
}

interface Props
{
	data: ArgumentMapData;
}

const SEVERITY_STYLES = {
	high:   'bg-destructive/10 border-destructive/40',
	medium: 'bg-muted border-border',
	low:    'bg-muted border-border/50',
};

const SEVERITY_LABELS = { high: 'Strong', medium: 'Moderate', low: 'Minor' };

function ClaimNode({ data }: { data: { text: string; strength: number } })
{
	const strengthColor = data.strength >= 70
		? 'bg-foreground/10 border-foreground/30'
		: 'bg-muted border-border';

	return (
		<div className={cn('rounded-lg border px-3 py-2.5 w-[180px] shadow-sm', strengthColor)}>
			<p className="text-[11px] font-medium text-muted-foreground mb-1">Your Claim</p>
			<p className="text-xs text-foreground leading-snug">{data.text}</p>
			<div className="mt-2 flex items-center gap-1.5">
				<div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
					<div
						className="h-full bg-foreground/40 rounded-full"
						style={{ width: `${data.strength}%` }}
					/>
				</div>
				<span className="text-[10px] text-muted-foreground tabular-nums">{data.strength}</span>
			</div>
			<Handle type="target" position={Position.Right} className="!bg-border !border-border !w-2 !h-2" />
		</div>
	);
}

function CounterNode({ data }: { data: { text: string; severity: 'high' | 'medium' | 'low' } })
{
	return (
		<div className={cn('rounded-lg border px-3 py-2.5 w-[180px] shadow-sm', SEVERITY_STYLES[data.severity])}>
			<p className="text-[11px] font-medium text-muted-foreground mb-1">
				Counter · <span className="text-destructive/80">{SEVERITY_LABELS[data.severity]}</span>
			</p>
			<p className="text-xs text-foreground leading-snug">{data.text}</p>
			<Handle type="source" position={Position.Left} className="!bg-destructive/60 !border-destructive/60 !w-2 !h-2" />
		</div>
	);
}

const nodeTypes = { claim: ClaimNode, counter: CounterNode };

function buildNodes(claims: Claim[], counters: Counter[]): Node[]
{
	const claimStartY = Math.max(0, (counters.length - claims.length) * 55);
	const counterStartY = Math.max(0, (claims.length - counters.length) * 55);

	const claimNodes: Node[] = claims.map((c, i) => ({
		id: c.id,
		type: 'claim',
		position: { x: 20, y: claimStartY + i * 110 },
		data: { text: c.text, strength: c.strength },
	}));

	const counterNodes: Node[] = counters.map((k, i) => ({
		id: k.id,
		type: 'counter',
		position: { x: 240, y: counterStartY + i * 110 },
		data: { text: k.text, severity: k.severity },
	}));

	return [...claimNodes, ...counterNodes];
}

function buildEdges(counters: Counter[]): Edge[]
{
	return counters.flatMap(k =>
		k.attacks.map(attackId => ({
			id: `${k.id}-${attackId}`,
			source: k.id,
			target: attackId,
			animated: true,
			style: { stroke: 'hsl(var(--destructive))', strokeWidth: 1.5, strokeDasharray: '4 2' },
			markerEnd: { type: MarkerType.ArrowClosed, color: 'hsl(var(--destructive))', width: 12, height: 12 },
		}))
	);
}

export default function ArgumentMap({ data }: Props)
{
	const claims = data.claims ?? [];
	const counters = data.counters ?? [];
	const nodes = buildNodes(claims, counters);
	const edges = buildEdges(counters);

	return (
		<div className="h-[380px] rounded-lg border border-border overflow-hidden bg-muted/10">
			<ReactFlow
				nodes={nodes}
				edges={edges}
				nodeTypes={nodeTypes}
				nodesDraggable={false}
				nodesConnectable={false}
				fitView
				fitViewOptions={{ padding: 0.3 }}
				proOptions={{ hideAttribution: true }}
			>
				<Background gap={16} size={1} className="opacity-30" />
			</ReactFlow>
		</div>
	);
}
