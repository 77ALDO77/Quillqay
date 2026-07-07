'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import EditorJS from '@editorjs/editorjs';
import Header from '@editorjs/header';
import List from '@editorjs/list';
import Checklist from '@editorjs/checklist';
import Code from '@editorjs/code';
import type { EditorConfig } from '@editorjs/editorjs';
import type { ToolConstructable } from '@editorjs/editorjs/types/tools';

import { Block } from '@/lib/api';

interface BlockEditorProps {
  initialData?: Block[];
  onChange?: (blocks: Block[]) => void;
  holderId?: string;
  readOnly?: boolean;
}

interface SimpleToolData {
  body?: string;
  title?: string;
}

interface SimpleToolConfig {
  bodyPlaceholder: string;
  title: string;
}

interface SimpleToolOptions {
  config?: SimpleToolConfig;
  data?: SimpleToolData;
}

const toolboxIcon = (label: string) => `<span style="font-weight:700;font-size:12px">${label}</span>`;

function createSimpleBlockTool(title: string, icon: string, bodyPlaceholder: string): ToolConstructable {
  return class SimpleBlockTool {
    private data: SimpleToolData;
    private config: SimpleToolConfig;

    static get toolbox() {
      return {
        title,
        icon,
      };
    }

    constructor({ data, config }: SimpleToolOptions = {}) {
      this.data = data || {};
      this.config = config || { title, bodyPlaceholder };
    }

    render() {
      const wrapper = document.createElement('div');
      const label = document.createElement('div');
      const body = document.createElement('div');

      wrapper.className = 'notion-placeholder-block';
      wrapper.dataset.tool = this.config.title;

      label.className = 'notion-placeholder-block__label';
      label.textContent = this.config.title;

      body.className = 'notion-placeholder-block__body';
      body.contentEditable = 'true';
      body.dataset.placeholder = this.config.bodyPlaceholder;
      body.textContent = this.data.body || '';

      wrapper.append(label, body);
      return wrapper;
    }

    save(block: HTMLElement): SimpleToolData {
      const body = block.querySelector<HTMLElement>('.notion-placeholder-block__body');

      return {
        title: this.config.title,
        body: body?.innerText || '',
      };
    }
  };
}

const placeholderTools = {
  subpage: createSimpleBlockTool('Page', toolboxIcon('PG'), 'Subpage title'),
  toggle: createSimpleBlockTool('Toggle list', toolboxIcon('TG'), 'Toggle content'),
  quote: createSimpleBlockTool('Quote', toolboxIcon('QT'), 'Quote'),
  divider: createSimpleBlockTool('Divider', toolboxIcon('HR'), 'Divider'),
  pageLink: createSimpleBlockTool('Link to page', toolboxIcon('@'), 'Paste or search page'),
  callout: createSimpleBlockTool('Callout', toolboxIcon('!'), 'Callout content'),
  table: createSimpleBlockTool('Table', toolboxIcon('TB'), 'Table placeholder'),
  kanban: createSimpleBlockTool('Board', toolboxIcon('KB'), 'Kanban board placeholder'),
  gallery: createSimpleBlockTool('Gallery', toolboxIcon('GL'), 'Gallery placeholder'),
  databaseList: createSimpleBlockTool('Database list', toolboxIcon('LS'), 'List database placeholder'),
  calendar: createSimpleBlockTool('Calendar', toolboxIcon('CA'), 'Calendar placeholder'),
  timeline: createSimpleBlockTool('Timeline', toolboxIcon('TL'), 'Timeline placeholder'),
  image: createSimpleBlockTool('Image', toolboxIcon('IM'), 'Image URL or caption'),
  bookmark: createSimpleBlockTool('Web bookmark', toolboxIcon('BM'), 'Paste a link'),
  video: createSimpleBlockTool('Video', toolboxIcon('VD'), 'Video URL'),
  audio: createSimpleBlockTool('Audio', toolboxIcon('AU'), 'Audio URL'),
  file: createSimpleBlockTool('File', toolboxIcon('FL'), 'Attachment name or URL'),
  toc: createSimpleBlockTool('Table of contents', toolboxIcon('TOC'), 'Generated from headings'),
  equation: createSimpleBlockTool('Equation', toolboxIcon('EQ'), 'LaTeX equation'),
  button: createSimpleBlockTool('Button', toolboxIcon('BT'), 'Automation button'),
  synced: createSimpleBlockTool('Synced block', toolboxIcon('SYNC'), 'Synced content'),
  breadcrumb: createSimpleBlockTool('Breadcrumb', toolboxIcon('BC'), 'Breadcrumb path'),
  embed: createSimpleBlockTool('Embed', toolboxIcon('<>'), 'Embeddable link'),
  driveEmbed: createSimpleBlockTool('Google Drive', toolboxIcon('GD'), 'Drive link'),
  figmaEmbed: createSimpleBlockTool('Figma', toolboxIcon('FG'), 'Figma link'),
  githubEmbed: createSimpleBlockTool('GitHub', toolboxIcon('GH'), 'GitHub link'),
  pdfEmbed: createSimpleBlockTool('PDF', toolboxIcon('PDF'), 'PDF link'),
  loomEmbed: createSimpleBlockTool('Loom', toolboxIcon('LM'), 'Loom link'),
  spotifyEmbed: createSimpleBlockTool('Spotify', toolboxIcon('SP'), 'Spotify link'),
  aiWrite: createSimpleBlockTool('AI write', toolboxIcon('AI'), 'Prompt'),
  aiSummarize: createSimpleBlockTool('AI summarize', toolboxIcon('AI'), 'Summary prompt'),
  aiTranslate: createSimpleBlockTool('AI translate', toolboxIcon('AI'), 'Target language'),
  aiImprove: createSimpleBlockTool('AI improve writing', toolboxIcon('AI'), 'Text to improve'),
};

const BlockEditor: React.FC<BlockEditorProps> = ({
  initialData,
  onChange,
  holderId = 'editorjs',
  readOnly = false,
}) => {
  const ref = useRef<EditorJS | null>(null);
  const onChangeRef = useRef(onChange);
  const initialDataRef = useRef(initialData);

  const tools = useMemo<EditorConfig['tools']>(() => ({
    h1: {
      class: Header,
      config: {
        placeholder: 'Document title',
        levels: [1],
        defaultLevel: 1,
      },
      inlineToolbar: true,
      toolbox: {
        title: 'H1',
        icon: toolboxIcon('H1'),
      },
    },
    h2: {
      class: Header,
      config: {
        placeholder: 'Heading',
        levels: [2],
        defaultLevel: 2,
      },
      inlineToolbar: true,
      toolbox: {
        title: 'H2',
        icon: toolboxIcon('H2'),
      },
      shortcut: 'CMD+SHIFT+H',
    },
    h3: {
      class: Header,
      config: {
        placeholder: 'Heading',
        levels: [3],
        defaultLevel: 3,
      },
      inlineToolbar: true,
      toolbox: {
        title: 'H3',
        icon: toolboxIcon('H3'),
      },
    },
    h4: {
      class: Header,
      config: {
        placeholder: 'Heading',
        levels: [4],
        defaultLevel: 4,
      },
      inlineToolbar: true,
      toolbox: {
        title: 'H4',
        icon: toolboxIcon('H4'),
      },
    },
    bulletedList: {
      class: List,
      inlineToolbar: true,
      shortcut: 'CMD+SHIFT+L',
      config: {
        defaultStyle: 'unordered',
      },
      toolbox: {
        title: 'Bulleted list',
        icon: toolboxIcon('UL'),
      },
    },
    numberedList: {
      class: List,
      inlineToolbar: true,
      config: {
        defaultStyle: 'ordered',
      },
      toolbox: {
        title: 'Numbered list',
        icon: toolboxIcon('OL'),
      },
    },
    checklistTool: {
      class: Checklist,
      inlineToolbar: true,
      shortcut: 'CMD+SHIFT+C',
    },
    code: {
      class: Code,
      shortcut: 'CMD+SHIFT+K',
    },
    ...placeholderTools,
  }), []);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!ref.current) {
      const editor = new EditorJS({
        holder: holderId,
        readOnly,
        placeholder: "Type '/' for blocks, or start writing in Markdown style...",
        tools,
        inlineToolbar: true,
        data: {
          time: Date.now(),
          version: '2.30',
          blocks: initialDataRef.current || [],
        },
        onChange: async () => {
          if (onChangeRef.current) {
            const content = await editor.save();
            onChangeRef.current(content.blocks as unknown as Block[]);
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
  }, [holderId, readOnly, tools]);

  return (
    <div className="document-editor-shell min-h-full w-full">
      <div
        id={holderId}
        className="min-h-[calc(100vh-260px)] px-2 py-2 md:px-8 md:py-7"
      />
    </div>
  );
};

export default BlockEditor;
