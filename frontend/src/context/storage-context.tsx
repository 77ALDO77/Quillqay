'use client';

import { createContext, useContext, useCallback, useMemo, type ReactNode } from 'react';
import Dexie, { type EntityTable } from 'dexie';
import type { TableDef, RelationshipDef } from '@/types/db-schema';

export interface DiagramData {
  id: string;
  name: string;
  tables: TableDef[];
  relationships: RelationshipDef[];
  updatedAt: number;
}

interface StorageContextValue {
  saveDiagram: (diagram: DiagramData) => Promise<void>;
  loadDiagram: (id: string) => Promise<DiagramData | undefined>;
  listDiagrams: () => Promise<DiagramData[]>;
  deleteDiagram: (id: string) => Promise<void>;
}

const StorageContext = createContext<StorageContextValue>(null!);

export function useStorage() {
  return useContext(StorageContext);
}

interface StorageProviderProps {
  children: ReactNode;
}

function createDB() {
  const db = new Dexie('Quillqay') as Dexie & {
    diagrams: EntityTable<DiagramData, 'id'>;
  };

  db.version(1).stores({
    diagrams: 'id, name, updatedAt',
  });

  return db;
}

let dbInstance: ReturnType<typeof createDB> | null = null;
function getDB() {
  if (!dbInstance) dbInstance = createDB();
  return dbInstance;
}

export function StorageProvider({ children }: StorageProviderProps) {
  const db = useMemo(() => getDB(), []);

  const saveDiagram = useCallback(async (diagram: DiagramData) => {
    await db.diagrams.put({ ...diagram, updatedAt: Date.now() });
  }, [db]);

  const loadDiagram = useCallback(async (id: string) => {
    return db.diagrams.get(id);
  }, [db]);

  const listDiagrams = useCallback(async () => {
    return db.diagrams.toArray();
  }, [db]);

  const deleteDiagram = useCallback(async (id: string) => {
    await db.diagrams.delete(id);
  }, [db]);

  return (
    <StorageContext.Provider value={{ saveDiagram, loadDiagram, listDiagrams, deleteDiagram }}>
      {children}
    </StorageContext.Provider>
  );
}
