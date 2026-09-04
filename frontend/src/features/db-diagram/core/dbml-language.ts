import type { Monaco } from '@monaco-editor/react';

const dataTypes = [
  'INT', 'INTEGER', 'SMALLINT', 'BIGINT', 'SERIAL', 'BIGSERIAL',
  'VARCHAR', 'CHAR', 'TEXT', 'BOOLEAN', 'FLOAT', 'DOUBLE', 'DECIMAL', 'NUMERIC',
  'DATE', 'TIME', 'TIMESTAMP', 'TIMESTAMPTZ', 'UUID', 'JSON', 'JSONB', 'BYTEA',
];

export function setupDBMLLanguage(monaco: Monaco) {
  monaco.languages.register({ id: 'dbml' });

  monaco.editor.defineTheme('dbml-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6A9955' },
      { token: 'keyword', foreground: '569CD6' },
      { token: 'annotation', foreground: '9CDCFE' },
      { token: 'delimiter', foreground: 'D4D4D4' },
      { token: 'type', foreground: '4EC9B0' },
      { token: 'identifier', foreground: 'CE9178' },
    ],
    colors: {},
  });

  monaco.languages.setLanguageConfiguration('dbml', {
    brackets: [
      ['{', '}'],
      ['[', ']'],
      ['(', ')'],
    ],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"', notIn: ['string'] },
      { open: "'", close: "'", notIn: ['string'] },
    ],
    comments: { lineComment: '//' },
  });

  monaco.languages.setMonarchTokensProvider('dbml', {
    keywords: ['Table', 'Ref', 'Note', 'Enum', 'enum'],
    datatypes: dataTypes,
    operators: ['>', '<', '-'],

    tokenizer: {
      root: [
        [/\/\/.*$/, 'comment'],
        [/\/\*/, 'comment', '@comment'],
        [/['"`].*?['"`]/, 'string'],
        [/\[.*?\]/, 'annotation'],
        [/\b(Table|Ref|Note|Enum|enum)\b/, 'keyword'],
        [/\b\d+\b/, 'number'],
        [/[{}(),;]/, 'delimiter'],
        [/[><-]/, 'operator'],
        [/@?\w+(?:\(.*?\))?/, { cases: { '@datatypes': 'type', '@default': 'identifier' } }],
        [/\s+/, 'white'],
      ],
      comment: [
        [/[^/*]+/, 'comment'],
        [/\*\//, 'comment', '@pop'],
        [/[/*]/, 'comment'],
      ],
    },
  });
}
