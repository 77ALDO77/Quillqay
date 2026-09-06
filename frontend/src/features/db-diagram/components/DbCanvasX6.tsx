'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { Graph, Node } from '@antv/x6';
import { register, getProvider } from '@antv/x6-react-shape';
import ErTableNode, { ER_TABLE_WIDTH, ER_HEADER_HEIGHT, ER_ROW_HEIGHT, calculateTableHeight } from './nodes/ErTableNode';
import type { TableDef, RelationshipDef, ColumnDef } from '../core/types';

// Register the custom shape once
try {
  register({
    shape: 'er-table',
    component: ErTableNode,
    width: ER_TABLE_WIDTH,
    height: 140,
  });
} catch {
  // Shape may already be registered in HMR
}

const PortalProvider = getProvider();

export interface DbCanvasX6Handle {
  zoomIn: () => void;
  zoomOut: () => void;
  zoomToFit: () => void;
  zoomReset: () => void;
  getZoom: () => number;
}

interface Props {
  tables: TableDef[];
  relationships: RelationshipDef[];
  onCreateRelationship: (srcTable: string, srcField: string, tgtTable: string, tgtField: string) => void;
  onRemoveRelationship?: (id: string) => void;
  onZoomChange?: (zoom: number) => void;
  onNodeContextMenu?: (e: React.MouseEvent | MouseEvent, table: TableDef) => void;
  onBlankContextMenu?: (e: React.MouseEvent | MouseEvent) => void;
  canvasRef?: React.Ref<DbCanvasX6Handle>;
}

export const DbCanvasX6: React.FC<Props> = ({
  tables,
  relationships,
  onCreateRelationship,
  onRemoveRelationship,
  onZoomChange,
  onNodeContextMenu,
  onBlankContextMenu,
  canvasRef,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<Graph | null>(null);
  const positionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());

  // Expose imperative methods to parent (zoom, fit view, etc.)
  useEffect(() => {
    if (!canvasRef) return;
    const handle: DbCanvasX6Handle = {
      zoomIn: () => graphRef.current?.zoom(0.1),
      zoomOut: () => graphRef.current?.zoom(-0.1),
      zoomToFit: () => graphRef.current?.zoomToFit({ padding: 40, maxScale: 1.2 }),
      zoomReset: () => graphRef.current?.zoomTo(1),
      getZoom: () => graphRef.current?.zoom() || 1,
    };
    if (typeof canvasRef === 'function') {
      canvasRef(handle);
    } else if (canvasRef && 'current' in canvasRef) {
      (canvasRef as React.MutableRefObject<DbCanvasX6Handle | null>).current = handle;
    }
  }, [canvasRef]);

  // Initialize Graph
  useEffect(() => {
    if (!containerRef.current) return;

    const graph = new Graph({
      container: containerRef.current,
      autoResize: true,
      background: {
        color: '#131315',
      },
      grid: {
        visible: true,
        type: 'dot',
        size: 16,
        args: {
          color: 'rgba(255, 255, 255, 0.08)',
          thickness: 1.5,
        },
      },
      panning: {
        enabled: true,
      },
      mousewheel: {
        enabled: true,
        modifiers: ['ctrl', 'meta'],
        minScale: 0.25,
        maxScale: 2.5,
      },
      connecting: {
        snap: true,
        allowBlank: false,
        allowLoop: false,
        highlight: true,
        router: {
          name: 'er',
          args: {
            offset: 32,
            direction: 'H',
          },
        },
        connector: {
          name: 'rounded',
          args: { radius: 6 },
        },
        createEdge() {
          return this.createEdge({
            shape: 'edge',
            attrs: {
              line: {
                stroke: '#d6baff',
                strokeWidth: 2,
                targetMarker: {
                  name: 'classic',
                  size: 8,
                },
              },
            },
          });
        },
        validateConnection({ sourceCell, targetCell, sourceMagnet, targetMagnet }) {
          return !!sourceMagnet && !!targetMagnet && sourceCell !== targetCell;
        },
      },
    });

    // Track node movements to preserve layout positions
    graph.on('node:moved', ({ node }) => {
      const pos = node.getPosition();
      const data = node.getData() as { table?: TableDef } | undefined;
      const key = data?.table?.name || node.id;
      positionsRef.current.set(key, pos);
    });

    // Handle zoom changes
    graph.on('scale', ({ sx }) => {
      onZoomChange?.(sx);
    });

    // Handle interactive relationship creation
    graph.on('edge:connected', ({ edge }) => {
      const source = edge.getSource() as { cell?: string; port?: string };
      const target = edge.getTarget() as { cell?: string; port?: string };

      if (!source?.cell || !target?.cell || !source?.port || !target?.port) {
        return;
      }

      const sourceNode = graph.getCellById(source.cell) as Node | undefined;
      const targetNode = graph.getCellById(target.cell) as Node | undefined;
      const srcTable = (sourceNode?.getData() as { table?: TableDef })?.table?.name;
      const tgtTable = (targetNode?.getData() as { table?: TableDef })?.table?.name;

      const srcField = source.port.replace(/-left$|-right$/, '');
      const tgtField = target.port.replace(/-left$|-right$/, '');

      if (srcTable && tgtTable && srcField && tgtField) {
        onCreateRelationship(srcTable, srcField, tgtTable, tgtField);
      }
    });

    // Context menu handlers
    graph.on('node:contextmenu', ({ e, node }) => {
      e.preventDefault();
      const data = node.getData() as { table?: TableDef } | undefined;
      if (data?.table) {
        onNodeContextMenu?.(e as unknown as React.MouseEvent, data.table);
      }
    });

    graph.on('blank:contextmenu', ({ e }) => {
      e.preventDefault();
      onBlankContextMenu?.(e as unknown as React.MouseEvent);
    });

    // Keyboard shortcuts (Delete selected edge)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const selectedCells = graph.getSelectedCells();
        for (const cell of selectedCells) {
          if (cell.isEdge()) {
            onRemoveRelationship?.(cell.id);
            graph.removeCell(cell);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    graphRef.current = graph;

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      graph.dispose();
      graphRef.current = null;
    };
  }, [onCreateRelationship, onRemoveRelationship, onZoomChange]);

  // Synchronize tables and relationships with Graph
  const syncGraph = useCallback(() => {
    const graph = graphRef.current;
    if (!graph) return;

    graph.batchUpdate(() => {
      const currentNodes = graph.getNodes();
      const currentNodeMap = new Map(currentNodes.map((n) => [n.id, n]));
      const tableNames = new Set(tables.map((t) => t.name));

      // Remove obsolete nodes
      for (const [nodeId, node] of currentNodeMap) {
        const data = node.getData() as { table?: TableDef } | undefined;
        if (!data?.table?.name || !tableNames.has(data.table.name)) {
          graph.removeNode(nodeId);
          currentNodeMap.delete(nodeId);
        }
      }

      const cols = Math.max(1, Math.ceil(Math.sqrt(tables.length)));

      // Add or update nodes for each table
      tables.forEach((table, index) => {
        const nodeId = `table-${table.name}`;
        const height = calculateTableHeight(table.columns.length);

        // Build left and right ports for each column
        const portItems = table.columns.flatMap((col, i) => {
          const y = ER_HEADER_HEIGHT + i * ER_ROW_HEIGHT + ER_ROW_HEIGHT / 2;
          return [
            {
              id: `${col.name}-left`,
              group: 'left',
              args: { x: 0, y },
            },
            {
              id: `${col.name}-right`,
              group: 'right',
              args: { x: ER_TABLE_WIDTH, y },
            },
          ];
        });

        const portGroups = {
          left: {
            position: 'absolute',
            attrs: {
              circle: {
                r: 4.5,
                magnet: true,
                stroke: '#d6baff',
                strokeWidth: 2,
                fill: '#1c1b1d',
                style: { cursor: 'crosshair' },
              },
            },
          },
          right: {
            position: 'absolute',
            attrs: {
              circle: {
                r: 4.5,
                magnet: true,
                stroke: '#d3fbff',
                strokeWidth: 2,
                fill: '#1c1b1d',
                style: { cursor: 'crosshair' },
              },
            },
          },
        };

        let existing = currentNodeMap.get(nodeId);
        if (!existing) {
          // Check if we have a saved position, otherwise calculate a clean grid layout
          const savedPos = positionsRef.current.get(table.name);
          const x = savedPos ? savedPos.x : 60 + (index % cols) * 360;
          const y = savedPos ? savedPos.y : 80 + Math.floor(index / cols) * 340;

          existing = graph.addNode({
            id: nodeId,
            shape: 'er-table',
            x,
            y,
            width: ER_TABLE_WIDTH,
            height,
            data: { table },
            ports: {
              groups: portGroups,
              items: portItems,
            },
          });
          currentNodeMap.set(nodeId, existing);
        } else {
          existing.setSize({ width: ER_TABLE_WIDTH, height });
          existing.setData({ table }, { overwrite: true });
          existing.prop('ports', {
            groups: portGroups,
            items: portItems,
          });
        }
      });

      // Synchronize edges / relationships
      const currentEdges = graph.getEdges();
      const currentEdgeMap = new Map(currentEdges.map((e) => [e.id, e]));
      const relIds = new Set(relationships.map((r) => r.id));

      // Remove obsolete edges
      for (const [edgeId] of currentEdgeMap) {
        if (!relIds.has(edgeId)) {
          graph.removeEdge(edgeId);
          currentEdgeMap.delete(edgeId);
        }
      }

      // Add missing edges
      relationships.forEach((rel) => {
        const sourceNodeId = `table-${rel.sourceTable}`;
        const targetNodeId = `table-${rel.targetTable}`;

        if (!currentEdgeMap.has(rel.id)) {
          const sourceNode = currentNodeMap.get(sourceNodeId);
          const targetNode = currentNodeMap.get(targetNodeId);

          if (sourceNode && targetNode) {
            // Determine side based on node x coordinates to prevent awkward crossings
            const srcPos = sourceNode.getPosition();
            const tgtPos = targetNode.getPosition();
            const srcPortSuffix = srcPos.x <= tgtPos.x ? '-right' : '-left';
            const tgtPortSuffix = srcPos.x <= tgtPos.x ? '-left' : '-right';

            graph.addEdge({
              id: rel.id,
              source: { cell: sourceNodeId, port: `${rel.sourceField}${srcPortSuffix}` },
              target: { cell: targetNodeId, port: `${rel.targetField}${tgtPortSuffix}` },
              router: {
                name: 'er',
                args: { offset: 32, direction: 'H' },
              },
              connector: {
                name: 'rounded',
                args: { radius: 6 },
              },
              attrs: {
                line: {
                  stroke: '#d6baff',
                  strokeWidth: 2,
                  targetMarker: {
                    name: 'classic',
                    size: 8,
                  },
                },
              },
              data: { relationship: rel },
            });
          }
        }
      });
    });
  }, [tables, relationships]);

  useEffect(() => {
    syncGraph();
  }, [syncGraph]);

  return (
    <div className="relative w-full h-full min-w-0 min-h-0 overflow-hidden select-none">
      <div ref={containerRef} className="w-full h-full" />
      <PortalProvider />
    </div>
  );
};

export default DbCanvasX6;
