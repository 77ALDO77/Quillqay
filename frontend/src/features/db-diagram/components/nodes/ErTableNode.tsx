'use client';

import React, { useMemo } from 'react';
import type { Node } from '@antv/x6';
import { Key, ExternalLink, Table2 } from 'lucide-react';
import type { TableDef } from '../../core/types';

interface Props {
  node: Node;
}

export const ER_TABLE_WIDTH = 260;
export const ER_HEADER_HEIGHT = 44;
export const ER_ROW_HEIGHT = 34;

export function calculateTableHeight(columnCount: number): number {
  return ER_HEADER_HEIGHT + Math.max(columnCount, 1) * ER_ROW_HEIGHT + 8;
}

export const ErTableNode: React.FC<Props> = ({ node }) => {
  const data = node.getData() as { table?: TableDef } | undefined;
  const table = data?.table;

  const columns = useMemo(() => table?.columns || [], [table]);

  if (!table) {
    return (
      <div className="w-[260px] p-4 rounded-xl bg-surface-container border border-white/10 text-on-surface-variant text-xs">
        Loading table...
      </div>
    );
  }

  return (
    <div
      className="w-[260px] rounded-2xl border border-white/15 bg-surface-container/95 shadow-[0_12px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl overflow-hidden select-none group hover:border-primary/50 transition-colors"
      style={{ minHeight: `${calculateTableHeight(columns.length)}px` }}
    >
      {/* Table Header */}
      <div className="h-[44px] bg-primary/[0.12] border-b border-white/10 flex items-center justify-between px-3.5">
        <div className="flex items-center gap-2 min-w-0">
          <Table2 className="w-4 h-4 text-primary shrink-0" />
          <span className="text-xs font-bold text-primary font-mono tracking-tight truncate">
            {table.name}
          </span>
        </div>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-on-surface-variant/70 shrink-0">
          {columns.length}
        </span>
      </div>

      {/* Columns List */}
      <div className="divide-y divide-white/[0.04]">
        {columns.map((col) => (
          <div
            key={col.name}
            className="h-[34px] flex items-center justify-between px-3.5 text-xs hover:bg-white/[0.03] transition-colors"
          >
            <div className="flex items-center gap-1.5 min-w-0 flex-1 pr-2">
              {col.isPK ? (
                <Key className="w-3.5 h-3.5 text-primary shrink-0" />
              ) : col.isFK ? (
                <ExternalLink className="w-3.5 h-3.5 text-secondary shrink-0" />
              ) : (
                <span className="w-3.5 h-3.5 shrink-0" />
              )}
              <span className="text-on-surface font-mono font-medium truncate">
                {col.name}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-outline font-mono text-[10px] uppercase tracking-wider">
                {col.type}
              </span>
              {col.nullable && (
                <span className="text-outline-variant/40 text-[9px] font-medium font-mono">
                  NULL
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ErTableNode;
