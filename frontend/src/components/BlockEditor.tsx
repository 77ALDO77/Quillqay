'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import EditorJS, { OutputData } from '@editorjs/editorjs';
// Plugins lack official types mostly, requiring @ts-ignore or custom declarations
// @ts-ignore
import Header from '@editorjs/header';
// @ts-ignore
import List from '@editorjs/list';
// @ts-ignore
import Checklist from '@editorjs/checklist';
// @ts-ignore
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
    readOnly = false
}) => {
    const ref = useRef<EditorJS | null>(null);

    // Initialize Editor
    useEffect(() => {
        if (!ref.current) {
            const editor = new EditorJS({
                holder: holderId,
                readOnly,
                placeholder: 'Start writing your amazing notes...',
                tools: {
                    header: {
                        class: Header,
                        config: {
                            placeholder: 'Enter a header',
                            levels: [1, 2, 3],
                            defaultLevel: 2
                        }
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
                },
                data: {
                    time: Date.now(),
                    version: '2.30',
                    blocks: initialData || []
                },
                onChange: async (api, event) => {
                    if (onChange) {
                        const content = await api.saver.save();
                        // Cast EditorJS blocks to our Block interface
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
    }, []); // Run once on mount

    return (
        <div className="prose prose-invert max-w-none w-full">
            <div id={holderId} className="min-h-[500px] bg-gray-900/50 rounded-xl p-8 border border-gray-800" />
        </div>
    );
};

export default BlockEditor;
