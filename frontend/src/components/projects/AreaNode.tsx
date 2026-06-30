'use client';

import { type NodeProps, type Node } from '@xyflow/react';

interface AreaNodeData extends Record<string, unknown> {
  label: string;
  color: string;
}

export type AreaNodeType = Node<AreaNodeData, 'area'>;

export function AreaNode({ data, selected }: NodeProps<AreaNodeType>) {
  const color = data.color as string;

  return (
    <div
      className={`rounded-2xl border-2 border-dashed transition-colors w-full h-full pointer-events-none ${
        selected ? 'border-white/40' : 'border-white/10'
      }`}
      style={{
        background: `linear-gradient(135deg, ${color}15, ${color}08)`,
      }}
    >
      <div className="px-5 py-3" style={{ pointerEvents: 'auto' }}>
        <span
          className="text-[11px] font-bold uppercase tracking-[0.15em] select-none"
          style={{ color }}
        >
          {data.label}
        </span>
      </div>
    </div>
  );
}
