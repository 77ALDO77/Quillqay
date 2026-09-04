'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Table2, GitBranch, Upload, Pencil, Copy, Trash2 } from 'lucide-react';

export interface ContextMenuAction {
  id: string;
  label: string;
  icon: typeof Table2;
  danger?: boolean;
  onSelect: () => void;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuAction[];
  onClose: () => void;
}

export default function DbCanvasContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleClick = () => onClose();
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  if (!mounted) return null;

  const menuX = Math.min(x, window.innerWidth - 220);
  const menuY = Math.min(y, window.innerHeight - items.length * 36 - 40);

  return createPortal(
    <div
      className="fixed inset-0 z-40"
      onClick={onClose}
    >
      <div
        className="absolute rounded-xl border border-white/[0.12] bg-surface-container/95 backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.5)] overflow-hidden py-1 min-w-[180px]"
        style={{ left: menuX, top: menuY }}
        onClick={(e) => e.stopPropagation()}
      >
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => { item.onSelect(); onClose(); }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors text-left ${
              item.danger
                ? 'text-error hover:bg-error/10'
                : 'text-on-surface-variant/80 hover:bg-white/[0.04] hover:text-on-surface'
            }`}
          >
            <item.icon className="w-4 h-4 shrink-0" />
            {item.label}
          </button>
        ))}
      </div>
    </div>,
    document.body
  );
}
