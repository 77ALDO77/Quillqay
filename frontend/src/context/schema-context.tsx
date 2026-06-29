'use client';

import { createContext, useContext, useCallback, type ReactNode } from 'react';
import type { TableDef } from '@/types/db-schema';

interface SchemaContextValue {
  tables: TableDef[];
  setAllTables: (tables: TableDef[]) => void;
  updateTable: (index: number, table: TableDef) => void;
  addTable: (name?: string) => void;
  removeTable: (index: number) => void;
  addColumn: (tableIndex: number) => void;
  updateColumn: (tableIndex: number, colIndex: number, column: TableDef['columns'][0]) => void;
  removeColumn: (tableIndex: number, colIndex: number) => void;
  renameTable: (index: number, name: string) => void;
}

const SchemaContext = createContext<SchemaContextValue>(null!);

export function useSchema() {
  return useContext(SchemaContext);
}

interface SchemaProviderProps {
  tables: TableDef[];
  onTablesChange: (tables: TableDef[]) => void;
  children: ReactNode;
}

export function SchemaProvider({ tables, onTablesChange, children }: SchemaProviderProps) {
  const updateTable = useCallback((index: number, table: TableDef) => {
    const next = [...tables];
    next[index] = table;
    onTablesChange(next);
  }, [tables, onTablesChange]);

  const addTable = useCallback((name?: string) => {
    const tableName = name || `table_${tables.length + 1}`;
    onTablesChange([...tables, {
      name: tableName,
      columns: [{ name: 'id', type: 'INTEGER', isPK: true, isFK: false, nullable: false }],
    }]);
  }, [tables, onTablesChange]);

  const removeTable = useCallback((index: number) => {
    onTablesChange(tables.filter((_, i) => i !== index));
  }, [tables, onTablesChange]);

  const addColumn = useCallback((tableIndex: number) => {
    const next = [...tables];
    next[tableIndex] = {
      ...next[tableIndex],
      columns: [...next[tableIndex].columns, { name: `col_${next[tableIndex].columns.length + 1}`, type: 'VARCHAR(255)', isPK: false, isFK: false, nullable: true }],
    };
    onTablesChange(next);
  }, [tables, onTablesChange]);

  const updateColumn = useCallback((tableIndex: number, colIndex: number, column: TableDef['columns'][0]) => {
    const next = [...tables];
    const cols = [...next[tableIndex].columns];
    cols[colIndex] = column;
    next[tableIndex] = { ...next[tableIndex], columns: cols };
    onTablesChange(next);
  }, [tables, onTablesChange]);

  const removeColumn = useCallback((tableIndex: number, colIndex: number) => {
    const next = [...tables];
    next[tableIndex] = { ...next[tableIndex], columns: next[tableIndex].columns.filter((_, i) => i !== colIndex) };
    onTablesChange(next);
  }, [tables, onTablesChange]);

  const renameTable = useCallback((index: number, name: string) => {
    updateTable(index, { ...tables[index], name });
  }, [tables, updateTable]);

  return (
    <SchemaContext.Provider value={{
      tables,
      setAllTables: onTablesChange,
      updateTable,
      addTable,
      removeTable,
      addColumn,
      updateColumn,
      removeColumn,
      renameTable,
    }}>
      {children}
    </SchemaContext.Provider>
  );
}
