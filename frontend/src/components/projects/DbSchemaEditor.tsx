'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Handle,
  Position,
  Background,
  Controls,
  MarkerType,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  type Node,
  type Edge,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Key, ExternalLink, Upload, Database, X, Code, FileJson, CheckCircle, AlertCircle } from 'lucide-react';
import type { TableDef } from '@/types/db-schema';
import { useSchema } from '@/context/schema-context';
import { parseSchemaJson, parseSchemaSql, demoSchemas } from '@/lib/schema-parser';

const HEADER_H = 44;
const ROW_H = 34;

interface TableNodeData extends Record<string, unknown> {
  table: TableDef;
}

type TableFlowNode = Node<TableNodeData, 'tableNode'>;
type FlowEdge = Edge;

function buildDiagram(tables: TableDef[]): { nodes: TableFlowNode[]; edges: FlowEdge[] } {
  const cols = Math.ceil(Math.sqrt(tables.length));
  const tableIds = new Map<string, string>();
  let idCounter = 0;

  const nodes: TableFlowNode[] = tables.map((table, i) => {
    const nodeId = table.id || `tn${++idCounter}`;
    tableIds.set(table.name, nodeId);
    return {
      id: nodeId,
      type: 'tableNode',
      position: { x: 50 + (i % cols) * 380, y: 100 + Math.floor(i / cols) * 300 },
      data: { table },
    };
  });

  const edges: FlowEdge[] = [];
  for (const table of tables) {
    const sourceId = tableIds.get(table.name)!;
    for (const col of table.columns) {
      if (col.isFK && col.references) {
        const targetId = tableIds.get(col.references.table);
        if (targetId) {
          edges.push({
            id: `e-${sourceId}-${col.name}`,
            source: sourceId,
            sourceHandle: `col-${col.name}-source`,
            target: targetId,
            targetHandle: `col-${col.references.column}-target`,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#d6baff', strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#d6baff' },
            label: col.name,
            labelStyle: { fill: '#cdc2d7', fontSize: 11, fontWeight: 600 },
          });
        }
      }
    }
  }

  return { nodes, edges };
}

function TableNode({ data }: NodeProps<TableFlowNode>) {
  const { table } = data;

  return (
    <div className="rounded-xl border border-white/15 bg-surface-container overflow-hidden shadow-lg w-[260px]">
      <div className="h-[44px] bg-primary/15 border-b border-white/10 flex items-center px-4">
        <span className="text-sm font-bold text-primary tracking-tight">{table.name}</span>
      </div>
      <div className="divide-y divide-white/5">
        {table.columns.map((col, i) => {
          const yOffset = HEADER_H + i * ROW_H + ROW_H / 2;
          return (
            <div key={col.name} className="h-[34px] flex items-center px-4 text-xs relative group hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {col.isPK ? (
                  <Key className="w-3 h-3 text-primary shrink-0" />
                ) : col.isFK ? (
                  <ExternalLink className="w-3 h-3 text-secondary shrink-0" />
                ) : (
                  <div className="w-3 h-3 shrink-0" />
                )}
                <span className="text-on-surface font-mono font-medium truncate">
                  {col.name}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-outline font-mono text-[10px] uppercase tracking-wider">{col.type}</span>
                {col.nullable && (
                  <span className="text-outline-variant/40 text-[10px] font-medium">NULL</span>
                )}
              </div>

              {col.isPK && (
                <Handle
                  type="target"
                  position={Position.Left}
                  id={`col-${col.name}-target`}
                  style={{ top: yOffset, background: '#d6baff', border: '2px solid #201f21', width: 8, height: 8 }}
                />
              )}
              {col.isFK && (
                <Handle
                  type="source"
                  position={Position.Right}
                  id={`col-${col.name}-source`}
                  style={{ top: yOffset, background: '#d3fbff', border: '2px solid #201f21', width: 8, height: 8 }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const nodeTypes = { tableNode: TableNode };

function EditorInner() {
  const { tables: contextTables } = useSchema();
  const reactFlowInstance = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState<TableFlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<FlowEdge>([]);

  const loadTables = useCallback((tables: TableDef[]) => {
    const { nodes: newNodes, edges: newEdges } = buildDiagram(tables);
    setNodes(newNodes);
    setEdges(newEdges);
    setTimeout(() => reactFlowInstance.fitView({ duration: 300 }), 50);
  }, [setNodes, setEdges, reactFlowInstance]);

  useEffect(() => {
    loadTables(contextTables);
  }, [contextTables, loadTables]);

  const [showImport, setShowImport] = useState(false);
  const [importMode, setImportMode] = useState<'json' | 'sql'>('json');
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);
  const [activeSchema, setActiveSchema] = useState('Current Project');
  const [showSchemaMenu, setShowSchemaMenu] = useState(false);

  const { setAllTables } = useSchema();

  const handleSelectDemo = useCallback((label: string) => {
    const schema = demoSchemas.find((s) => s.label === label);
    if (schema) {
      setAllTables(schema.tables.map((t, i) => ({ ...t, id: `t${i + 1}` })));
      setActiveSchema(label);
      setShowSchemaMenu(false);
    }
  }, [setAllTables]);

  const handleImport = useCallback(() => {
    setImportError('');
    setImportSuccess(false);
    try {
      const trimmed = importText.trim();
      if (!trimmed) { setImportError('Please enter schema data'); return; }
      const parsed = importMode === 'json' ? parseSchemaJson(trimmed) : parseSchemaSql(trimmed);
      if (parsed.length === 0) { setImportError('No tables found in input'); return; }
      setAllTables(parsed);
      setImportSuccess(true);
      setActiveSchema('(imported)');
      setTimeout(() => setShowImport(false), 800);
    } catch (e: unknown) {
      setImportError(e instanceof Error ? e.message : 'Failed to parse schema');
    }
  }, [importText, importMode, setAllTables]);

  const importPlaceholder = importMode === 'json'
    ? '[{"name":"users","columns":[{"name":"id","type":"UUID","isPK":true}]}]'
    : 'CREATE TABLE users (\n  id UUID PRIMARY KEY,\n  email VARCHAR(255) NOT NULL\n);';

  return (
    <div className="w-full h-full relative">
      {/* Toolbar */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => setShowSchemaMenu(!showSchemaMenu)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container/90 backdrop-blur-md border border-white/10 text-xs font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            <Database className="w-3.5 h-3.5 text-primary" />
            <span className="max-w-[120px] truncate">{activeSchema}</span>
          </button>
          {showSchemaMenu && (
            <div className="absolute top-full left-0 mt-1 w-44 rounded-xl bg-surface-container border border-white/10 shadow-xl backdrop-blur-xl overflow-hidden z-20">
              {demoSchemas.map((s) => (
                <button
                  key={s.label}
                  onClick={() => handleSelectDemo(s.label)}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-white/5 transition-colors ${activeSchema === s.label ? 'text-primary bg-primary/5' : 'text-on-surface-variant'}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => { setShowImport(true); setImportError(''); setImportSuccess(false); setImportText(''); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container/90 backdrop-blur-md border border-white/10 text-xs font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors"
        >
          <Upload className="w-3.5 h-3.5 text-secondary" />
          Import Schema
        </button>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        colorMode="dark"
        minZoom={0.3}
        maxZoom={2}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="rgba(255,255,255,0.05)"
        />
        <Controls
          className="[&>button]:bg-surface-container [&>button]:border-white/10 [&>button]:text-on-surface-variant [&>button]:hover:bg-surface-container-high"
          showInteractive={false}
        />
      </ReactFlow>

      {/* Import Modal */}
      {showImport && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-xl mx-4 rounded-2xl border border-white/10 shadow-2xl bg-surface-container/95 backdrop-blur-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h3 className="text-sm font-bold text-on-surface">Import Schema</h3>
              <button onClick={() => setShowImport(false)} className="p-1 rounded-lg hover:bg-white/5">
                <X className="w-4 h-4 text-on-surface-variant" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/5">
              <button
                onClick={() => { setImportMode('json'); setImportError(''); setImportSuccess(false); }}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium transition-colors ${importMode === 'json' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant/60 hover:text-on-surface-variant'}`}
              >
                <FileJson className="w-3.5 h-3.5" /> JSON
              </button>
              <button
                onClick={() => { setImportMode('sql'); setImportError(''); setImportSuccess(false); }}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium transition-colors ${importMode === 'sql' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant/60 hover:text-on-surface-variant'}`}
              >
                <Code className="w-3.5 h-3.5" /> SQL DDL
              </button>
            </div>

            <div className="p-5">
              <textarea
                value={importText}
                onChange={(e) => { setImportText(e.target.value); setImportError(''); setImportSuccess(false); }}
                placeholder={importPlaceholder}
                className="w-full h-44 px-4 py-3 rounded-xl bg-surface-container-low border border-white/10 text-xs font-mono text-on-surface placeholder:text-outline/30 focus:border-primary outline-none resize-none"
                spellCheck={false}
              />
              {importError && (
                <div className="flex items-center gap-2 mt-3 text-xs text-error">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {importError}
                </div>
              )}
              {importSuccess && (
                <div className="flex items-center gap-2 mt-3 text-xs text-secondary">
                  <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                  Schema imported successfully
                </div>
              )}
              <button
                onClick={handleImport}
                disabled={!importText.trim()}
                className="mt-4 w-full py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-lg shadow-primary/20 hover:saturate-150 transition-all disabled:opacity-40"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DbSchemaEditor() {
  return (
    <ReactFlowProvider>
      <EditorInner />
    </ReactFlowProvider>
  );
}
