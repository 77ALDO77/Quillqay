import React, { Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';
import { setupDBMLLanguage } from '@/lib/dbml-language';

const LazyMonaco = lazy(() =>
  import('@monaco-editor/react').then((mod) => ({
    default: mod.default,
  }))
);

interface Props {
  value: string;
  onChange: (value: string | undefined) => void;
}

export default function DbmlEditor({ value, onChange }: Props) {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center bg-surface-container-low rounded-xl mx-3 mb-3">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      }
    >
      <div className="flex-1 rounded-xl overflow-hidden border border-white/10 mx-3 mb-3" style={{ minHeight: 0 }}>
        <LazyMonaco
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
    </Suspense>
  );
}
