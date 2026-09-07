import type { TableDef, ColumnDef, RelationshipDef, SqlDialect, ParsedSchemaResult } from './types';

let tableCounter = 0;
let relCounter = 0;

function nextTableId(): string {
  return `t${++tableCounter}`;
}

function nextRelId(): string {
  return `rel_${++relCounter}`;
}

export function resetParserCounters() {
  tableCounter = 0;
  relCounter = 0;
}

export interface DialectOption {
  id: SqlDialect;
  name: string;
  badge: string;
  accentColor: string;
  placeholder: string;
  sampleDdl: string;
}

export const DIALECT_OPTIONS: DialectOption[] = [
  {
    id: 'postgres',
    name: 'PostgreSQL',
    badge: 'PG',
    accentColor: '#336791',
    placeholder: 'CREATE TABLE users (\n  id SERIAL PRIMARY KEY,\n  email VARCHAR(255) NOT NULL UNIQUE\n);',
    sampleDdl: `-- PostgreSQL Schema
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  avatar_url VARCHAR(500),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  total_amount NUMERIC(12, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_name VARCHAR(150) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10, 2) NOT NULL
);`,
  },
  {
    id: 'mysql',
    name: 'MySQL',
    badge: 'MY',
    accentColor: '#00758F',
    placeholder: 'CREATE TABLE `users` (\n  `id` INT AUTO_INCREMENT PRIMARY KEY,\n  `email` VARCHAR(255) NOT NULL\n) ENGINE=InnoDB;',
    sampleDdl: `-- MySQL Schema
CREATE TABLE \`users\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`username\` VARCHAR(50) NOT NULL UNIQUE,
  \`email\` VARCHAR(255) NOT NULL UNIQUE,
  \`is_active\` TINYINT(1) DEFAULT 1,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE \`profiles\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`user_id\` INT NOT NULL,
  \`bio\` TEXT,
  \`avatar_url\` VARCHAR(500),
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT \`fk_profile_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE \`orders\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`user_id\` INT NOT NULL,
  \`total_amount\` DECIMAL(12, 2) NOT NULL,
  \`status\` ENUM('pending', 'processing', 'completed', 'cancelled') DEFAULT 'pending',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT \`fk_order_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`)
) ENGINE=InnoDB;

CREATE TABLE \`order_items\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`order_id\` INT NOT NULL,
  \`product_name\` VARCHAR(150) NOT NULL,
  \`quantity\` INT NOT NULL DEFAULT 1,
  \`unit_price\` DECIMAL(10, 2) NOT NULL,
  CONSTRAINT \`fk_item_order\` FOREIGN KEY (\`order_id\`) REFERENCES \`orders\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB;`,
  },
  {
    id: 'mariadb',
    name: 'MariaDB',
    badge: 'MA',
    accentColor: '#C0765A',
    placeholder: 'CREATE TABLE `users` (\n  `id` INT AUTO_INCREMENT PRIMARY KEY,\n  `email` VARCHAR(255) NOT NULL\n);',
    sampleDdl: `-- MariaDB Schema
CREATE TABLE \`users\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`username\` VARCHAR(50) NOT NULL UNIQUE,
  \`email\` VARCHAR(255) NOT NULL UNIQUE,
  \`is_active\` BOOLEAN DEFAULT TRUE,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE \`categories\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`name\` VARCHAR(100) NOT NULL,
  \`slug\` VARCHAR(120) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE \`products\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`category_id\` INT NOT NULL,
  \`title\` VARCHAR(200) NOT NULL,
  \`price\` DECIMAL(10, 2) NOT NULL,
  \`stock\` INT NOT NULL DEFAULT 0,
  FOREIGN KEY (\`category_id\`) REFERENCES \`categories\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB;`,
  },
  {
    id: 'sqlite',
    name: 'SQLite',
    badge: 'SL',
    accentColor: '#003B57',
    placeholder: 'CREATE TABLE users (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  email TEXT NOT NULL UNIQUE\n);',
    sampleDdl: `-- SQLite Schema
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users (id)
);`,
  },
  {
    id: 'sqlserver',
    name: 'SQL Server',
    badge: 'MS',
    accentColor: '#CC292B',
    placeholder: 'CREATE TABLE [dbo].[users] (\n  [id] INT IDENTITY(1,1) PRIMARY KEY,\n  [email] NVARCHAR(255) NOT NULL\n);',
    sampleDdl: `-- SQL Server Schema
CREATE TABLE [dbo].[users] (
  [id] INT IDENTITY(1,1) PRIMARY KEY,
  [username] NVARCHAR(50) NOT NULL,
  [email] NVARCHAR(255) NOT NULL,
  [is_active] BIT DEFAULT 1,
  [created_at] DATETIME2 DEFAULT GETDATE()
);

CREATE TABLE [dbo].[customers] (
  [id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  [user_id] INT NOT NULL,
  [company_name] NVARCHAR(150),
  [credit_limit] DECIMAL(18, 2) DEFAULT 0,
  CONSTRAINT [FK_customers_users] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users] ([id])
);

CREATE TABLE [dbo].[invoices] (
  [id] INT IDENTITY(1,1) PRIMARY KEY,
  [customer_id] UNIQUEIDENTIFIER NOT NULL,
  [invoice_date] DATE DEFAULT GETDATE(),
  [total_amount] DECIMAL(18, 2) NOT NULL,
  CONSTRAINT [FK_invoices_customers] FOREIGN KEY ([customer_id]) REFERENCES [dbo].[customers] ([id])
);`,
  },
  {
    id: 'oracle',
    name: 'Oracle DB',
    badge: 'ORA',
    accentColor: '#F80000',
    placeholder: 'CREATE TABLE employees (\n  employee_id NUMBER(6) PRIMARY KEY,\n  first_name VARCHAR2(50) NOT NULL\n);',
    sampleDdl: `-- Oracle Database Schema
CREATE TABLE employees (
  employee_id NUMBER(6) PRIMARY KEY,
  first_name VARCHAR2(50) NOT NULL,
  last_name VARCHAR2(50) NOT NULL,
  email VARCHAR2(100) NOT NULL UNIQUE,
  salary NUMBER(10, 2),
  hire_date DATE DEFAULT SYSDATE
);

CREATE TABLE departments (
  department_id NUMBER(4) PRIMARY KEY,
  department_name VARCHAR2(50) NOT NULL,
  manager_id NUMBER(6),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_dept_mgr FOREIGN KEY (manager_id) REFERENCES employees (employee_id)
);

CREATE TABLE project_assignments (
  assignment_id NUMBER(8) PRIMARY KEY,
  employee_id NUMBER(6) NOT NULL,
  department_id NUMBER(4) NOT NULL,
  role VARCHAR2(50),
  CONSTRAINT fk_assign_emp FOREIGN KEY (employee_id) REFERENCES employees (employee_id),
  CONSTRAINT fk_assign_dept FOREIGN KEY (department_id) REFERENCES departments (department_id)
);`,
  },
];

export function cleanIdentifier(raw: string): string {
  if (!raw) return '';
  let cleaned = raw.trim();
  // Strip schemas like public. or dbo. or mydb.
  // Note: if format is `db`.`table`, strip parts before the last dot
  const dotParts = cleaned.split('.');
  cleaned = dotParts[dotParts.length - 1].trim();
  // Strip surrounding quotes or delimiters: ", `, [, ]
  cleaned = cleaned.replace(/^[`"\[]+|[`"\]]+$/g, '').trim();
  return cleaned;
}

function stripComments(sql: string): string {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, '') // multi-line comments
    .replace(/--[^\n]*/g, '')          // single line comments --
    .replace(/#[^\n]*/g, '')           // single line comments #
    .trim();
}

/**
 * Splits text by top-level delimiter, respecting quotes and nested parentheses.
 */
function splitTopLevel(content: string, delimiter = ','): string[] {
  const result: string[] = [];
  let current = '';
  let depth = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inBacktick = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const prev = i > 0 ? content[i - 1] : '';

    if (char === "'" && prev !== '\\' && !inDoubleQuote && !inBacktick) {
      inSingleQuote = !inSingleQuote;
    } else if (char === '"' && prev !== '\\' && !inSingleQuote && !inBacktick) {
      inDoubleQuote = !inDoubleQuote;
    } else if (char === '`' && prev !== '\\' && !inSingleQuote && !inDoubleQuote) {
      inBacktick = !inBacktick;
    }

    if (!inSingleQuote && !inDoubleQuote && !inBacktick) {
      if (char === '(' || char === '[') {
        depth++;
      } else if (char === ')' || char === ']') {
        if (depth > 0) depth--;
      } else if (char === delimiter && depth === 0) {
        if (current.trim()) {
          result.push(current.trim());
        }
        current = '';
        continue;
      }
    }
    current += char;
  }
  if (current.trim()) {
    result.push(current.trim());
  }
  return result;
}

const typeMap: Record<string, string> = {
  int: 'INTEGER',
  integer: 'INTEGER',
  tinyint: 'TINYINT',
  smallint: 'SMALLINT',
  mediumint: 'MEDIUMINT',
  bigint: 'BIGINT',
  serial: 'SERIAL',
  bigserial: 'BIGSERIAL',
  varchar: 'VARCHAR',
  nvarchar: 'NVARCHAR',
  char: 'CHAR',
  nchar: 'NCHAR',
  text: 'TEXT',
  tinytext: 'TINYTEXT',
  mediumtext: 'MEDIUMTEXT',
  longtext: 'LONGTEXT',
  boolean: 'BOOLEAN',
  bool: 'BOOLEAN',
  bit: 'BIT',
  float: 'FLOAT',
  double: 'DOUBLE',
  real: 'REAL',
  decimal: 'DECIMAL',
  numeric: 'NUMERIC',
  date: 'DATE',
  datetime: 'DATETIME',
  datetime2: 'DATETIME2',
  timestamp: 'TIMESTAMP',
  timestamptz: 'TIMESTAMPTZ',
  time: 'TIME',
  uuid: 'UUID',
  uniqueidentifier: 'UNIQUEIDENTIFIER',
  json: 'JSON',
  jsonb: 'JSONB',
  bytea: 'BYTEA',
  blob: 'BLOB',
};

export function normalizeType(raw: string): string {
  if (!raw) return 'VARCHAR(255)';
  const trimmed = raw.trim();
  const upper = trimmed.toUpperCase();
  const base = upper.replace(/\(.*?\)/, '').trim().split(/\s+/)[0];
  const lenMatch = trimmed.match(/\(([^)]+)\)/);
  const suffix = lenMatch ? `(${lenMatch[1].trim()})` : '';
  const mapped = typeMap[base.toLowerCase()];
  return mapped ? `${mapped}${suffix}` : trimmed;
}

export function parseSchemaJson(input: string): ParsedSchemaResult {
  const parsed = JSON.parse(input);
  const rawTables = Array.isArray(parsed) ? parsed : (parsed.tables || []);
  if (!Array.isArray(rawTables)) throw new Error('Expected an array of tables or { tables: [...] }');

  resetParserCounters();
  const relationships: RelationshipDef[] = [];
  const tables: TableDef[] = rawTables.map((t: Record<string, unknown>) => {
    const tableName = cleanIdentifier((t.name || t.table) as string);
    const columns: ColumnDef[] = ((t.columns || []) as Record<string, unknown>[]).map((c) => {
      const ref = c.references;
      let refObj: { table: string; column: string } | undefined;
      if (ref) {
        if (typeof ref === 'string') {
          refObj = { table: cleanIdentifier(ref), column: 'id' };
        } else if (typeof ref === 'object' && ref !== null) {
          refObj = {
            table: cleanIdentifier(((ref as Record<string, string>).table || '') as string),
            column: cleanIdentifier(((ref as Record<string, string>).column || 'id') as string),
          };
        }
      }

      const colName = cleanIdentifier(c.name as string);
      const isPK = !!(c.isPK || c.isPrimaryKey || c.primaryKey);
      const isFK = !!(c.isFK || c.isForeignKey || c.foreignKey || refObj);

      if (isFK && refObj && refObj.table) {
        relationships.push({
          id: nextRelId(),
          sourceTable: tableName,
          sourceField: colName,
          targetTable: refObj.table,
          targetField: refObj.column,
        });
      }

      return {
        name: colName,
        type: normalizeType((c.type || 'VARCHAR(255)') as string),
        isPK,
        isFK,
        nullable: c.nullable !== false,
        references: refObj,
      };
    });

    return {
      id: nextTableId(),
      name: tableName,
      columns,
    };
  });

  // Check if explicit relationships array was also provided in JSON
  if (Array.isArray(parsed.relationships)) {
    for (const r of parsed.relationships) {
      const srcT = cleanIdentifier(r.sourceTable);
      const srcF = cleanIdentifier(r.sourceField);
      const tgtT = cleanIdentifier(r.targetTable);
      const tgtF = cleanIdentifier(r.targetField);
      if (!relationships.some((existing) =>
        existing.sourceTable === srcT &&
        existing.sourceField === srcF &&
        existing.targetTable === tgtT &&
        existing.targetField === tgtF
      )) {
        relationships.push({
          id: r.id || nextRelId(),
          sourceTable: srcT,
          sourceField: srcF,
          targetTable: tgtT,
          targetField: tgtF,
        });
      }
    }
  }

  return { tables, relationships };
}

/**
 * Universal multi-dialect SQL DDL Parser supporting:
 * - PostgreSQL
 * - MySQL
 * - MariaDB
 * - SQLite
 * - SQL Server (MSSQL)
 */
export function parseSchemaSql(input: string, _dialect?: SqlDialect): ParsedSchemaResult {
  const clean = stripComments(input);
  resetParserCounters();

  const tables: TableDef[] = [];
  const relationships: RelationshipDef[] = [];

  // 1. Scan for CREATE TABLE statements using parenthesis balance
  const tableRegex = /CREATE\s+(?:TEMPORARY\s+|TEMP\s+)?TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([^\s(]+)\s*\(/gi;
  let match: RegExpExecArray | null;

  while ((match = tableRegex.exec(clean)) !== null) {
    const rawTableName = match[1];
    const tableName = cleanIdentifier(rawTableName);
    const startIndex = tableRegex.lastIndex; // position immediately after '('

    // Find closing ')' at depth 0
    let depth = 1;
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let inBacktick = false;
    let endIndex = -1;

    for (let i = startIndex; i < clean.length; i++) {
      const char = clean[i];
      const prev = i > 0 ? clean[i - 1] : '';

      if (char === "'" && prev !== '\\' && !inDoubleQuote && !inBacktick) {
        inSingleQuote = !inSingleQuote;
      } else if (char === '"' && prev !== '\\' && !inSingleQuote && !inBacktick) {
        inDoubleQuote = !inDoubleQuote;
      } else if (char === '`' && prev !== '\\' && !inSingleQuote && !inDoubleQuote) {
        inBacktick = !inBacktick;
      }

      if (!inSingleQuote && !inDoubleQuote && !inBacktick) {
        if (char === '(') {
          depth++;
        } else if (char === ')') {
          depth--;
          if (depth === 0) {
            endIndex = i;
            break;
          }
        }
      }
    }

    if (endIndex === -1) {
      continue;
    }

    const body = clean.substring(startIndex, endIndex);
    tableRegex.lastIndex = endIndex + 1;

    const pkColumns = new Set<string>();
    const tableRefs: Array<{ col: string; table: string; refCol: string }> = [];

    // Split body by top-level commas
    const items = splitTopLevel(body, ',');

    // Pre-pass for table-level PRIMARY KEY and FOREIGN KEY constraints
    for (const item of items) {
      const trimmed = item.trim();

      // PRIMARY KEY (...) constraint
      const pkMatch = trimmed.match(/(?:CONSTRAINT\s+\S+\s+)?PRIMARY\s+KEY(?:\s+CLUSTERED|\s+NONCLUSTERED)?\s*\(([^)]+)\)/i);
      if (pkMatch) {
        const pkList = pkMatch[1].split(',').map((c) => cleanIdentifier(c.replace(/\s+(?:ASC|DESC)/i, '')));
        pkList.forEach((c) => pkColumns.add(c));
        continue;
      }

      // FOREIGN KEY (...) REFERENCES (...) constraint
      const fkMatch = trimmed.match(/(?:CONSTRAINT\s+\S+\s+)?FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+([^\s(]+)\s*(?:\(([^)]+)\))?/i);
      if (fkMatch) {
        const srcCols = fkMatch[1].split(',').map(cleanIdentifier);
        const targetTable = cleanIdentifier(fkMatch[2]);
        const targetCols = (fkMatch[3] || 'id').split(',').map(cleanIdentifier);

        srcCols.forEach((srcCol, idx) => {
          const tgtCol = targetCols[idx] || targetCols[0] || 'id';
          tableRefs.push({
            col: srcCol,
            table: targetTable,
            refCol: tgtCol,
          });
          relationships.push({
            id: nextRelId(),
            sourceTable: tableName,
            sourceField: srcCol,
            targetTable,
            targetField: tgtCol,
          });
        });
        continue;
      }
    }

    // Process column definitions
    const columns: ColumnDef[] = [];

    for (const item of items) {
      const trimmed = item.trim();
      if (!trimmed) continue;

      // Skip table-level constraints
      if (/^(?:CONSTRAINT\s+\S+\s+)?(?:PRIMARY\s+KEY|FOREIGN\s+KEY|UNIQUE|CHECK|KEY|INDEX|FULLTEXT|SPATIAL)\b/i.test(trimmed)) {
        continue;
      }

      // Column pattern: identifier followed by type and modifiers
      const colMatch = trimmed.match(/^([`"\[]?[\w\-]+[`"\]]?)\s+([\s\S]+)$/);
      if (!colMatch) continue;

      const colName = cleanIdentifier(colMatch[1]);
      let rest = colMatch[2].trim();

      let isPK = pkColumns.has(colName);
      if (/\bPRIMARY\s+KEY\b/i.test(rest)) {
        isPK = true;
        pkColumns.add(colName);
      }

      let nullable = !isPK;
      if (/\bNOT\s+NULL\b/i.test(rest)) {
        nullable = false;
      } else if (/\bNULL\b/i.test(rest) && !/\bNOT\s+NULL\b/i.test(rest)) {
        nullable = true;
      }

      // Inline FOREIGN KEY / REFERENCES
      let refTable = '';
      let refCol = 'id';
      let isFK = false;

      const inlineRefMatch = rest.match(/\bREFERENCES\s+([^\s(]+)\s*(?:\(([^)]+)\))?/i);
      if (inlineRefMatch) {
        isFK = true;
        refTable = cleanIdentifier(inlineRefMatch[1]);
        refCol = cleanIdentifier(inlineRefMatch[2] || 'id');
        relationships.push({
          id: nextRelId(),
          sourceTable: tableName,
          sourceField: colName,
          targetTable: refTable,
          targetField: refCol,
        });
      }

      // Check if mapped in tableRefs
      const matchingTableRef = tableRefs.find((r) => r.col.toLowerCase() === colName.toLowerCase());
      if (matchingTableRef) {
        isFK = true;
        refTable = matchingTableRef.table;
        refCol = matchingTableRef.refCol;
      }

      // Strip constraints and clauses to extract pure data type
      let typeStr = rest
        .replace(/\bPRIMARY\s+KEY\b/gi, '')
        .replace(/\bNOT\s+NULL\b/gi, '')
        .replace(/\bNULL\b/gi, '')
        .replace(/\bREFERENCES\s+[^\s(]+(?:\([^)]*\))?(?:\s+ON\s+DELETE\s+[A-Z\s]+)?(?:\s+ON\s+UPDATE\s+[A-Z\s]+)?/gi, '')
        .replace(/\bDEFAULT\s+[^,]+/gi, '')
        .replace(/\bAUTO_INCREMENT\b/gi, '')
        .replace(/\bAUTOINCREMENT\b/gi, '')
        .replace(/\bIDENTITY\s*\([^)]*\)/gi, '')
        .replace(/\bGENERATED\s+ALWAYS\s+AS\s+IDENTITY/gi, '')
        .replace(/\bUNIQUE\b/gi, '')
        .replace(/\bCHECK\s*\([^)]*\)/gi, '')
        .replace(/\bCOLLATE\s+\S+/gi, '')
        .replace(/\bON\s+UPDATE\s+CURRENT_TIMESTAMP(?:\(\))?/gi, '')
        .replace(/\bCOMMENT\s+'[^']*'/gi, '')
        .trim();

      // Normalize type
      columns.push({
        name: colName,
        type: normalizeType(typeStr),
        isPK,
        isFK,
        nullable,
        references: isFK ? { table: refTable, column: refCol } : undefined,
      });
    }

    tables.push({
      id: nextTableId(),
      name: tableName,
      columns,
    });
  }

  // 2. Scan for ALTER TABLE ... ADD [CONSTRAINT] FOREIGN KEY statements
  const alterRegex = /ALTER\s+TABLE\s+(?:ONLY\s+)?([^\s(]+)\s+ADD\s+(?:CONSTRAINT\s+\S+\s+)?FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+([^\s(]+)\s*(?:\(([^)]+)\))?/gi;
  let alterMatch: RegExpExecArray | null;

  while ((alterMatch = alterRegex.exec(clean)) !== null) {
    const srcTable = cleanIdentifier(alterMatch[1]);
    const srcCols = alterMatch[2].split(',').map(cleanIdentifier);
    const tgtTable = cleanIdentifier(alterMatch[3]);
    const tgtCols = (alterMatch[4] || 'id').split(',').map(cleanIdentifier);

    srcCols.forEach((srcCol, idx) => {
      const tgtCol = tgtCols[idx] || tgtCols[0] || 'id';

      // Avoid duplicates
      if (!relationships.some((r) =>
        r.sourceTable.toLowerCase() === srcTable.toLowerCase() &&
        r.sourceField.toLowerCase() === srcCol.toLowerCase() &&
        r.targetTable.toLowerCase() === tgtTable.toLowerCase() &&
        r.targetField.toLowerCase() === tgtCol.toLowerCase()
      )) {
        relationships.push({
          id: nextRelId(),
          sourceTable: srcTable,
          sourceField: srcCol,
          targetTable: tgtTable,
          targetField: tgtCol,
        });
      }

      // Mark column as FK in table definition
      const tbl = tables.find((t) => t.name.toLowerCase() === srcTable.toLowerCase());
      if (tbl) {
        const col = tbl.columns.find((c) => c.name.toLowerCase() === srcCol.toLowerCase());
        if (col) {
          col.isFK = true;
          col.references = { table: tgtTable, column: tgtCol };
        }
      }
    });
  }

  return { tables, relationships };
}

export function parseSchemaDbml(input: string): {
  tables: TableDef[];
  refs: Array<{ srcTable: string; srcField: string; tgtTable: string; tgtField: string }>;
  relationships: RelationshipDef[];
} {
  const clean = input.replace(/\/\/.*$/gm, '').trim();
  const tables: TableDef[] = [];
  const refs: Array<{ srcTable: string; srcField: string; tgtTable: string; tgtField: string }> = [];
  const relationships: RelationshipDef[] = [];
  resetParserCounters();

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

      columns.push({ name: colName, type: normalizeType(colType), isPK, isFK, nullable });
    }

    tables.push({ id: nextTableId(), name: tableName, columns });
  }

  const refRegex = /Ref:\s*(\w+)\.(\w+)\s*>\s*(\w+)\.(\w+)/gi;
  while ((match = refRegex.exec(clean)) !== null) {
    refs.push({ srcTable: match[1], srcField: match[2], tgtTable: match[3], tgtField: match[4] });
    relationships.push({
      id: nextRelId(),
      sourceTable: match[1],
      sourceField: match[2],
      targetTable: match[3],
      targetField: match[4],
    });
  }

  return { tables, refs, relationships };
}

export const demoSchemas: Array<{ label: string; tables: TableDef[] }> = [
  {
    label: 'Current Project',
    tables: [
      { id: 't1', name: 'pages', columns: [
        { name: 'id', type: 'UUID', isPK: true, isFK: false, nullable: false },
        { name: 'parent_id', type: 'UUID', isPK: false, isFK: true, nullable: true, references: { table: 'pages', column: 'id' } },
        { name: 'title', type: 'TEXT', isPK: false, isFK: false, nullable: false },
        { name: 'created_at', type: 'TIMESTAMPTZ', isPK: false, isFK: false, nullable: false },
        { name: 'updated_at', type: 'TIMESTAMPTZ', isPK: false, isFK: false, nullable: false },
      ] },
      { id: 't2', name: 'blocks', columns: [
        { name: 'id', type: 'TEXT', isPK: true, isFK: false, nullable: false },
        { name: 'page_id', type: 'UUID', isPK: false, isFK: true, nullable: false, references: { table: 'pages', column: 'id' } },
        { name: 'data', type: 'JSONB', isPK: false, isFK: false, nullable: false },
      ] },
    ],
  },
  {
    label: 'E-Commerce',
    tables: [
      { id: 't1', name: 'users', columns: [
        { name: 'id', type: 'UUID', isPK: true, isFK: false, nullable: false },
        { name: 'email', type: 'VARCHAR(255)', isPK: false, isFK: false, nullable: false },
        { name: 'name', type: 'VARCHAR(255)', isPK: false, isFK: false, nullable: false },
        { name: 'created_at', type: 'TIMESTAMPTZ', isPK: false, isFK: false, nullable: false },
      ] },
      { id: 't2', name: 'products', columns: [
        { name: 'id', type: 'UUID', isPK: true, isFK: false, nullable: false },
        { name: 'name', type: 'VARCHAR(255)', isPK: false, isFK: false, nullable: false },
        { name: 'price', type: 'DECIMAL(10,2)', isPK: false, isFK: false, nullable: false },
        { name: 'stock', type: 'INTEGER', isPK: false, isFK: false, nullable: false },
        { name: 'category_id', type: 'UUID', isPK: false, isFK: true, nullable: true, references: { table: 'categories', column: 'id' } },
      ] },
      { id: 't3', name: 'categories', columns: [
        { name: 'id', type: 'UUID', isPK: true, isFK: false, nullable: false },
        { name: 'name', type: 'VARCHAR(255)', isPK: false, isFK: false, nullable: false },
      ] },
      { id: 't4', name: 'orders', columns: [
        { name: 'id', type: 'UUID', isPK: true, isFK: false, nullable: false },
        { name: 'user_id', type: 'UUID', isPK: false, isFK: true, nullable: false, references: { table: 'users', column: 'id' } },
        { name: 'total', type: 'DECIMAL(10,2)', isPK: false, isFK: false, nullable: false },
        { name: 'status', type: 'VARCHAR(50)', isPK: false, isFK: false, nullable: false },
        { name: 'created_at', type: 'TIMESTAMPTZ', isPK: false, isFK: false, nullable: false },
      ] },
      { id: 't5', name: 'order_items', columns: [
        { name: 'id', type: 'UUID', isPK: true, isFK: false, nullable: false },
        { name: 'order_id', type: 'UUID', isPK: false, isFK: true, nullable: false, references: { table: 'orders', column: 'id' } },
        { name: 'product_id', type: 'UUID', isPK: false, isFK: true, nullable: false, references: { table: 'products', column: 'id' } },
        { name: 'quantity', type: 'INTEGER', isPK: false, isFK: false, nullable: false },
        { name: 'price', type: 'DECIMAL(10,2)', isPK: false, isFK: false, nullable: false },
      ] },
    ],
  },
];
