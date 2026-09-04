import type { TableDef, ColumnDef } from '@/types/db-schema';

let counter = 0;
function nextId(): string {
  return `t${++counter}`;
}
function resetCounter() { counter = 0; }

export function parseSchemaJson(input: string): TableDef[] {
  const parsed = JSON.parse(input);
  const rawTables = Array.isArray(parsed) ? parsed : parsed.tables;
  if (!Array.isArray(rawTables)) throw new Error('Expected an array of tables or { tables: [...] }');

  resetCounter();
  return rawTables.map((t: Record<string, unknown>) => ({
    id: nextId(),
    name: (t.name || t.table) as string,
    columns: ((t.columns || []) as Record<string, unknown>[]).map((c) => {
      const ref = c.references;
      return {
        name: c.name as string,
        type: ((c.type || '') as string).toUpperCase(),
        isPK: !!(c.isPK || c.isPrimaryKey || c.primaryKey),
        isFK: !!(c.isFK || c.isForeignKey || c.foreignKey || c.references),
        nullable: c.nullable !== false,
        references: ref ? { table: ((ref as Record<string, string>).table || ref) as string, column: ((ref as Record<string, string>).column || 'id') } : undefined,
      };
    }),
  }));
}

const sqlClean = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/--[^\n]*/g, '').trim();

const typeMap: Record<string, string> = {
  int: 'INTEGER',
  integer: 'INTEGER',
  'smallint': 'SMALLINT',
  'bigint': 'BIGINT',
  serial: 'SERIAL',
  'bigserial': 'BIGSERIAL',
  varchar: 'VARCHAR',
  char: 'CHAR',
  text: 'TEXT',
  boolean: 'BOOLEAN',
  bool: 'BOOLEAN',
  float: 'FLOAT',
  double: 'DOUBLE',
  decimal: 'DECIMAL',
  numeric: 'NUMERIC',
  date: 'DATE',
  timestamp: 'TIMESTAMP',
  timestamptz: 'TIMESTAMPTZ',
  time: 'TIME',
  uuid: 'UUID',
  json: 'JSON',
  jsonb: 'JSONB',
  bytea: 'BYTEA',
};

function normalizeType(raw: string): string {
  const upper = raw.replace(/\(.*?\)/, '').trim().toUpperCase();
  const base = upper.split(' ')[0];
  const len = raw.match(/\((\d+)\)/);
  const suffix = len ? `(${len[1]})` : '';
  return typeMap[base.toLowerCase()] || base + suffix;
}

export function parseSchemaSql(input: string): TableDef[] {
  const clean = sqlClean(input);
  const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?(\w+)\s*\(([\s\S]*?)\)\s*;/gi;

  resetCounter();
  const tables: TableDef[] = [];
  let match;

  while ((match = tableRegex.exec(clean)) !== null) {
    const tableName = match[1];
    const body = match[2];

    const pkColumns = new Set<string>();
    const refs: Array<{ col: string; table: string; refCol: string }> = [];

    const tablePkMatch = body.match(/PRIMARY\s+KEY\s*\(([^)]+)\)/i);
    if (tablePkMatch) {
      tablePkMatch[1].split(',').forEach((c) => pkColumns.add(c.trim()));
    }

    const lineRegex = /(?:CONSTRAINT\s+\w+\s+)?FOREIGN\s+KEY\s*\((\w+)\)\s*REFERENCES\s+(\w+)\s*\((\w+)\)/gi;
    let refMatch;
    while ((refMatch = lineRegex.exec(body)) !== null) {
      refs.push({ col: refMatch[1], table: refMatch[2], refCol: refMatch[3] });
    }

    const columnLines = body
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.toUpperCase().startsWith('PRIMARY') && !l.toUpperCase().startsWith('FOREIGN') && !l.toUpperCase().startsWith('CONSTRAINT') && !l.toUpperCase().startsWith('UNIQUE') && !l.toUpperCase().startsWith('INDEX') && !l.toUpperCase().startsWith('CHECK'))
      .join(' ')
      .replace(/\s+/g, ' ')
      .split(',')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const columns: ColumnDef[] = [];

    for (const line of columnLines) {
      const parts = line.split(/\s+/);
      if (parts.length < 2) continue;
      const colName = parts[0];
      const rest = parts.slice(1).join(' ');

      let colType = rest;
      let nullable = true;
      let isPK = false;
      let isFK = false;
      let refTable = '';
      let refCol = 'id';

      if (/PRIMARY\s+KEY/i.test(colType)) {
        isPK = true;
        pkColumns.add(colName);
        colType = colType.replace(/PRIMARY\s+KEY/i, '').trim();
      }
      if (pkColumns.has(colName)) isPK = true;

      if (/NOT\s+NULL/i.test(colType)) {
        nullable = false;
        colType = colType.replace(/NOT\s+NULL/i, '').trim();
      }

      const refMatch = colType.match(/REFERENCES\s+(\w+)\s*(?:\((\w+)\))?/i);
      if (refMatch) {
        isFK = true;
        refTable = refMatch[1];
        refCol = refMatch[2] || 'id';
        colType = colType.replace(/REFERENCES\s+\w+\s*(?:\(\w+\))?/i, '').trim();
      }

      const fkMatch = refs.find((r) => r.col === colName);
      if (fkMatch) {
        isFK = true;
        refTable = fkMatch.table;
        refCol = fkMatch.refCol;
      }

      colType = colType.replace(/DEFAULT\s+\S+/gi, '').trim();
      colType = colType.replace(/UNIQUE/i, '').trim();
      colType = colType.replace(/CHECK\s*\([^)]*\)/gi, '').trim();

      columns.push({
        name: colName,
        type: normalizeType(colType),
        isPK,
        isFK,
        nullable,
        references: isFK ? { table: refTable, column: refCol } : undefined,
      });
    }

    tables.push({ id: nextId(), name: tableName, columns });
  }

  return tables;
}

export function parseSchemaDbml(input: string): { tables: TableDef[]; refs: Array<{ srcTable: string; srcField: string; tgtTable: string; tgtField: string }> } {
  const clean = input.replace(/\/\/.*$/gm, '').trim();
  const tables: TableDef[] = [];
  const refs: Array<{ srcTable: string; srcField: string; tgtTable: string; tgtField: string }> = [];
  resetCounter();

  const tableRegex = /Table\s+(\w+)\s*\{([^}]*)\}/gi;
  let match;

  while ((match = tableRegex.exec(clean)) !== null) {
    const tableName = match[1];
    const body = match[2].trim();
    const columns: ColumnDef[] = [];

    const colLines = body.split('\n').map((l) => l.trim()).filter((l) => l);
    for (const line of colLines) {
      const parts = line.split(/\s+/);
      if (parts.length < 2) continue;
      const colName = parts[0];
      const rest = parts.slice(1);
      let colType = rest[0] || '';
      let isPK = false;
      let isFK = false;
      let nullable = true;

      const constraints = rest.slice(1).join(' ').toLowerCase();
      if (constraints.includes('pk')) isPK = true;
      if (constraints.includes('ref')) isFK = true;
      if (constraints.includes('not null')) nullable = false;

      colType = colType.replace(/\(.*?\)/, (m) => m).toUpperCase();

      columns.push({ name: colName, type: colType, isPK, isFK, nullable });
    }

    tables.push({ id: nextId(), name: tableName, columns });
  }

  const refRegex = /Ref:\s*(\w+)\.(\w+)\s*>\s*(\w+)\.(\w+)/gi;
  while ((match = refRegex.exec(clean)) !== null) {
    refs.push({ srcTable: match[1], srcField: match[2], tgtTable: match[3], tgtField: match[4] });
  }

  return { tables, refs };
}

export const demoSchemas: Array<{ label: string; tables: TableDef[] }> = [
  {
    label: 'Current Project',
    tables: [
      { id: nextId(), name: 'pages', columns: [
        { name: 'id', type: 'UUID', isPK: true, isFK: false, nullable: false },
        { name: 'parent_id', type: 'UUID', isPK: false, isFK: true, nullable: true, references: { table: 'pages', column: 'id' } },
        { name: 'title', type: 'TEXT', isPK: false, isFK: false, nullable: false },
        { name: 'created_at', type: 'TIMESTAMPTZ', isPK: false, isFK: false, nullable: false },
        { name: 'updated_at', type: 'TIMESTAMPTZ', isPK: false, isFK: false, nullable: false },
      ] },
      { id: nextId(), name: 'blocks', columns: [
        { name: 'id', type: 'TEXT', isPK: true, isFK: false, nullable: false },
        { name: 'page_id', type: 'UUID', isPK: false, isFK: true, nullable: false, references: { table: 'pages', column: 'id' } },
        { name: 'data', type: 'JSONB', isPK: false, isFK: false, nullable: false },
      ] },
    ],
  },
  {
    label: 'E-Commerce',
    tables: [
      { id: nextId(), name: 'users', columns: [
        { name: 'id', type: 'UUID', isPK: true, isFK: false, nullable: false },
        { name: 'email', type: 'VARCHAR(255)', isPK: false, isFK: false, nullable: false },
        { name: 'name', type: 'VARCHAR(255)', isPK: false, isFK: false, nullable: false },
        { name: 'created_at', type: 'TIMESTAMPTZ', isPK: false, isFK: false, nullable: false },
      ] },
      { id: nextId(), name: 'products', columns: [
        { name: 'id', type: 'UUID', isPK: true, isFK: false, nullable: false },
        { name: 'name', type: 'VARCHAR(255)', isPK: false, isFK: false, nullable: false },
        { name: 'price', type: 'DECIMAL(10,2)', isPK: false, isFK: false, nullable: false },
        { name: 'stock', type: 'INTEGER', isPK: false, isFK: false, nullable: false },
        { name: 'category_id', type: 'UUID', isPK: false, isFK: true, nullable: true, references: { table: 'categories', column: 'id' } },
      ] },
      { id: nextId(), name: 'categories', columns: [
        { name: 'id', type: 'UUID', isPK: true, isFK: false, nullable: false },
        { name: 'name', type: 'VARCHAR(255)', isPK: false, isFK: false, nullable: false },
      ] },
      { id: nextId(), name: 'orders', columns: [
        { name: 'id', type: 'UUID', isPK: true, isFK: false, nullable: false },
        { name: 'user_id', type: 'UUID', isPK: false, isFK: true, nullable: false, references: { table: 'users', column: 'id' } },
        { name: 'total', type: 'DECIMAL(10,2)', isPK: false, isFK: false, nullable: false },
        { name: 'status', type: 'VARCHAR(50)', isPK: false, isFK: false, nullable: false },
        { name: 'created_at', type: 'TIMESTAMPTZ', isPK: false, isFK: false, nullable: false },
      ] },
      { id: nextId(), name: 'order_items', columns: [
        { name: 'id', type: 'UUID', isPK: true, isFK: false, nullable: false },
        { name: 'order_id', type: 'UUID', isPK: false, isFK: true, nullable: false, references: { table: 'orders', column: 'id' } },
        { name: 'product_id', type: 'UUID', isPK: false, isFK: true, nullable: false, references: { table: 'products', column: 'id' } },
        { name: 'quantity', type: 'INTEGER', isPK: false, isFK: false, nullable: false },
        { name: 'price', type: 'DECIMAL(10,2)', isPK: false, isFK: false, nullable: false },
      ] },
    ],
  },
  {
    label: 'Blog',
    tables: [
      { id: nextId(), name: 'posts', columns: [
        { name: 'id', type: 'UUID', isPK: true, isFK: false, nullable: false },
        { name: 'title', type: 'VARCHAR(255)', isPK: false, isFK: false, nullable: false },
        { name: 'slug', type: 'VARCHAR(255)', isPK: false, isFK: false, nullable: false },
        { name: 'content', type: 'TEXT', isPK: false, isFK: false, nullable: false },
        { name: 'author_id', type: 'UUID', isPK: false, isFK: true, nullable: false, references: { table: 'authors', column: 'id' } },
        { name: 'published_at', type: 'TIMESTAMPTZ', isPK: false, isFK: false, nullable: true },
      ] },
      { id: nextId(), name: 'authors', columns: [
        { name: 'id', type: 'UUID', isPK: true, isFK: false, nullable: false },
        { name: 'name', type: 'VARCHAR(255)', isPK: false, isFK: false, nullable: false },
        { name: 'email', type: 'VARCHAR(255)', isPK: false, isFK: false, nullable: false },
      ] },
      { id: nextId(), name: 'comments', columns: [
        { name: 'id', type: 'UUID', isPK: true, isFK: false, nullable: false },
        { name: 'post_id', type: 'UUID', isPK: false, isFK: true, nullable: false, references: { table: 'posts', column: 'id' } },
        { name: 'author', type: 'VARCHAR(255)', isPK: false, isFK: false, nullable: false },
        { name: 'body', type: 'TEXT', isPK: false, isFK: false, nullable: false },
        { name: 'created_at', type: 'TIMESTAMPTZ', isPK: false, isFK: false, nullable: false },
      ] },
      { id: nextId(), name: 'tags', columns: [
        { name: 'id', type: 'UUID', isPK: true, isFK: false, nullable: false },
        { name: 'name', type: 'VARCHAR(100)', isPK: false, isFK: false, nullable: false },
      ] },
      { id: nextId(), name: 'post_tags', columns: [
        { name: 'post_id', type: 'UUID', isPK: true, isFK: true, nullable: false, references: { table: 'posts', column: 'id' } },
        { name: 'tag_id', type: 'UUID', isPK: true, isFK: true, nullable: false, references: { table: 'tags', column: 'id' } },
      ] },
    ],
  },
];
