'use client';

import { useMemo } from 'react';

type Side = 'left' | 'right';

function markerId(text: string, side: Side, selected: boolean) {
  return `card_${text}_${side}_${selected ? 'sel' : 'def'}`;
}

export function getMarkerId(text: string, side: Side, selected: boolean) {
  return `url(#${markerId(text, side, selected)})`;
}

const variants: { text: string; side: Side; selected: boolean }[] = [];
for (const text of ['1', 'N']) {
  for (const side of ['left', 'right'] as Side[]) {
    for (const selected of [true, false]) {
      variants.push({ text, side, selected });
    }
  }
}

export default function MarkerDefinitions() {
  return (
    <svg className="absolute left-0 top-0 w-0 h-0 z-0">
      <defs>
        {variants.map(({ text, side, selected }) => (
          <marker
            key={markerId(text, side, selected)}
            id={markerId(text, side, selected)}
            viewBox="0 0 16 16"
            markerWidth="18"
            markerHeight="18"
            refX={side === 'left' ? 15 : 1}
            refY={8}
          >
            <circle
              cx={8}
              cy={8}
              r={6}
              fill={selected ? '#d6baff' : '#1c1b1d'}
              stroke={selected ? '#420089' : 'rgba(214,186,255,0.3)'}
              strokeWidth={1.5}
            />
            <text
              x={8}
              y={8.5}
              fontSize={7}
              fontWeight={700}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={selected ? '#420089' : '#d6baff'}
              fontFamily="monospace"
            >
              {text}
            </text>
          </marker>
        ))}
      </defs>
    </svg>
  );
}
