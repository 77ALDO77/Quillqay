'use client';

import { useCallback, useEffect } from 'react';
import { useStorage, type DiagramData } from '../store/storage-context';
import { useSchema } from '../store/schema-context';
import { getDiagram, updateDiagram } from '@/lib/api';

export function useDiagramPersistence(diagramId: string, projectId?: string) {
  const { tables, relationships, setTablesAndRelationships } = useSchema();
  const { saveDiagram, loadDiagram, listDiagrams, deleteDiagram } = useStorage();

  // Load diagram on mount
  useEffect(() => {
    let active = true;

    async function init() {
      if (projectId && diagramId && diagramId !== 'default') {
        try {
          const apiData = await getDiagram(projectId, diagramId);
          if (apiData?.content?.tables && Array.isArray(apiData.content.tables) && apiData.content.tables.length > 0) {
            if (active) {
              const rels = Array.isArray(apiData.content.relationships) ? apiData.content.relationships : [];
              setTablesAndRelationships(apiData.content.tables, rels);
              return;
            }
          }
        } catch {
          // Fall back to local Dexie storage
        }
      }

      const localData = await loadDiagram(diagramId);
      if (active && localData && localData.tables.length > 0) {
        const rels = Array.isArray(localData.relationships) ? localData.relationships : [];
        setTablesAndRelationships(localData.tables, rels);
      }
    }

    init();

    return () => {
      active = false;
    };
  }, [diagramId, projectId, loadDiagram, setTablesAndRelationships]);

  const save = useCallback(async () => {
    const data: DiagramData = {
      id: diagramId,
      name: `Diagram ${diagramId.slice(0, 8)}`,
      tables,
      relationships,
      updatedAt: Date.now(),
    };

    // Save locally
    await saveDiagram(data);

    // Save to PostgreSQL if project context exists
    if (projectId && diagramId && diagramId !== 'default') {
      try {
        await updateDiagram(projectId, diagramId, {
          content: {
            tables,
            relationships,
          },
        });
      } catch (err) {
        console.error('Failed to sync diagram to server:', err);
      }
    }
  }, [diagramId, projectId, tables, relationships, saveDiagram]);

  const load = useCallback(async () => {
    if (projectId && diagramId && diagramId !== 'default') {
      try {
        const apiData = await getDiagram(projectId, diagramId);
        if (apiData?.content?.tables && Array.isArray(apiData.content.tables)) {
          const rels = Array.isArray(apiData.content.relationships) ? apiData.content.relationships : [];
          setTablesAndRelationships(apiData.content.tables, rels);
          return apiData.content;
        }
      } catch {
        // Fall back to local storage
      }
    }

    const data = await loadDiagram(diagramId);
    if (data) {
      const rels = Array.isArray(data.relationships) ? data.relationships : [];
      setTablesAndRelationships(data.tables, rels);
    }
    return data;
  }, [diagramId, projectId, loadDiagram, setTablesAndRelationships]);

  const list = useCallback(() => listDiagrams(), [listDiagrams]);

  const remove = useCallback(() => deleteDiagram(diagramId), [diagramId, deleteDiagram]);

  return { save, load, list, remove };
}
