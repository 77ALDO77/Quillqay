import type { TableDef, RelationshipDef } from '@/types/db-schema';

function quote(name: string): string {
  return `"${name}"`;
}

function mapType(rawType: string): string {
  const upper = rawType.toUpperCase().replace(/\(.*?\)/, '').trim();
  const len = rawType.match(/\((\d+(?:,\s*\d+)?)\)/);
  const suffix = len ? `(${len[1]})` : '';

  const typeMap: Record<string, string> = {
    INTEGER: 'INTEGER', INT: 'INTEGER', SMALLINT: 'SMALLINT', BIGINT: 'BIGINT',
    SERIAL: 'SERIAL', BIGSERIAL: 'BIGSERIAL',
    VARCHAR: 'VARCHAR', CHAR: 'CHAR', TEXT: 'TEXT',
    BOOLEAN: 'BOOLEAN', BOOL: 'BOOLEAN',
    FLOAT: 'FLOAT', DOUBLE: 'DOUBLE PRECISION', DECIMAL: 'DECIMAL', NUMERIC: 'NUMERIC',
    DATE: 'DATE', TIME: 'TIME', TIMESTAMP: 'TIMESTAMP', TIMESTAMPTZ: 'TIMESTAMPTZ',
    UUID: 'UUID', JSON: 'JSON', JSONB: 'JSONB', BYTEA: 'BYTEA',
  };

  return `${typeMap[upper] || upper}${suffix}`;
}

export function exportSQL(tables: TableDef[], relationships: RelationshipDef[]): string {
  const lines: string[] = [];

  for (const table of tables) {
    const pkColumns = table.columns.filter((c) => c.isPK);

    lines.push(`CREATE TABLE ${quote(table.name)} (`);
    const colDefs: string[] = [];

    for (const col of table.columns) {
      let def = `  ${quote(col.name)} ${mapType(col.type)}`;
      if (!col.nullable) def += ' NOT NULL';
      if (col.isPK && pkColumns.length === 1) def += ' PRIMARY KEY';
      colDefs.push(def);
    }

    // Composite PK
    if (pkColumns.length > 1) {
      colDefs.push(`  PRIMARY KEY (${pkColumns.map((c) => quote(c.name)).join(', ')})`);
    }

    lines.push(colDefs.join(',\n'));
    lines.push(');\n');
  }

  // Foreign keys
  for (const rel of relationships) {
    const srcTable = tables.find((t) => t.name === rel.sourceTable);
    const tgtTable = tables.find((t) => t.name === rel.targetTable);
    if (srcTable && tgtTable) {
      const fkName = `fk_${rel.sourceTable}_${rel.sourceField}`;
      lines.push(
        `ALTER TABLE ${quote(rel.sourceTable)} ADD CONSTRAINT ${quote(fkName)} ` +
        `FOREIGN KEY (${quote(rel.sourceField)}) REFERENCES ${quote(rel.targetTable)}(${quote(rel.targetField)});`
      );
    }
  }

  return lines.join('\n');
}

export function exportDDL(tables: TableDef[]): string {
  return exportSQL(tables, []);
}
