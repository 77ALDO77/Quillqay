'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { setupDBMLLanguage } from '@/lib/dbml-language';

const MonacoEditor = dynamic(
  () => import('@monaco-editor/react').then((mod) => {
    function Wrapped({ value, onChange }: { value: string; onChange: (value: string | undefined) => void }) {
      return (
        <div className="flex-1 rounded-xl overflow-hidden border border-white/10 mx-3 mb-3" style={{ minHeight: 0 }}>
          <mod.default
            value={value}
            onChange={onChange}
            language="dbml"
            theme="dbml-dark"
            beforeMount={setupDBMLLanguage}
            options={{
              minimap: { enabled: false },
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              fontSize: 12,
              fontFamily: '"JetBrains Mono", "Fira Code", monospace',
              padding: { top: 12, bottom: 12 },
              renderWhitespace: 'selection',
              automaticLayout: true,
              tabSize: 2,
            }}
          />
        </div>
      );
    }
    Wrapped.displayName = 'MonacoDBMLWrapper';
    return Wrapped;
  }),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center bg-surface-container-low rounded-xl mx-3 mb-3">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    ),
  }
);

export default MonacoEditor;
