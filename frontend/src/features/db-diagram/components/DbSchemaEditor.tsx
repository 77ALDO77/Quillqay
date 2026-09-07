'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Upload, Database, X, Code, FileJson, CheckCircle, AlertCircle,
  ZoomIn, ZoomOut, Scan, Table2, GitBranch, Pencil, Copy, Trash2, Save, Download, Plus, Sparkles,
  ArrowLeft, ChevronRight, Check
} from 'lucide-react';
import type { TableDef, SqlDialect } from '../core/types';
import { useSchema } from '../store/schema-context';
import { useDiagramLayout } from '../store/diagram-layout-context';
import { parseSchemaJson, parseSchemaSql, DIALECT_OPTIONS } from '../core/schema-parser';
import DbCanvasContextMenu, { type ContextMenuAction } from './menu/DbCanvasContextMenu';
import { useDiagramPersistence } from '../hooks/useDiagramPersistence';
import { exportSQL } from '../core/sql-export';
import { TableSchemaDialog } from './dialogs/TableSchemaDialog';
import DbCanvasX6, { type DbCanvasX6Handle } from './DbCanvasX6';
import {
  PostgresLogo,
  MySqlLogo,
  MariaDbLogo,
  SqliteLogo,
  SqlServerLogo,
  OracleLogo,
  JsonLogo,
} from './icons/DatabaseLogos';

interface DatabaseOptionItem {
  id: SqlDialect | 'json';
  name: string;
  subtitle: string;
  category: 'transactional' | 'analytical';
  logo: React.FC<{ className?: string; size?: number }>;
  accentColor: string;
}

const DATABASE_OPTIONS: DatabaseOptionItem[] = [
  {
    id: 'postgres',
    name: 'PostgreSQL',
    subtitle: 'Advanced open-source SQL database',
    category: 'transactional',
    logo: PostgresLogo,
    accentColor: '#336791',
  },
  {
    id: 'mysql',
    name: 'MySQL',
    subtitle: 'World most popular open-source relational DB',
    category: 'transactional',
    logo: MySqlLogo,
    accentColor: '#00758F',
  },
  {
    id: 'mariadb',
    name: 'MariaDB',
    subtitle: 'Fast, robust open-source relational database',
    category: 'transactional',
    logo: MariaDbLogo,
    accentColor: '#C0765A',
  },
  {
    id: 'sqlite',
    name: 'SQLite',
    subtitle: 'Serverless, zero-config embedded SQL database',
    category: 'transactional',
    logo: SqliteLogo,
    accentColor: '#003B57',
  },
  {
    id: 'sqlserver',
    name: 'Microsoft SQL Server',
    subtitle: 'Enterprise-grade relational database system',
    category: 'transactional',
    logo: SqlServerLogo,
    accentColor: '#CC292B',
  },
  {
    id: 'oracle',
    name: 'Oracle DB',
    subtitle: 'Enterprise multitenant relational database',
    category: 'transactional',
    logo: OracleLogo,
    accentColor: '#F80000',
  },
  {
    id: 'json',
    name: 'JSON Schema',
    subtitle: 'Structured table and relationship definition',
    category: 'analytical',
    logo: JsonLogo,
    accentColor: '#aa73ff',
  },
];

interface DbSchemaEditorProps {
  diagramId?: string;
  projectId?: string;
}

export default function DbSchemaEditor({ diagramId, projectId: propProjectId }: DbSchemaEditorProps) {
  const params = useParams();
  const effectiveProjectId = propProjectId || (params.id as string);
  const effectiveDiagramId = diagramId || (params.diagramId as string) || 'default';
  const {
    tables: contextTables,
    relationships,
    createRelationship,
    removeRelationship,
    setAllTables,
    setTablesAndRelationships,
    addTable,
    removeTable
  } = useSchema();
  const { selectSection } = useDiagramLayout();
  const canvasRef = useRef<DbCanvasX6Handle>(null);

  const [zoomLevel, setZoomLevel] = useState('100%');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; items: ContextMenuAction[] } | null>(null);

  // Import modal state
  const [showImport, setShowImport] = useState(false);
  const [importStep, setImportStep] = useState<'select-db' | 'paste-code'>('select-db');
  const [dbCategory, setDbCategory] = useState<'transactional' | 'analytical'>('transactional');
  const [importMode, setImportMode] = useState<'sql' | 'json'>('sql');
  const [selectedDialect, setSelectedDialect] = useState<SqlDialect>('postgres');
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);
  const [importMessage, setImportMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openImportModal = useCallback(() => {
    setShowImport(true);
    setImportStep('select-db');
    setDbCategory('transactional');
    setImportError('');
    setImportSuccess(false);
    setImportMessage('');
  }, []);

  // Table Schema Dialog state
  const [schemaDialogOpen, setSchemaDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<TableDef | undefined>(undefined);

  // Persistence
  const { save } = useDiagramPersistence(effectiveDiagramId, effectiveProjectId);
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
    setImportMessage('');
    try {
      const trimmed = importText.trim();
      if (!trimmed) {
        setImportError('Please enter schema data or SQL DDL');
        return;
      }
      const { tables: parsedTables, relationships: parsedRels } =
        importMode === 'json'
          ? parseSchemaJson(trimmed)
          : parseSchemaSql(trimmed, selectedDialect);

      if (parsedTables.length === 0) {
        setImportError('No tables found in input');
        return;
      }

      setTablesAndRelationships(parsedTables, parsedRels);
      setImportSuccess(true);
      const relCount = parsedRels.length;
      setImportMessage(
        `Imported ${parsedTables.length} table${parsedTables.length === 1 ? '' : 's'}${relCount > 0 ? ` and ${relCount} relationship${relCount === 1 ? '' : 's'}` : ''}`
      );
      setTimeout(() => setShowImport(false), 900);
      setTimeout(() => canvasRef.current?.zoomToFit(), 300);
    } catch (e: unknown) {
      setImportError(e instanceof Error ? e.message : 'Failed to parse schema');
    }
  }, [importText, importMode, selectedDialect, setTablesAndRelationships]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setImportText(content);
        setImportError('');
        setImportSuccess(false);
        if (file.name.endsWith('.json')) {
          setImportMode('json');
        } else if (file.name.endsWith('.sql')) {
          setImportMode('sql');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, []);

  const handleLoadSample = useCallback(() => {
    if (importMode === 'sql') {
      const dialectDef = DIALECT_OPTIONS.find((d) => d.id === selectedDialect);
      if (dialectDef) {
        setImportText(dialectDef.sampleDdl);
        setImportError('');
        setImportSuccess(false);
      }
    } else {
      const sampleJson = JSON.stringify({
        tables: [
          {
            name: 'users',
            columns: [
              { name: 'id', type: 'SERIAL', isPK: true },
              { name: 'email', type: 'VARCHAR(255)', nullable: false },
              { name: 'created_at', type: 'TIMESTAMPTZ' }
            ]
          },
          {
            name: 'orders',
            columns: [
              { name: 'id', type: 'SERIAL', isPK: true },
              { name: 'user_id', type: 'INTEGER', references: { table: 'users', column: 'id' } },
              { name: 'total', type: 'NUMERIC(10,2)' }
            ]
          }
        ]
      }, null, 2);
      setImportText(sampleJson);
      setImportError('');
      setImportSuccess(false);
    }
  }, [importMode, selectedDialect]);

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
          label: 'Import Schema',
          icon: Upload,
          onSelect: openImportModal,
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
  }, [openImportModal]);

  const currentDialect = DIALECT_OPTIONS.find((d) => d.id === selectedDialect) || DIALECT_OPTIONS[0];
  const importPlaceholder = importMode === 'json'
    ? '[\n  {\n    "name": "users",\n    "columns": [\n      { "name": "id", "type": "INT", "isPK": true }\n    ]\n  }\n]'
    : currentDialect.placeholder;

  return (
    <div className="relative h-full w-full min-w-0 overflow-hidden rounded-[20px] bg-surface-container-lowest/85">
      {/* Top toolbar */}
      <div className="absolute left-4 right-4 top-4 z-10 flex flex-wrap items-center gap-2 pointer-events-auto">
        <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/[0.08] px-3 py-2 text-xs font-bold text-on-surface backdrop-blur-xl">
          <Database className="h-3.5 w-3.5 text-primary" />
          Project schema
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
          onClick={openImportModal}
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

      {/* Empty State Overlay */}
      {contextTables.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
          <div className="glass-panel p-8 rounded-3xl border border-white/10 text-center max-w-sm pointer-events-auto backdrop-blur-xl shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4 text-primary">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-on-surface mb-1">Canvas is empty</h3>
            <p className="text-xs text-on-surface-variant/60 mb-5 leading-relaxed">
              Start building your database schema by adding a table or importing an existing schema.
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => addTable()}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-lg shadow-primary/20 hover:saturate-150 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Table
              </button>
              <button
                onClick={openImportModal}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-on-surface-variant font-medium text-xs hover:bg-white/10 transition-all"
              >
                <Upload className="w-3.5 h-3.5" />
                Import
              </button>
            </div>
          </div>
        </div>
      )}

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
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-3xl border border-white/12 shadow-[0_32px_96px_rgba(0,0,0,0.7)] bg-[#131317]/95 backdrop-blur-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* STEP 1: What is your Database? */}
            {importStep === 'select-db' && (
              <div className="p-6 md:p-8 flex flex-col">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">What is your Database?</h2>
                    <p className="text-xs text-on-surface-variant/70 mt-1">
                      Each database has its own unique features and capabilities.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowImport(false)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-on-surface-variant/60 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Category Switcher */}
                <div className="flex justify-center mb-6">
                  <div className="flex items-center p-1 rounded-xl bg-surface-container-highest/60 border border-white/8">
                    <button
                      type="button"
                      onClick={() => setDbCategory('transactional')}
                      className={`px-5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        dbCategory === 'transactional'
                          ? 'bg-sky-500 text-white shadow-sm'
                          : 'text-on-surface-variant/70 hover:text-white'
                      }`}
                    >
                      Transactional
                    </button>
                    <button
                      type="button"
                      onClick={() => setDbCategory('analytical')}
                      className={`px-5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        dbCategory === 'analytical'
                          ? 'bg-sky-500 text-white shadow-sm'
                          : 'text-on-surface-variant/70 hover:text-white'
                      }`}
                    >
                      Analytical
                    </button>
                  </div>
                </div>

                {/* Database Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 mb-6">
                  {DATABASE_OPTIONS
                    .filter((db) => db.category === dbCategory)
                    .map((db) => {
                      const isSelected = (importMode === 'json' && db.id === 'json') || (importMode === 'sql' && selectedDialect === db.id);
                      const LogoComponent = db.logo;
                      return (
                        <button
                          key={db.id}
                          type="button"
                          aria-label={db.name}
                          onClick={() => {
                            if (db.id === 'json') {
                              setImportMode('json');
                            } else {
                              setSelectedDialect(db.id as SqlDialect);
                              setImportMode('sql');
                            }
                          }}
                          onDoubleClick={() => {
                            if (db.id === 'json') {
                              setImportMode('json');
                            } else {
                              setSelectedDialect(db.id as SqlDialect);
                              setImportMode('sql');
                            }
                            setImportStep('paste-code');
                          }}
                          className={`group relative flex flex-col items-center justify-center p-5 rounded-2xl border transition-all duration-200 text-center min-h-[130px] ${
                            isSelected
                              ? 'border-primary bg-primary/[0.14] shadow-[0_0_24px_rgba(214,186,255,0.22)] ring-1 ring-primary/40'
                              : 'border-white/8 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/20'
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-sm">
                              <Check className="w-3 h-3" />
                            </div>
                          )}
                          <div className="mb-2.5 flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
                            <LogoComponent size={46} />
                          </div>
                          <span className={`text-xs font-bold transition-colors ${
                            isSelected ? 'text-primary' : 'text-on-surface group-hover:text-white'
                          }`}>
                            {db.name}
                          </span>
                        </button>
                      );
                    })}
                </div>

                {/* Check Examples */}
                <div className="flex justify-center mb-6">
                  <button
                    type="button"
                    onClick={() => {
                      handleLoadSample();
                      setImportStep('paste-code');
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.09] text-xs font-semibold text-on-surface-variant hover:text-white transition-all shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-secondary" />
                    Check Examples
                  </button>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowImport(false)}
                    className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-medium text-on-surface-variant hover:text-white transition-colors"
                  >
                    Cancel
                  </button>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setShowImport(false);
                      }}
                      className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-medium text-on-surface-variant hover:text-white transition-colors"
                    >
                      Empty database
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportStep('paste-code')}
                      className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-primary to-primary-container text-on-primary text-xs font-bold shadow-lg shadow-primary/25 hover:saturate-150 transition-all"
                    >
                      Continue
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Paste DDL / Code Editor */}
            {importStep === 'paste-code' && (
              <div className="p-6 md:p-8 flex flex-col flex-1 min-h-0">
                {/* Header with back button */}
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setImportStep('select-db')}
                      className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-on-surface-variant hover:text-white transition-colors"
                      title="Back to database selection"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white">
                          Import {importMode === 'json' ? 'JSON' : (DATABASE_OPTIONS.find((d) => d.id === selectedDialect)?.name || 'SQL')} Schema
                        </h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-primary/20 text-primary border border-primary/30 uppercase">
                          {importMode === 'json' ? 'JSON' : selectedDialect}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant/60 mt-0.5">
                        Paste your schema statements below or upload a script file
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowImport(false)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-on-surface-variant/60 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Toolbar */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleLoadSample}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-medium text-on-surface-variant hover:text-white transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-secondary" />
                      Load Sample
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-medium text-on-surface-variant hover:text-white transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5 text-primary" />
                      Upload File
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".sql,.txt,.json"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </div>

                  {importText && (
                    <button
                      type="button"
                      onClick={() => { setImportText(''); setImportError(''); setImportSuccess(false); }}
                      className="text-xs text-on-surface-variant/60 hover:text-error transition-colors px-2 py-1"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Textarea */}
                <div className="relative flex-1 min-h-0">
                  <textarea
                    value={importText}
                    onChange={(e) => {
                      setImportText(e.target.value);
                      setImportError('');
                      setImportSuccess(false);
                    }}
                    placeholder={importPlaceholder}
                    className="w-full h-60 p-4 rounded-2xl bg-surface-container-low border border-white/10 text-xs font-mono text-on-surface placeholder:text-outline/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none leading-relaxed"
                    spellCheck={false}
                  />
                </div>

                {importError && (
                  <div className="flex items-center gap-2 mt-3 px-3.5 py-2 rounded-xl bg-error/10 border border-error/20 text-xs text-error animate-in fade-in">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{importError}</span>
                  </div>
                )}

                {importSuccess && (
                  <div className="flex items-center gap-2 mt-3 px-3.5 py-2 rounded-xl bg-secondary/10 border border-secondary/20 text-xs text-secondary animate-in fade-in">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>{importMessage || 'Schema imported successfully'}</span>
                  </div>
                )}

                {/* Bottom row */}
                <div className="flex items-center justify-between pt-5 mt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setImportStep('select-db')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-medium text-on-surface-variant hover:text-white transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back
                  </button>

                  <button
                    type="button"
                    onClick={handleImport}
                    disabled={!importText.trim()}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-lg shadow-primary/20 hover:saturate-150 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Import {importMode === 'json' ? 'JSON' : (DATABASE_OPTIONS.find((d) => d.id === selectedDialect)?.name || 'SQL')} Schema
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
