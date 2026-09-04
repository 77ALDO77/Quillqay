'use client';

import { useCallback, useEffect } from 'react';
import { useStorage } from '@/context/storage-context';
import { useSchema } from '@/context/schema-context';
import type { DiagramData } from '@/context/storage-context';

export function useDiagramPersistence(diagramId: string) {
  const { tables, relationships, setAllTables } = useSchema();
  const { saveDiagram, loadDiagram, listDiagrams, deleteDiagram } = useStorage();

  // Load diagram on mount
  useEffect(() => {
    loadDiagram(diagramId).then((data) => {
      if (data && data.tables.length > 0) {
        setAllTables(data.tables);
        // relationships are stored but need to be re-created via context
        // (schema context handles this via FK columns)
      }
    });
  }, [diagramId, loadDiagram, setAllTables]);

  const save = useCallback(() => {
    const data: DiagramData = {
      id: diagramId,
      name: `Diagram ${diagramId.slice(0, 8)}`,
      tables,
      relationships,
      updatedAt: Date.now(),
    };
    return saveDiagram(data);
  }, [diagramId, tables, relationships, saveDiagram]);

  const load = useCallback(async () => {
    const data = await loadDiagram(diagramId);
    if (data) {
      setAllTables(data.tables);
    }
    return data;
  }, [diagramId, loadDiagram, setAllTables]);

  const list = useCallback(() => listDiagrams(), [listDiagrams]);

  const remove = useCallback(() => deleteDiagram(diagramId), [diagramId, deleteDiagram]);

  return { save, load, list, remove };
}
