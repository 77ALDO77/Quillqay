'use client';

import { useMemo, useState } from 'react';
import { Handle, Position, useConnection, type Node, type NodeProps } from '@xyflow/react';
import { Key, ChevronDown, ChevronUp } from 'lucide-react';
import {
  RIGHT_SOURCE_PREFIX, TARGET_PREFIX,
} from '@/lib/handle-constants';

const TABLE_REL_SOURCE = 'table_rel_source_';
const TABLE_REL_TARGET = 'table_rel_target_';
const MINIMIZED_FIELDS = 3;

interface FieldDef {
  name: string;
  type: string;
  isPK: boolean;
  nullable: boolean;
}

interface DbTableData extends Record<string, unknown> {
  label: string;
  fields: FieldDef[];
  color: string;
}

export type DbTableNodeType = Node<DbTableData, 'demoTable'>;

function TableFieldRow({
  field, focused,
}: {
  field: FieldDef;
  focused: boolean;
}) {
  return (
    <div className="h-[30px] flex items-center px-3 text-xs relative hover:bg-white/[0.02] transition-colors">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {field.isPK ? (
          <Key className="w-2.5 h-2.5 text-primary shrink-0" />
        ) : (
          <div className="w-2.5 h-2.5 shrink-0" />
        )}
        <span className="text-on-surface font-mono text-[11px] truncate">{field.name}</span>
      </div>
      <div className="flex items-center gap-1.5 shrink-0 ml-2">
        <span className="text-outline font-mono text-[9px] uppercase">{field.type}</span>
        {field.nullable && <span className="text-outline-variant/40 text-[8px] font-medium">NULL</span>}
      </div>

      <Handle type="source" position={Position.Right}
        id={`${RIGHT_SOURCE_PREFIX}${field.name}`}
        style={{ top: '50%', transform: 'translate(50%, -50%)', background: '#d3fbff', border: '2px solid #201f21', width: 10, height: 10 }}
        className={`${focused ? '!opacity-100' : '!opacity-0'} shadow-[0_0_0_4px_rgba(211,251,255,0.08)] transition-opacity`}
      />
      {field.isPK && (
        <Handle type="target" position={Position.Left}
          id={`${TARGET_PREFIX}0_${field.name}`}
          style={{ top: '50%', transform: 'translate(-50%, -50%)', background: '#d6baff', border: '2px solid #201f21', width: 10, height: 10 }}
          className={`${focused ? '!opacity-100' : '!opacity-0'} shadow-[0_0_0_4px_rgba(214,186,255,0.08)] transition-opacity`}
        />
      )}
    </div>
  );
}

export function DbTableNode({ data, selected, id }: NodeProps<DbTableNodeType>) {
  const fields = data.fields as FieldDef[];
  const color = data.color as string;
  const [isHovering, setIsHovering] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const connection = useConnection();
  const focused = (selected && !connection.inProgress) || isHovering;
  const isTarget = connection.inProgress && connection.fromNode?.id !== id;

  const visibleFields = useMemo(() => {
    if (expanded || fields.length <= MINIMIZED_FIELDS) return fields;
    return fields.slice(0, MINIMIZED_FIELDS);
  }, [fields, expanded]);

  return (
    <div
      className={`rounded-xl border-2 bg-surface-container shadow-lg w-[224px] transition-all ${
        isTarget ? 'border-secondary ring-2 ring-secondary/20' :
        selected ? 'border-primary' : 'border-white/10'
      }`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <Handle type="source" position={Position.Top}
        id={`${TABLE_REL_SOURCE}${id}`}
        className="!invisible !left-1/2 !top-1/2 !h-1 !w-1 !-translate-x-1/2 !-translate-y-1/2"
      />
      <Handle type="target" position={Position.Top}
        id={`${TABLE_REL_TARGET}${id}`}
        className="!absolute !left-0 !top-0 !h-full !w-full !transform-none !rounded-none !border-none !opacity-0"
      />

      <div className="h-[38px] rounded-t-[10px] flex items-center px-3 border-b border-white/10"
        style={{ background: `${color}22` }}
      >
        <div className="w-2.5 h-2.5 rounded-full shrink-0 mr-2" style={{ background: color }} />
        <span className="text-sm font-bold text-on-surface truncate">{data.label}</span>
      </div>

      <div>
        {visibleFields.map((field) => (
          <TableFieldRow key={field.name} field={field} focused={focused} />
        ))}
      </div>

      {fields.length > MINIMIZED_FIELDS && (
        <div
          className="flex h-7 cursor-pointer items-center justify-center border-t border-white/5 text-[10px] text-on-surface-variant/40 hover:text-on-surface-variant/60 hover:bg-white/[0.02] transition-colors rounded-b-[10px]"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <><ChevronUp className="w-3 h-3 mr-1" /> Show less</>
          ) : (
            <><ChevronDown className="w-3 h-3 mr-1" /> {fields.length - MINIMIZED_FIELDS} more</>
          )}
        </div>
      )}
    </div>
  );
}
