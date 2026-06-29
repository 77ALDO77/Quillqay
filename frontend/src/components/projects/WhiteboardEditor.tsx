'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import '@excalidraw/excalidraw/index.css';

const Excalidraw = dynamic(
  () => import('@excalidraw/excalidraw').then((mod) => {
    function Wrapped() {
      return (
        <>
          <style>{`
.excalidraw.theme--dark {
  --default-bg-color: #131315;
  --island-bg-color: #1c1b1d;
  --button-gray-1: #1c1b1d;
  --button-gray-2: #201f21;
  --button-gray-3: #2a2a2c;
  --input-bg-color: #0e0e10;
  --input-border-color: rgba(255,255,255,0.1);
  --input-hover-bg-color: #1c1b1d;
  --color-primary: #d6baff;
  --color-primary-darker: #c4a8f0;
  --color-primary-darkest: #b08adf;
  --color-primary-hover: #e0c8ff;
  --color-surface-high: #2a2a2c;
  --color-surface-low: #1c1b1d;
  --color-surface-mid: #201f21;
  --color-surface-lowest: #0e0e10;
  --color-on-surface: #e5e1e4;
  --color-border-outline: #968da0;
  --color-border-outline-variant: #4b4454;
  --color-danger: #ffb4ab;
  --color-danger-background: #93000a;
  --color-danger-color: #ffdad6;
  --color-danger-icon-color: #ffb4ab;
  --color-disabled: #4b4454;
  --color-logo-text: #d6baff;
  --popup-secondary-bg-color: #0e0e10;
  --popup-text-color: #cdc2d7;
  --focus-highlight-color: #d6baff;
  --select-highlight-color: #d6baff;
  --color-icon-white: #e5e1e4;
  --overlay-bg-color: rgba(0,0,0,0.6);
}
          `}</style>
          <mod.Excalidraw
            theme="dark"
            viewModeEnabled={false}
            zenModeEnabled={false}
            UIOptions={{
              canvasActions: {
                export: false,
                loadScene: false,
                saveToActiveFile: false,
              },
            }}
          />
        </>
      );
    }
    Wrapped.displayName = 'ExcalidrawWrapper';
    return Wrapped;
  }),
  { ssr: false }
);

export default function WhiteboardEditor() {
  return (
    <div className="w-full h-full">
      <Excalidraw />
    </div>
  );
}
