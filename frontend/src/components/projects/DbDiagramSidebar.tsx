'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  Table2, FileCode, GitBranch, Eye,
  Search, ChevronDown, ChevronRight,
  Key, ExternalLink, Copy, Check,
  Plus, Trash2, X, GripVertical, Pencil, AlertCircle, Terminal, Database,
  PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';
import { useSchema } from '@/context/schema-context';
import { useDiagramLayout } from '@/context/diagram-layout-context';
import { parseSchemaDbml } from '@/lib/schema-parser';
import MonacoEditor from './DbmlEditor';
import type { SidebarSection } from '@/context/diagram-layout-context';

const navItems: { icon: typeof Table2; label: string; id: SidebarSection }[] = [
  { icon: Table2, label: 'Tables', id: 'tables' },
  { icon: FileCode, label: 'DBML', id: 'dbml' },
  { icon: GitBranch, label: 'Refs', id: 'refs' },
  { icon: Eye, label: 'Visuals', id: 'visuals' },
];

/* ---------- Column Row ---------- */

function ColumnRow({
  column, onUpdate, onDelete, readonly,
}: {
  column: { name: string; type: string; isPK: boolean; isFK: boolean; nullable: boolean };
  onUpdate: (col: typeof column) => void;
  onDelete: () => void;
  readonly?: boolean;
}) {
  return (
    <div className="flex items-center gap-1 text-xs py-1 px-1 group/col rounded hover:bg-white/[0.02]">
      <span className="text-on-surface-variant/20 w-3 shrink-0">
        <GripVertical className="w-2.5 h-2.5" />
      </span>
      <input
        value={column.name}
        onChange={(e) => onUpdate({ ...column, name: e.target.value })}
        className="w-16 bg-transparent border-b border-white/5 text-on-surface font-mono text-[11px] outline-none focus:border-primary/30 px-0.5"
        placeholder="name"
        disabled={readonly}
      />
      <input
        value={column.type}
        onChange={(e) => onUpdate({ ...column, type: e.target.value.toUpperCase() })}
        className="w-14 bg-transparent border-b border-white/5 text-on-surface-variant/50 text-[10px] outline-none focus:border-primary/30 px-0.5 uppercase"
        placeholder="TYPE"
        disabled={readonly}
      />
      <button
        onClick={() => onUpdate({ ...column, isPK: !column.isPK })}
        className={`p-0.5 rounded ${column.isPK ? 'text-primary' : 'text-on-surface-variant/20 hover:text-on-surface-variant/40'}`}
        disabled={readonly}
        title="Primary Key"
      >
        <Key className="w-3 h-3" />
      </button>
      <button
        onClick={() => onUpdate({ ...column, isFK: !column.isFK })}
        className={`p-0.5 rounded ${column.isFK ? 'text-secondary' : 'text-on-surface-variant/20 hover:text-on-surface-variant/40'}`}
        disabled={readonly}
        title="Foreign Key"
      >
        <ExternalLink className="w-3 h-3" />
      </button>
      <button
        onClick={() => onUpdate({ ...column, nullable: !column.nullable })}
        className={`px-1 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${column.nullable ? 'text-on-surface-variant/30' : 'text-primary/50'}`}
        disabled={readonly}
      >
        {column.nullable ? 'NULL' : 'NN'}
      </button>
      {!readonly && (
        <button onClick={onDelete} className="p-0.5 rounded text-on-surface-variant/15 hover:text-error/60 opacity-0 group-hover/col:opacity-100 transition-all ml-auto">
          <X className="w-2.5 h-2.5" />
        </button>
      )}
    </div>
  );
}

/* ---------- Tables Section ---------- */

function TablesSection() {
  const { tables, addTable, removeTable, addColumn, updateColumn, removeColumn, renameTable } = useSchema();
  const { openedTable, openTable } = useDiagramLayout();
  const [filter, setFilter] = useState('');

  const filtered = tables.filter((t) => t.name.toLowerCase().includes(filter.toLowerCase()));
  const accents = ['bg-tertiary', 'bg-primary', 'bg-secondary', 'bg-emerald-300', 'bg-cyan-200'];

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div className="space-y-3 border-b border-white/[0.06] px-3 pb-3 pt-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-on-surface-variant/35" />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter"
              className="h-10 w-full rounded-xl border border-white/10 bg-surface-container-lowest/70 pl-9 pr-3 text-sm text-on-surface outline-none transition-all placeholder:text-outline/45 focus:border-primary/35"
            />
          </div>
          <button
            onClick={() => addTable()}
            className="flex h-10 shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-surface-container-high/70 px-3 text-xs font-bold text-on-surface-variant transition-all hover:bg-white/[0.06] hover:text-on-surface"
          >
            <Table2 className="h-3.5 w-3.5" /> Add
          </button>
        </div>
        <div className="px-1 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/35">
          {tables.length} Table{tables.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3 custom-scrollbar">
        {filtered.length === 0 ? (
          <div className="p-4 text-xs text-on-surface-variant/30 text-center">No tables found</div>
        ) : (
          filtered.map((table, index) => {
            const globalIndex = tables.indexOf(table);
            const isOpen = openedTable === table.name;
            const accent = accents[index % accents.length];
            return (
              <div key={table.name} className="overflow-hidden rounded-xl border border-white/[0.08] bg-surface-container-lowest/45">
                <button
                  onClick={() => openTable(isOpen ? null : table.name)}
                  className="group/row relative flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-white/[0.03]"
                >
                  <span className={`absolute bottom-0 left-0 top-0 w-1 ${accent}`} />
                  {isOpen ? (
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 text-on-surface-variant/50" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-on-surface-variant/50" />
                  )}
                  <GripVertical className="h-4 w-4 shrink-0 text-on-surface-variant/25" />
                  <span className="truncate text-sm font-bold text-on-surface">{table.name}</span>
                  <span className="ml-auto rounded-full bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] text-on-surface-variant/45">{table.columns.length}</span>
                  <span
                    onClick={(e) => { e.stopPropagation(); removeTable(globalIndex); }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); removeTable(globalIndex); } }}
                    className="p-0.5 rounded text-on-surface-variant/15 hover:text-error/60 opacity-0 group-hover/row:opacity-100 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </span>
                </button>
                {isOpen && (
                  <div className="border-t border-white/[0.04] px-5 pb-3 pt-2">
                    <input
                      value={table.name}
                      onChange={(e) => renameTable(globalIndex, e.target.value)}
                      className="w-full bg-transparent border-b border-white/10 text-xs font-semibold text-on-surface outline-none focus:border-primary/30 pb-0.5 mb-1.5"
                      placeholder="Table name"
                    />
                    <div className="space-y-0">
                      {table.columns.map((col, ci) => (
                        <ColumnRow
                          key={ci}
                          column={col}
                          onUpdate={(updated) => updateColumn(globalIndex, ci, updated)}
                          onDelete={() => removeColumn(globalIndex, ci)}
                        />
                      ))}
                    </div>
                    <button
                      onClick={() => addColumn(globalIndex)}
                      className="flex items-center gap-1 text-[10px] text-on-surface-variant/25 hover:text-on-surface-variant/50 transition-colors mt-1"
                    >
                      <Plus className="w-2.5 h-2.5" /> Add Column
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ---------- Refs Section ---------- */

function RefsSection() {
  const [filter, setFilter] = useState('');
  const demoRefs = [
    { name: 'dept_emp_ibfk_1', src: 'dept_emp.emp_no', dst: 'employees.id', color: '#d6baff' },
    { name: 'dept_emp_ibfk_2', src: 'dept_emp.dept_no', dst: 'departments.id', color: '#d3fbff' },
    { name: 'dept_manager_ibfk_1', src: 'dept_manager.emp_no', dst: 'employees.id', color: '#ffb0cb' },
    { name: 'dept_manager_ibfk_2', src: 'dept_manager.dept_no', dst: 'departments.id', color: '#d6baff' },
    { name: 'salaries_ibfk_1', src: 'salaries.emp_no', dst: 'employees.id', color: '#d3fbff' },
    { name: 'titles_ibfk_1', src: 'titles.emp_no', dst: 'employees.id', color: '#ffb0cb' },
  ];

  const filtered = demoRefs.filter((r) =>
    r.name.toLowerCase().includes(filter.toLowerCase()) ||
    r.src.toLowerCase().includes(filter.toLowerCase())
  );

  const [opened, setOpened] = useState<string | null>(null);

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div className="px-3 pt-3 pb-2 border-b border-white/[0.06] space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-on-surface-variant/25" />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter"
              className="w-full pl-7 pr-2 py-1.5 rounded-lg bg-surface-container-low border border-white/10 text-xs text-on-surface placeholder:text-outline/40 outline-none focus:border-primary/30 transition-all"
            />
          </div>
          <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-white/10 text-[10px] font-medium text-on-surface-variant/60 hover:bg-white/[0.04] whitespace-nowrap shrink-0">
            <GitBranch className="w-3 h-3" /> Add
          </button>
        </div>
        <div className="text-[10px] text-on-surface-variant/30 font-medium px-1">
          {filtered.length} Relationship{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-white/[0.03]">
        {filtered.length === 0 ? (
          <div className="p-4 text-xs text-on-surface-variant/30 text-center">No relationships found</div>
        ) : (
          filtered.map((rel) => (
            <div key={rel.name}>
              <button
                onClick={() => setOpened(opened === rel.name ? null : rel.name)}
                className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-white/[0.02] transition-colors text-left"
              >
                {opened === rel.name ? (
                  <ChevronDown className="w-3 h-3 text-on-surface-variant/30 shrink-0" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-on-surface-variant/30 shrink-0" />
                )}
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: rel.color }} />
                <span className="text-xs text-on-surface/70 font-mono truncate flex-1">{rel.name}</span>
              </button>
              {opened === rel.name && (
                <div className="px-7 pb-2 space-y-0.5">
                  <div className="text-[11px] text-on-surface-variant/40">
                    <span className="text-primary/70">{rel.src}</span>
                  </div>
                  <div className="text-[11px] text-on-surface-variant/40">
                    <span className="text-secondary/70">{rel.dst}</span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ---------- DBML Section ---------- */

function DbmlSection() {
  const { tables, relationships, setAllTables, createRelationship } = useSchema();
  const [copied, setCopied] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editText, setEditText] = useState('');
  const [error, setError] = useState('');

  const dbml = useMemo(() => {
    const lines: string[] = [];
    for (const table of tables) {
      lines.push(`Table ${table.name} {`);
      for (const col of table.columns) {
        const c: string[] = [];
        if (col.isPK) c.push('pk');
        if (col.isFK) c.push('ref');
        if (!col.nullable) c.push('not null');
        const s = c.length > 0 ? ` [${c.join(', ')}]` : '';
        lines.push(`  ${col.name} ${col.type}${s}`);
      }
      lines.push('}');
      lines.push('');
    }
    for (const rel of relationships) {
      lines.push(`Ref: ${rel.sourceTable}.${rel.sourceField} > ${rel.targetTable}.${rel.targetField}`);
    }
    return lines.join('\n');
  }, [tables, relationships]);

  const lines = useMemo(() => dbml.split('\n'), [dbml]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(dbml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [dbml]);

  const enterEditMode = useCallback(() => {
    setEditText(dbml);
    setEditMode(true);
    setError('');
  }, [dbml]);

  const cancelEdit = useCallback(() => {
    setEditMode(false);
    setError('');
  }, []);

  const applyEdit = useCallback(() => {
    try {
      const parsed = parseSchemaDbml(editText);
      if (parsed.tables.length === 0) { setError('No tables found in DBML'); return; }
      setAllTables(parsed.tables);
      for (const ref of parsed.refs) {
        createRelationship(ref.srcTable, ref.srcField, ref.tgtTable, ref.tgtField);
      }
      setEditMode(false);
      setError('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to parse DBML');
    }
  }, [editText, setAllTables, createRelationship]);

  if (editMode) {
    const content = (
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-3 pt-3 pb-2 border-b border-white/[0.06] flex items-center justify-between">
          <span className="text-[10px] font-semibold text-on-surface-variant/50 uppercase tracking-wider">Edit DBML</span>
          <div className="flex items-center gap-2">
            <button onClick={cancelEdit} className="px-2.5 py-1.5 rounded-lg border border-white/10 text-[10px] font-medium text-on-surface-variant/50 hover:bg-white/[0.04] transition-all">
              Cancel
            </button>
            <button onClick={applyEdit} className="px-2.5 py-1.5 rounded-lg bg-primary text-on-primary text-[10px] font-bold hover:saturate-150 transition-all">
              Apply
            </button>
          </div>
        </div>
        <div className="flex-1 flex flex-col min-h-0">
          <MonacoEditor
            value={editText}
            onChange={(v) => { setEditText(v ?? ''); setError(''); }}
          />
          {error && (
            <div className="flex items-center gap-2 px-3 pb-2 text-xs text-error">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {error}
            </div>
          )}
        </div>
      </div>
    );
    return content;
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div className="px-3 pt-3 pb-2 border-b border-white/[0.06] flex items-center justify-between">
        <span className="text-[10px] font-semibold text-on-surface-variant/50 uppercase tracking-wider">DBML</span>
        <div className="flex items-center gap-2">
          <button
            onClick={enterEditMode}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-white/10 text-[10px] font-medium text-on-surface-variant/50 hover:bg-white/[0.04] transition-all"
          >
            <Pencil className="w-3 h-3" /> Edit
          </button>
          <span className="text-[9px] text-on-surface-variant/25 font-mono">{lines.length} lines</span>
          <button onClick={handleCopy} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-white/10 text-[10px] font-medium text-on-surface-variant/50 hover:bg-white/[0.04] transition-all">
            {copied ? <><Check className="w-3 h-3 text-secondary" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-3">
          <pre className="text-[11px] font-mono leading-[1.8] whitespace-pre">
            {lines.map((line, i) => {
              let className = 'text-on-surface-variant/30';
              let label: string | null = null;
              if (/^Table\s/.test(line)) { className = 'text-primary font-bold'; label = 'table'; }
              else if (/^Ref:/.test(line)) { className = 'text-secondary'; label = 'ref'; }
              else if (/\[.*\]/.test(line)) { className = 'text-on-surface-variant/70'; }
              else if (/^\s*\w/.test(line)) { className = 'text-on-surface-variant/60'; }
              return (
                <div key={i} className="flex hover:bg-white/[0.02] rounded px-1 -mx-1">
                  <span className="w-8 shrink-0 text-right text-[9px] text-on-surface-variant/15 select-none mr-3 leading-[1.8]">{i + 1}</span>
                  <span className={`${className} leading-[1.8]`}>{line}</span>
                  {label && <span className="ml-auto shrink-0 text-[8px] font-bold uppercase tracking-widest text-on-surface-variant/20 leading-[1.8]">{label}</span>}
                </div>
              );
            })}
          </pre>
        </div>
      </div>
    </div>
  );
}

/* ---------- Visuals Section ---------- */

function VisualsSection() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center px-4">
        <div className="text-xs text-on-surface-variant/30">Coming soon</div>
        <div className="text-sm text-on-surface-variant/50 font-medium">Visuals</div>
      </div>
    </div>
  );
}

/* ---------- Main Sidebar ---------- */

interface DbDiagramSidebarProps {
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}

export default function DbDiagramSidebar({ collapsed = false, onToggleCollapsed }: DbDiagramSidebarProps) {
  const { selectedSection, selectSection } = useDiagramLayout();
  const { addTable } = useSchema();

  return (
    <div className="flex h-full min-h-0 w-full">
      {/* Mini-nav */}
      <nav
        className="flex w-[72px] shrink-0 flex-col items-center border-r border-white/[0.06] py-3"
        style={{ background: 'linear-gradient(180deg, rgba(14,14,16,0.98) 0%, rgba(19,19,21,0.96) 100%)' }}
      >
        <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-primary-container/80 shadow-[0_0_18px_rgba(214,186,255,0.22)]">
          <Terminal className="h-4 w-4 text-on-primary-container" />
        </div>

        <div className="flex w-full flex-col items-center gap-1 px-2">
          <button
            onClick={() => addTable()}
            className="flex w-full flex-col items-center justify-center gap-1 rounded-xl px-1 py-2.5 text-on-surface-variant/80 transition-colors hover:bg-white/[0.04] hover:text-on-surface"
            title="New table"
          >
            <Plus className="h-4 w-4" />
            <span className="text-[9px] font-bold leading-none">New</span>
          </button>
        </div>

        <div className="my-3 h-px w-10 bg-white/[0.08]" />

        <div className="flex flex-1 flex-col items-center gap-1 w-full px-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => selectSection(item.id)}
              className={`w-full rounded-xl py-2.5 flex flex-col items-center justify-center gap-1 transition-colors ${
                selectedSection === item.id
                  ? 'bg-primary/10 text-primary'
                  : 'text-on-surface-variant/25 hover:text-on-surface-variant/60 hover:bg-white/[0.04]'
              }`}
              title={item.label}
            >
              <item.icon className="w-4 h-4" />
              <span className="text-[9px] leading-none font-semibold">{item.label}</span>
            </button>
          ))}
        </div>

        {onToggleCollapsed && (
          <button
            onClick={onToggleCollapsed}
            className="mt-3 grid h-9 w-9 place-items-center rounded-xl border border-white/10 text-on-surface-variant/45 transition-colors hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand diagram sidebar' : 'Collapse diagram sidebar'}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        )}
      </nav>

      {/* Panel content */}
      <div className={`min-w-0 flex-1 flex-col transition-opacity duration-200 ${collapsed ? 'hidden opacity-0' : 'flex opacity-100'}`}>
        <div className="border-b border-white/[0.06] px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary-container/80 shadow-[0_0_18px_rgba(214,186,255,0.18)]">
              <Terminal className="h-4 w-4 text-on-primary-container" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold text-on-surface">Qillqay Schema</div>
              <div className="mt-0.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant/45">
                <Database className="h-3 w-3 text-secondary/70" />
                Database diagram
              </div>
            </div>
          </div>
        </div>

        {selectedSection === 'tables' && <TablesSection />}
        {selectedSection === 'dbml' && <DbmlSection />}
        {selectedSection === 'refs' && <RefsSection />}
        {selectedSection === 'visuals' && <VisualsSection />}
      </div>
    </div>
  );
}
