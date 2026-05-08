'use client';

import React, { useEffect, useRef } from 'react';
import EditorJS from '@editorjs/editorjs';
// @ts-expect-error - no TS declarations available
import Header from '@editorjs/header';
// @ts-expect-error - no TS declarations available
import List from '@editorjs/list';
// @ts-expect-error - no TS declarations available
import Checklist from '@editorjs/checklist';
// @ts-expect-error - no TS declarations available
import Code from '@editorjs/code';

import { Block } from '@/lib/api';

interface BlockEditorProps {
  initialData?: Block[];
  onChange?: (blocks: Block[]) => void;
  holderId?: string;
  readOnly?: boolean;
}

const BlockEditor: React.FC<BlockEditorProps> = ({
  initialData,
  onChange,
  holderId = 'editorjs',
  readOnly = false,
}) => {
  const ref = useRef<EditorJS | null>(null);

  // @ts-expect-error - Editor.js tools type is complex, using any for flexibility
  const tools: any = {
    header: {
      class: Header,
      config: {
        placeholder: 'Enter a header',
        levels: [1, 2, 3],
        defaultLevel: 2,
      },
    },
    list: {
      class: List,
      inlineToolbar: true,
    },
    checklistTool: {
      class: Checklist,
      inlineToolbar: true,
    },
    code: Code,
  };

  useEffect(() => {
    if (!ref.current) {
      const editor = new EditorJS({
        holder: holderId,
        readOnly,
        placeholder: 'Start writing your amazing notes...',
        tools,
        data: {
          time: Date.now(),
          version: '2.30',
          blocks: initialData || [],
        },
        onChange: async () => {
          if (onChange) {
            const content = await editor.save();
            onChange(content.blocks as any);
          }
        },
      });
      ref.current = editor;
    }

    return () => {
      if (ref.current && ref.current.destroy) {
        ref.current.destroy();
        ref.current = null;
      }
    };
    // Intentionally empty deps: EditorJS instance must be created once on mount.
    // Changing holderId, readOnly, or initialData after mount would require full
    // editor re-initialization which EditorJS does not support reactively.
  }, []);

  return (
    <div className="prose prose-invert max-w-none w-full">
      <div
        id={holderId}
        className="min-h-[500px] bg-surface-container-lowest rounded-2xl p-6 md:p-8 border border-white/10"
      />
    </div>
  );
};

export default BlockEditor;
