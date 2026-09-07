import { describe, it, expect } from 'bun:test';
import { parseSchemaSql, parseSchemaJson, DIALECT_OPTIONS, cleanIdentifier } from './schema-parser';

describe('Multi-dialect SQL DDL Parser', () => {
  it('cleans identifiers correctly', () => {
    expect(cleanIdentifier('`users`')).toBe('users');
    expect(cleanIdentifier('"users"')).toBe('users');
    expect(cleanIdentifier('[users]')).toBe('users');
    expect(cleanIdentifier('public."users"')).toBe('users');
    expect(cleanIdentifier('[dbo].[users]')).toBe('users');
    expect(cleanIdentifier('`mydb`.`users`')).toBe('users');
  });

  it('parses PostgreSQL schema with inline and table constraints', () => {
    const pgOption = DIALECT_OPTIONS.find((d) => d.id === 'postgres')!;
    const result = parseSchemaSql(pgOption.sampleDdl, 'postgres');

    expect(result.tables.length).toBe(4);
    expect(result.tables.map((t) => t.name)).toEqual(['users', 'profiles', 'orders', 'order_items']);

    const users = result.tables.find((t) => t.name === 'users')!;
    expect(users.columns.find((c) => c.name === 'id')?.isPK).toBe(true);
    expect(users.columns.find((c) => c.name === 'username')?.nullable).toBe(false);

    const profiles = result.tables.find((t) => t.name === 'profiles')!;
    const userIdCol = profiles.columns.find((c) => c.name === 'user_id')!;
    expect(userIdCol.isFK).toBe(true);
    expect(userIdCol.references?.table).toBe('users');

    expect(result.relationships.length).toBe(3);
    expect(result.relationships.some((r) => r.sourceTable === 'profiles' && r.targetTable === 'users')).toBe(true);
    expect(result.relationships.some((r) => r.sourceTable === 'orders' && r.targetTable === 'users')).toBe(true);
    expect(result.relationships.some((r) => r.sourceTable === 'order_items' && r.targetTable === 'orders')).toBe(true);
  });

  it('parses MySQL schema with backticks, ENGINE options, and CONSTRAINT FOREIGN KEY', () => {
    const myOption = DIALECT_OPTIONS.find((d) => d.id === 'mysql')!;
    const result = parseSchemaSql(myOption.sampleDdl, 'mysql');

    expect(result.tables.length).toBe(4);
    expect(result.tables.map((t) => t.name)).toEqual(['users', 'profiles', 'orders', 'order_items']);

    const orders = result.tables.find((t) => t.name === 'orders')!;
    expect(orders.columns.find((c) => c.name === 'id')?.isPK).toBe(true);
    const userIdCol = orders.columns.find((c) => c.name === 'user_id')!;
    expect(userIdCol.isFK).toBe(true);
    expect(userIdCol.references?.table).toBe('users');

    expect(result.relationships.some((r) => r.sourceTable === 'orders' && r.targetTable === 'users')).toBe(true);
  });

  it('parses MariaDB schema correctly', () => {
    const maOption = DIALECT_OPTIONS.find((d) => d.id === 'mariadb')!;
    const result = parseSchemaSql(maOption.sampleDdl, 'mariadb');

    expect(result.tables.length).toBe(3);
    expect(result.tables.map((t) => t.name)).toEqual(['users', 'categories', 'products']);

    const products = result.tables.find((t) => t.name === 'products')!;
    const catIdCol = products.columns.find((c) => c.name === 'category_id')!;
    expect(catIdCol.isFK).toBe(true);
    expect(catIdCol.references?.table).toBe('categories');
    expect(result.relationships.some((r) => r.sourceTable === 'products' && r.targetTable === 'categories')).toBe(true);
  });

  it('parses SQLite schema with AUTOINCREMENT and FOREIGN KEY', () => {
    const slOption = DIALECT_OPTIONS.find((d) => d.id === 'sqlite')!;
    const result = parseSchemaSql(slOption.sampleDdl, 'sqlite');

    expect(result.tables.length).toBe(3);
    expect(result.tables.map((t) => t.name)).toEqual(['users', 'posts', 'comments']);

    const comments = result.tables.find((t) => t.name === 'comments')!;
    expect(comments.columns.find((c) => c.name === 'id')?.isPK).toBe(true);
    expect(result.relationships.some((r) => r.sourceTable === 'comments' && r.targetTable === 'posts')).toBe(true);
    expect(result.relationships.some((r) => r.sourceTable === 'comments' && r.targetTable === 'users')).toBe(true);
  });

  it('parses SQL Server (MSSQL) schema with square brackets and dbo schema prefixes', () => {
    const msOption = DIALECT_OPTIONS.find((d) => d.id === 'sqlserver')!;
    const result = parseSchemaSql(msOption.sampleDdl, 'sqlserver');

    expect(result.tables.length).toBe(3);
    expect(result.tables.map((t) => t.name)).toEqual(['users', 'customers', 'invoices']);

    const customers = result.tables.find((t) => t.name === 'customers')!;
    expect(customers.columns.find((c) => c.name === 'id')?.isPK).toBe(true);
    expect(customers.columns.find((c) => c.name === 'user_id')?.isFK).toBe(true);

    expect(result.relationships.some((r) => r.sourceTable === 'customers' && r.targetTable === 'users')).toBe(true);
    expect(result.relationships.some((r) => r.sourceTable === 'invoices' && r.targetTable === 'customers')).toBe(true);
  });

  it('parses Oracle DB schema with NUMBER, VARCHAR2 and CONSTRAINT FOREIGN KEY', () => {
    const oraOption = DIALECT_OPTIONS.find((d) => d.id === 'oracle')!;
    const result = parseSchemaSql(oraOption.sampleDdl, 'oracle');

    expect(result.tables.length).toBe(3);
    expect(result.tables.map((t) => t.name)).toEqual(['employees', 'departments', 'project_assignments']);

    const employees = result.tables.find((t) => t.name === 'employees')!;
    expect(employees.columns.find((c) => c.name === 'employee_id')?.isPK).toBe(true);
    expect(employees.columns.find((c) => c.name === 'email')?.type).toBe('VARCHAR2(100)');

    const assignments = result.tables.find((t) => t.name === 'project_assignments')!;
    expect(assignments.columns.find((c) => c.name === 'employee_id')?.isFK).toBe(true);
    expect(assignments.columns.find((c) => c.name === 'department_id')?.isFK).toBe(true);

    expect(result.relationships.some((r) => r.sourceTable === 'project_assignments' && r.targetTable === 'employees')).toBe(true);
    expect(result.relationships.some((r) => r.sourceTable === 'departments' && r.targetTable === 'employees')).toBe(true);
  });

  it('parses ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY statements', () => {
    const ddl = `
      CREATE TABLE departments (
        id INT PRIMARY KEY,
        name VARCHAR(100) NOT NULL
      );

      CREATE TABLE employees (
        id INT PRIMARY KEY,
        dept_id INT NOT NULL,
        name VARCHAR(100) NOT NULL
      );

      ALTER TABLE employees ADD CONSTRAINT fk_emp_dept FOREIGN KEY (dept_id) REFERENCES departments (id);
    `;
    const result = parseSchemaSql(ddl, 'postgres');

    expect(result.tables.length).toBe(2);
    const employees = result.tables.find((t) => t.name === 'employees')!;
    const deptIdCol = employees.columns.find((c) => c.name === 'dept_id')!;
    expect(deptIdCol.isFK).toBe(true);
    expect(deptIdCol.references?.table).toBe('departments');
    expect(deptIdCol.references?.column).toBe('id');

    expect(result.relationships.length).toBe(1);
    expect(result.relationships[0].sourceTable).toBe('employees');
    expect(result.relationships[0].targetTable).toBe('departments');
  });

  it('parses JSON schema input and detects references', () => {
    const json = JSON.stringify({
      tables: [
        {
          name: 'authors',
          columns: [{ name: 'id', type: 'INT', isPK: true }],
        },
        {
          name: 'books',
          columns: [
            { name: 'id', type: 'INT', isPK: true },
            { name: 'author_id', type: 'INT', references: { table: 'authors', column: 'id' } },
          ],
        },
      ],
    });

    const result = parseSchemaJson(json);
    expect(result.tables.length).toBe(2);
    expect(result.relationships.length).toBe(1);
    expect(result.relationships[0].sourceTable).toBe('books');
    expect(result.relationships[0].targetTable).toBe('authors');
  });
});
