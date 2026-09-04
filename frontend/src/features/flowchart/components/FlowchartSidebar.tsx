'use client';

import { type DragEvent } from 'react';
import type { FlowNodeType } from './FlowchartEditor';
import { Play, Square, Diamond, ArrowLeftRight, StopCircle } from 'lucide-react';

interface PaletteItem {
  type: FlowNodeType;
  label: string;
  icon: typeof Play;
  color: string;
}

const paletteItems: PaletteItem[] = [
  { type: 'start', label: 'Start', icon: Play, color: 'text-emerald-400' },
  { type: 'process', label: 'Process', icon: Square, color: 'text-sky-400' },
  { type: 'decision', label: 'Decision', icon: Diamond, color: 'text-amber-400' },
  { type: 'io', label: 'Input/Output', icon: ArrowLeftRight, color: 'text-violet-400' },
  { type: 'end', label: 'End', icon: StopCircle, color: 'text-rose-400' },
];

export default function FlowchartSidebar() {
  const onDragStart = (event: DragEvent, nodeType: FlowNodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="h-full flex flex-col">
      {/* Palette header */}
      <div className="px-4 pt-4 pb-3 border-b border-white/[0.06]">
        <h3 className="text-xs font-semibold text-on-surface-variant/60 uppercase tracking-wider">Nodes</h3>
      </div>

      {/* Draggable palette */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
        {paletteItems.map((item) => (
          <div
            key={item.type}
            draggable
            onDragStart={(e) => onDragStart(e, item.type)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-white/10 bg-surface-container-low/50 hover:bg-surface-container-low hover:border-primary/30 transition-all cursor-grab active:cursor-grabbing select-none"
          >
            <item.icon className={`w-4 h-4 ${item.color}`} />
            <span className="text-xs font-medium text-on-surface-variant/80">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Instructions */}
      <div className="px-4 py-3 border-t border-white/[0.06]">
        <p className="text-[10px] text-on-surface-variant/30 leading-relaxed">
          Drag nodes onto the canvas. Connect them by dragging from handles.
        </p>
      </div>
    </div>
  );
}
