'use client';

import React, { useState, useCallback, useRef } from 'react';
import {
  Upload, Database, X, Code, FileJson, CheckCircle, AlertCircle,
  ZoomIn, ZoomOut, Scan, Table2, GitBranch, Pencil, Copy, Trash2, Save, Download, Plus
} from 'lucide-react';
import type { TableDef } from '../core/types';
import { useSchema } from '../store/schema-context';
import { useDiagramLayout } from '../store/diagram-layout-context';
import { parseSchemaJson, parseSchemaSql } from '../core/schema-parser';
import DbCanvasContextMenu, { type ContextMenuAction } from './menu/DbCanvasContextMenu';
import { useDiagramPersistence } from '../hooks/useDiagramPersistence';
import { exportSQL } from '../core/sql-export';
import { TableSchemaDialog } from './dialogs/TableSchemaDialog';
import DbCanvasX6, { type DbCanvasX6Handle } from './DbCanvasX6';

interface DbSchemaEditorProps {
  diagramId?: string;
}

export default function DbSchemaEditor({ diagramId }: DbSchemaEditorProps) {
  const {
    tables: contextTables,
    relationships,
    createRelationship,
    removeRelationship,
    setAllTables,
    addTable,
    removeTable
  } = useSchema();
  const { selectSection } = useDiagramLayout();
  const canvasRef = useRef<DbCanvasX6Handle>(null);

  const [zoomLevel, setZoomLevel] = useState('100%');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; items: ContextMenuAction[] } | null>(null);

  // Import modal state
  const [showImport, setShowImport] = useState(false);
  const [importMode, setImportMode] = useState<'json' | 'sql'>('json');
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);

  // Table Schema Dialog state
  const [schemaDialogOpen, setSchemaDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<TableDef | undefined>(undefined);

  // Persistence
  const { save } = useDiagramPersistence(diagramId || 'default');
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

  const handleImport = useCallback(() => {
    setImportError('');
    setImportSuccess(false);
    try {
      const trimmed = importText.trim();
      if (!trimmed) {
        setImportError('Please enter schema data');
        return;
      }
      const parsed = importMode === 'json' ? parseSchemaJson(trimmed) : parseSchemaSql(trimmed);
      if (parsed.length === 0) {
        setImportError('No tables found in input');
        return;
      }
      setAllTables(parsed);
      setImportSuccess(true);
      setTimeout(() => setShowImport(false), 800);
      setTimeout(() => canvasRef.current?.zoomToFit(), 300);
    } catch (e: unknown) {
      setImportError(e instanceof Error ? e.message : 'Failed to parse schema');
    }
  }, [importText, importMode, setAllTables]);

  const handleZoomChange = useCallback((zoom: number) => {
    setZoomLevel(`${Math.round(zoom * 100)}%`);
  }, []);

  const handleNodeContextMenu = useCallback((e: React.MouseEvent | MouseEvent, table: TableDef) => {
    const tableIndex = contextTables.findIndex((t) => t.name === table.name);
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        {
          id: 'edit',
          label: 'Edit Table',
          icon: Pencil,
          onSelect: () => {
            setEditingTable(table);
            setSchemaDialogOpen(true);
          },
        },
        {
          id: 'duplicate',
          label: 'Duplicate Table',
          icon: Copy,
          onSelect: () => {
            addTable(`${table.name}_copy`);
          },
        },
        {
          id: 'delete',
          label: 'Delete Table',
          icon: Trash2,
          danger: true,
          onSelect: () => {
            if (tableIndex >= 0) removeTable(tableIndex);
          },
        },
      ],
    });
  }, [contextTables, addTable, removeTable]);

  const handleBlankContextMenu = useCallback((e: React.MouseEvent | MouseEvent) => {
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        {
          id: 'new-table',
          label: 'New Table',
          icon: Table2,
          onSelect: () => {
            setEditingTable(undefined);
            setSchemaDialogOpen(true);
          },
        },
        {
          id: 'import',
          label: 'Import SQL / JSON',
          icon: Upload,
          onSelect: () => {
            setShowImport(true);
            setImportError('');
            setImportSuccess(false);
            setImportText('');
          },
        },
        {
          id: 'fit-view',
          label: 'Fit to View',
          icon: Scan,
          onSelect: () => {
            canvasRef.current?.zoomToFit();
          },
        },
      ],
    });
  }, []);

  const importPlaceholder = importMode === 'json'
    ? '[{"name":"users","columns":[{"name":"id","type":"UUID","isPK":true}]}]'
    : 'CREATE TABLE users (\n  id UUID PRIMARY KEY,\n  email VARCHAR(255) NOT NULL\n);';

  return (
    <div className="relative h-full w-full min-w-0 overflow-hidden rounded-[20px] bg-surface-container-lowest/85">
      {/* Top toolbar */}
      <div className="absolute left-4 right-4 top-4 z-10 flex flex-wrap items-center gap-2 pointer-events-auto">
        <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/[0.08] px-3 py-2 text-xs font-bold text-on-surface backdrop-blur-xl">
          <Database className="h-3.5 w-3.5 text-primary" />
          Project schema (AntV X6)
        </div>

        <button
          onClick={() => {
            setEditingTable(undefined);
            setSchemaDialogOpen(true);
          }}
          className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-surface-container/85 px-3 py-2 text-xs font-bold text-on-surface-variant backdrop-blur-xl transition-colors hover:bg-surface-container-high hover:text-on-surface"
        >
          <Plus className="w-3.5 h-3.5 text-primary" />
          Add Table
        </button>

        <button
          onClick={() => { setShowImport(true); setImportError(''); setImportSuccess(false); setImportText(''); }}
          className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-surface-container/85 px-3 py-2 text-xs font-bold text-on-surface-variant backdrop-blur-xl transition-colors hover:bg-surface-container-high hover:text-on-surface"
        >
          <Upload className="w-3.5 h-3.5 text-secondary" />
          Import Schema
        </button>

        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-surface-container/85 px-3 py-2 text-xs font-bold text-on-surface-variant backdrop-blur-xl transition-colors hover:bg-surface-container-high hover:text-on-surface"
        >
          <Save className="w-3.5 h-3.5 text-secondary" />
          {saveStatus === 'saved' ? 'Saved!' : 'Save'}
        </button>

        <button
          onClick={handleExportSQL}
          className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-surface-container/85 px-3 py-2 text-xs font-bold text-on-surface-variant backdrop-blur-xl transition-colors hover:bg-surface-container-high hover:text-on-surface"
          title="Copy SQL DDL to clipboard"
        >
          <Download className="w-3.5 h-3.5 text-primary" />
          SQL
        </button>
      </div>

      {/* AntV X6 Canvas */}
      <div className="w-full h-full">
        <DbCanvasX6
          tables={contextTables}
          relationships={relationships}
          onCreateRelationship={createRelationship}
          onRemoveRelationship={removeRelationship}
          onZoomChange={handleZoomChange}
          onNodeContextMenu={handleNodeContextMenu}
          onBlankContextMenu={handleBlankContextMenu}
          canvasRef={canvasRef}
        />
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <DbCanvasContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Bottom Zoom & View Controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
        <div className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-surface-container/90 backdrop-blur-xl border border-white/10 shadow-lg">
          <button
            onClick={() => canvasRef.current?.zoomOut()}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant/60 hover:bg-white/5 hover:text-on-surface-variant transition-all"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => canvasRef.current?.zoomReset()}
            className="w-[52px] h-8 rounded-lg flex items-center justify-center text-xs font-semibold text-on-surface-variant/80 hover:bg-white/5 transition-all font-mono tabular-nums"
            title="Reset to 100%"
          >
            {zoomLevel}
          </button>
          <button
            onClick={() => canvasRef.current?.zoomIn()}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant/60 hover:bg-white/5 hover:text-on-surface-variant transition-all"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-white/10 mx-1" />

          <button
            onClick={() => canvasRef.current?.zoomToFit()}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant/60 hover:bg-white/5 hover:text-on-surface-variant transition-all"
            title="Fit to Screen"
          >
            <Scan className="w-4 h-4" />
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
