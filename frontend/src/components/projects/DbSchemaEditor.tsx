'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  ReactFlow,
  Handle,
  Position,
  Background,
  MarkerType,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  useOnViewportChange,
  type Node,
  type Edge,
  type NodeProps,
  type Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Key, ExternalLink, Upload, Database, X, Code, FileJson, CheckCircle, AlertCircle, ZoomIn, ZoomOut, Scan, Undo, Redo, Table2, GitBranch, Pencil, Copy, Trash2, Save, Download } from 'lucide-react';
import type { TableDef } from '@/types/db-schema';
import { useSchema } from '@/context/schema-context';
import { useDiagramLayout } from '@/context/diagram-layout-context';
import { parseSchemaJson, parseSchemaSql, demoSchemas } from '@/lib/schema-parser';
import DbCanvasContextMenu, { type ContextMenuAction } from './DbCanvasContextMenu';
import { RelationshipEdge, type RelEdge } from './RelationshipEdge';
import MarkerDefinitions from './MarkerDefinitions';
import { useDiagramPersistence } from '@/hooks/use-diagram-persistence';
import { exportSQL } from '@/lib/sql-export';
import { TableSchemaDialog } from '@/dialogs/table-schema-dialog';
import { AreaNode, type AreaNodeType } from './AreaNode';
import { DbTableNode, type DbTableNodeType } from './DbTableNode';
import { demoAreas, demoTables, demoRelationships as demoRels } from '@/lib/demo-schema-data';
import type { DemoRelationship } from '@/lib/demo-schema-data';
import { sourceHandle, targetHandle } from '@/lib/handle-constants';

const HEADER_H = 44;
const ROW_H = 34;

interface TableNodeData extends Record<string, unknown> {
  table: TableDef;
}

type TableFlowNode = Node<TableNodeData, 'tableNode'>;

function buildNodes(tables: TableDef[]): TableFlowNode[] {
  const cols = Math.ceil(Math.sqrt(tables.length));
  let idCounter = 0;
  return tables.map((table, i) => {
    const nodeId = table.id || `tn${++idCounter}`;
    return {
      id: nodeId,
      type: 'tableNode',
      position: { x: 50 + (i % cols) * 380, y: 100 + Math.floor(i / cols) * 300 },
      data: { table },
    };
  });
}

function TableNode({ data, selected }: NodeProps<TableFlowNode>) {
  const { table } = data;

  return (
    <div className={`rounded-xl border transition-colors ${selected ? 'border-primary/40' : 'border-white/15'} bg-surface-container shadow-lg w-[260px] group`}>
      <div className="h-[44px] bg-primary/15 border-b border-white/10 flex items-center px-4">
        <span className="text-sm font-bold text-primary tracking-tight">{table.name}</span>
      </div>
      <div className="divide-y divide-white/5">
        {table.columns.map((col, i) => {
          const yOffset = HEADER_H + i * ROW_H + ROW_H / 2;
          return (
            <div key={col.name} className="h-[34px] flex items-center px-4 text-xs relative hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {col.isPK ? (
                  <Key className="w-3 h-3 text-primary shrink-0" />
                ) : col.isFK ? (
                  <ExternalLink className="w-3 h-3 text-secondary shrink-0" />
                ) : (
                  <div className="w-3 h-3 shrink-0" />
                )}
                <span className="text-on-surface font-mono font-medium truncate">{col.name}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-outline font-mono text-[10px] uppercase tracking-wider">{col.type}</span>
                {col.nullable && (
                  <span className="text-outline-variant/40 text-[10px] font-medium">NULL</span>
                )}
              </div>

              {/* Source handle — LEFT */}
              <Handle
                type="source"
                position={Position.Left}
                id={`left_rel_${col.name}`}
                style={{ top: yOffset, background: '#d3fbff', border: '2px solid #201f21', width: 7, height: 7 }}
                className={`!invisible group-hover:!visible transition-opacity`}
              />
              {/* Source handle — RIGHT */}
              <Handle
                type="source"
                position={Position.Right}
                id={`right_rel_${col.name}`}
                style={{ top: yOffset, background: '#d3fbff', border: '2px solid #201f21', width: 7, height: 7 }}
                className={`!invisible group-hover:!visible transition-opacity`}
              />
              {/* Target handle — only for PK columns */}
              {col.isPK && (
                <Handle
                  type="target"
                  position={Position.Left}
                  id={`target_rel_0_${col.name}`}
                  style={{ top: yOffset, background: '#d6baff', border: '2px solid #201f21', width: 7, height: 7 }}
                  className="!invisible"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const nodeTypes = { tableNode: TableNode, area: AreaNode, demoTable: DbTableNode };
const edgeTypes = { 'relationship-edge': RelationshipEdge };

function EditorInner({ diagramId }: { diagramId?: string }) {
  const { tables: contextTables, relationships, createRelationship, removeRelationship, setAllTables, addTable, removeTable } = useSchema();
  const { selectSection } = useDiagramLayout();
  const reactFlowInstance = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState<TableFlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<RelEdge>([]);
  const [zoomLevel, setZoomLevel] = useState('100%');
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const historyRef = useRef<{ past: TableFlowNode[][]; future: TableFlowNode[][] }>({ past: [], future: [] });
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; items: ContextMenuAction[] } | null>(null);

  useOnViewportChange({
    onChange: ({ zoom }) => setZoomLevel(`${Math.round(zoom * 100)}%`),
  });

  // Build node IDs lookup
  const nodeIdByTable = useMemo(() => {
    const map = new Map<string, string>();
    for (const node of nodes) {
      const tableName = (node.data as TableNodeData).table?.name;
      if (tableName) map.set(tableName, node.id);
    }
    return map;
  }, [nodes]);

  // Derive edges from relationships
  useEffect(() => {
    const newEdges: RelEdge[] = relationships.map((rel) => {
      const source = nodeIdByTable.get(rel.sourceTable);
      const target = nodeIdByTable.get(rel.targetTable);
      if (!source || !target) return null;
      return {
        id: rel.id,
        source,
        target,
        sourceHandle: sourceHandle(rel.sourceField, 'right'),
        targetHandle: targetHandle(rel.targetField, 0),
        type: 'relationship-edge',
        data: { relationship: rel },
      } as RelEdge;
    }).filter(Boolean) as RelEdge[];
    setEdges(newEdges);
  }, [relationships, nodeIdByTable, setEdges]);

  const pushHistory = useCallback((prevNodes: TableFlowNode[]) => {
    historyRef.current.past.push(prevNodes);
    historyRef.current.future = [];
    setCanUndo(true);
    setCanRedo(false);
  }, []);

  const handleNodesChange = useCallback((changes: any[]) => {
    const hasDragged = changes.some((c) => c.type === 'position' && c.dragging === false);
    if (hasDragged) pushHistory(nodes);
    onNodesChange(changes);
  }, [nodes, pushHistory, onNodesChange]);

  const handleEdgesChange = useCallback((changes: any[]) => {
    const removed = changes.filter((c: any) => c.type === 'remove');
    removed.forEach((c: any) => removeRelationship(c.id));
    onEdgesChange(changes);
  }, [onEdgesChange, removeRelationship]);

  const handleUndo = useCallback(() => {
    const { past, future } = historyRef.current;
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    historyRef.current.past = past.slice(0, -1);
    historyRef.current.future = [nodes, ...future];
    setNodes(previous);
    setCanUndo(historyRef.current.past.length > 0);
    setCanRedo(true);
  }, [nodes, setNodes]);

  const handleRedo = useCallback(() => {
    const { past, future } = historyRef.current;
    if (future.length === 0) return;
    const next = future[0];
    historyRef.current.future = future.slice(1);
    historyRef.current.past = [...past, nodes];
    setNodes(next);
    setCanRedo(historyRef.current.future.length > 0);
    setCanUndo(true);
  }, [nodes, setNodes]);

  // Load tables and auto-create relationships from FK definitions
  const loadTables = useCallback((tables: TableDef[]) => {
    const newNodes = buildNodes(tables);
    setNodes(newNodes);
    historyRef.current = { past: [], future: [] };
    setCanUndo(false);
    setCanRedo(false);
    // Auto-create relationships from FK columns
    for (const table of tables) {
      for (const col of table.columns) {
        if (col.isFK && col.references) {
          createRelationship(table.name, col.name, col.references.table, col.references.column);
        }
      }
    }
    setTimeout(() => reactFlowInstance.fitView({ duration: 300 }), 100);
  }, [setNodes, reactFlowInstance, createRelationship]);

  useEffect(() => {
    loadTables(contextTables);
  }, [contextTables, loadTables]);

  // onConnect: create relationship from drag
  const onConnect = useCallback((params: Connection) => {
    const srcField = params.sourceHandle
      ? params.sourceHandle.replace(/^(left_rel_|right_rel_|src_)/, '')
      : '';
    const tgtField = params.targetHandle
      ? params.targetHandle.replace(/^target_rel_\d+_/, '')
      : '';
    if (!srcField || !tgtField) return;
    const sourceNode = nodes.find((n) => n.id === params.source);
    const targetNode = nodes.find((n) => n.id === params.target);
    const sourceTable = sourceNode?.data?.table?.name || (sourceNode?.data as any)?.label;
    const targetTable = targetNode?.data?.table?.name || (targetNode?.data as any)?.label;
    if (!sourceTable || !targetTable) return;
    createRelationship(sourceTable, srcField, targetTable, tgtField);
  }, [nodes, createRelationship]);

  const [showImport, setShowImport] = useState(false);
  const [importMode, setImportMode] = useState<'json' | 'sql'>('json');
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);
  const [activeSchema, setActiveSchema] = useState('Current Project');
  const [showSchemaMenu, setShowSchemaMenu] = useState(false);

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

  // Table Schema Dialog
  const [schemaDialogOpen, setSchemaDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<TableDef | undefined>(undefined);

  // Persistence
  const { save, load } = useDiagramPersistence(diagramId || 'default');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const handleSave = useCallback(async () => {
    setSaveStatus('saving');
    try {
      await save();
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('idle');
    }
  }, [save]);

  const handleExportSQL = useCallback(() => {
    const sql = exportSQL(contextTables, relationships);
    navigator.clipboard.writeText(sql);
  }, [contextTables, relationships]);

  // Auto-load saved data on mount
  useEffect(() => {
    load().then((data) => {
      if (data) setActiveSchema('(saved)');
    });
  }, []);

  const importPlaceholder = importMode === 'json'
    ? '[{"name":"users","columns":[{"name":"id","type":"UUID","isPK":true}]}]'
    : 'CREATE TABLE users (\n  id UUID PRIMARY KEY,\n  email VARCHAR(255) NOT NULL\n);';

  const loadDemoData = useCallback(() => {
    const flowNodes: any[] = [];

    // Add area nodes
    for (const area of demoAreas) {
      flowNodes.push({
        id: area.id,
        type: 'area',
        position: area.position,
        data: { label: area.label, color: area.color },
        style: { width: area.size.width, height: area.size.height },
        zIndex: -10,
        draggable: true,
        selectable: true,
      });
    }

    // Add table nodes
    for (const table of demoTables) {
      flowNodes.push({
        id: table.id,
        type: 'demoTable',
        position: { x: table.position.x, y: table.position.y },
        data: { label: table.name, fields: table.fields, color: table.color },
        parentId: table.parentId,
        extent: table.parentId ? 'parent' as const : undefined,
        draggable: true,
        selectable: true,
      });
    }

    setNodes(flowNodes as any);

    // Create edges from demo relationships
    const flowEdges: RelEdge[] = demoRels.map((rel: DemoRelationship) => ({
      id: rel.id,
      source: rel.sourceTable,
      target: rel.targetTable,
      sourceHandle: sourceHandle(rel.sourceField, 'right'),
      targetHandle: targetHandle(rel.targetField, 0),
      type: 'relationship-edge',
      data: {
        relationship: {
          id: rel.id,
          sourceTable: rel.sourceTable,
          sourceField: rel.sourceField,
          targetTable: rel.targetTable,
          targetField: rel.targetField,
        },
      },
    }));
    setEdges(flowEdges);

    historyRef.current = { past: [], future: [] };
    setCanUndo(false);
    setCanRedo(false);
    setTimeout(() => reactFlowInstance.fitView({ duration: 300 }), 100);
  }, [setNodes, setEdges, reactFlowInstance]);

  const zoomDuration = 200;

  return (
    <div className="w-full h-full relative">
      {/* Top toolbar */}
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
              <button
                onClick={() => { loadDemoData(); setActiveSchema('ChartDB Demo'); setShowSchemaMenu(false); }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-white/5 transition-colors text-on-surface-variant"
              >
                🗄️ ChartDB Demo
              </button>
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
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container/90 backdrop-blur-md border border-white/10 text-xs font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors"
        >
          <Save className="w-3.5 h-3.5 text-secondary" />
          {saveStatus === 'saved' ? 'Saved!' : 'Save'}
        </button>
        <button
          onClick={handleExportSQL}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container/90 backdrop-blur-md border border-white/10 text-xs font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-primary" />
          SQL
        </button>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        colorMode="dark"
        minZoom={0.3}
        maxZoom={2}
        panOnDrag={[2]}
        panOnScroll={false}
        onPaneContextMenu={(e) => {
          e.preventDefault();
          setContextMenu({
            x: e.clientX, y: e.clientY,
            items: [
              { id: 'new-table', label: 'New Table', icon: Table2, onSelect: () => addTable() },
              { id: 'new-relationship', label: 'New Relationship', icon: GitBranch, onSelect: () => {} },
              { id: 'import', label: 'Import SQL/DBML', icon: Upload, onSelect: () => { setShowImport(true); setImportError(''); setImportSuccess(false); setImportText(''); } },
            ],
          });
        }}
        onNodeContextMenu={(e, node) => {
          e.preventDefault();
          const tableIndex = contextTables.findIndex((t) => (t.id || t.name) === ((node.data as any).table?.id || (node.data as any).table?.name));
          setContextMenu({
            x: e.clientX, y: e.clientY,
            items: [
              { id: 'edit', label: 'Edit Table', icon: Pencil, onSelect: () => { selectSection('tables'); } },
              { id: 'duplicate', label: 'Duplicate Table', icon: Copy, onSelect: () => { addTable(`${(node.data as any).table?.name}_copy`); } },
              { id: 'delete', label: 'Delete Table', icon: Trash2, danger: true, onSelect: () => { if (tableIndex >= 0) removeTable(tableIndex); } },
            ],
          });
        }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="rgba(255,255,255,0.05)"
        />
        <MarkerDefinitions />
      </ReactFlow>

      {/* Context Menu */}
      {contextMenu && (
        <DbCanvasContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Bottom toolbar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
        <div className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-surface-container/90 backdrop-blur-xl border border-white/10 shadow-lg">
          <button
            onClick={() => reactFlowInstance.zoomOut({ duration: zoomDuration })}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant/60 hover:bg-white/5 hover:text-on-surface-variant transition-all"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => reactFlowInstance.fitView({ duration: zoomDuration })}
            className="w-[52px] h-8 rounded-lg flex items-center justify-center text-xs font-semibold text-on-surface-variant/80 hover:bg-white/5 transition-all font-mono tabular-nums"
            title="Fit View"
          >
            {zoomLevel}
          </button>
          <button
            onClick={() => reactFlowInstance.zoomIn({ duration: zoomDuration })}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant/60 hover:bg-white/5 hover:text-on-surface-variant transition-all"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-white/10 mx-1" />

          <button
            onClick={() => reactFlowInstance.fitView({ duration: 300, padding: 0.15 })}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant/60 hover:bg-white/5 hover:text-on-surface-variant transition-all"
            title="Fit View"
          >
            <Scan className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-white/10 mx-1" />

          <button
            onClick={handleUndo}
            disabled={!canUndo}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant/60 hover:bg-white/5 hover:text-on-surface-variant transition-all disabled:opacity-20 disabled:cursor-not-allowed"
            title="Undo"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant/60 hover:bg-white/5 hover:text-on-surface-variant transition-all disabled:opacity-20 disabled:cursor-not-allowed"
            title="Redo"
          >
            <Redo className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table Schema Dialog */}
      <TableSchemaDialog
        open={schemaDialogOpen}
        onOpenChange={setSchemaDialogOpen}
        table={editingTable}
        onSave={(name, fields) => {
          if (editingTable) {
            const idx = contextTables.findIndex((t) => t.name === editingTable.name);
            if (idx >= 0) {
              setAllTables(contextTables.map((t, i) =>
                i === idx ? { ...t, name, columns: fields.map((f) => ({
                  name: f.name,
                  type: f.type,
                  isPK: f.isPK,
                  isFK: false,
                  nullable: f.nullable,
                })) } : t
              ));
            }
          } else {
            addTable(name);
          }
          setSchemaDialogOpen(false);
        }}
      />

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

interface DbSchemaEditorProps {
  diagramId?: string;
}

export default function DbSchemaEditor({ diagramId }: DbSchemaEditorProps) {
  return (
    <ReactFlowProvider>
      <EditorInner diagramId={diagramId} />
    </ReactFlowProvider>
  );
}
