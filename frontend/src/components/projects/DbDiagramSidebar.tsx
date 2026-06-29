'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  Table2, FileCode, GitBranch, Eye,
  Search, ChevronDown, ChevronRight,
  Key, ExternalLink, Copy, Check,
  Plus, Trash2, X, GripVertical,
} from 'lucide-react';
import { useSchema } from '@/context/schema-context';
import { useDiagramLayout } from '@/context/diagram-layout-context';
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
  const { tables, addTable, removeTable, updateTable, addColumn, updateColumn, removeColumn, renameTable } = useSchema();
  const { openedTable, openTable } = useDiagramLayout();
  const [filter, setFilter] = useState('');

  const filtered = tables.filter((t) => t.name.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div className="px-3 pt-3 pb-2 border-b border-white/[0.06] space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-on-surface-variant/25" />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter tables..."
              className="w-full pl-7 pr-2 py-1.5 rounded-lg bg-surface-container-low border border-white/10 text-xs text-on-surface placeholder:text-outline/40 outline-none focus:border-primary/30 transition-all"
            />
          </div>
          <button
            onClick={() => addTable()}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-white/10 text-[10px] font-medium text-on-surface-variant/60 hover:bg-white/[0.04] hover:text-on-surface-variant whitespace-nowrap transition-all shrink-0"
          >
            <Plus className="w-3 h-3" /> Add
          </button>
        </div>
        <div className="text-[10px] text-on-surface-variant/30 font-medium px-1">
          {tables.length} Table{tables.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-white/[0.03]">
        {filtered.length === 0 ? (
          <div className="p-4 text-xs text-on-surface-variant/30 text-center">No tables found</div>
        ) : (
          filtered.map((table, i) => {
            const globalIndex = tables.indexOf(table);
            const isOpen = openedTable === table.name;
            return (
              <div key={table.name} className="divide-y divide-white/[0.02]">
                <button
                  onClick={() => openTable(isOpen ? null : table.name)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-white/[0.02] transition-colors text-left group/row"
                >
                  {isOpen ? (
                    <ChevronDown className="w-3 h-3 text-on-surface-variant/30 shrink-0" />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-on-surface-variant/30 shrink-0" />
                  )}
                  <Table2 className="w-3.5 h-3.5 text-primary/50 shrink-0" />
                  <span className="text-xs font-semibold text-on-surface truncate">{table.name}</span>
                  <span className="text-[9px] text-on-surface-variant/25 font-mono ml-auto">{table.columns.length}</span>
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
                  <div className="px-6 pb-2 pt-1">
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
  const { tables } = useSchema();
  const [copied, setCopied] = useState(false);

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
    return lines.join('\n');
  }, [tables]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(dbml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [dbml]);

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div className="px-3 pt-3 pb-2 border-b border-white/[0.06] flex items-center justify-between">
        <span className="text-[10px] font-semibold text-on-surface-variant/50 uppercase tracking-wider">DBML Export</span>
        <button onClick={handleCopy} className="flex items-center gap-1 px-2 py-1 rounded-lg border border-white/10 text-[10px] font-medium text-on-surface-variant/50 hover:bg-white/[0.04] transition-all">
          {copied ? <><Check className="w-3 h-3 text-secondary" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
        <pre className="text-[11px] font-mono leading-relaxed whitespace-pre text-on-surface-variant/70">
          {dbml}
        </pre>
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

export default function DbDiagramSidebar() {
  const { selectedSection, selectSection } = useDiagramLayout();

  return (
    <div className="flex h-full">
      {/* Mini-nav */}
      <nav
        className="w-[52px] flex flex-col items-center py-3 shrink-0 border-r border-white/[0.06]"
        style={{ background: '#0e0e10' }}
      >
        <div className="flex flex-col items-center gap-0.5 flex-1 w-full px-1.5">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => selectSection(item.id)}
              className={`w-full py-2 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-colors ${
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
      </nav>

      {/* Panel content */}
      {selectedSection === 'tables' && <TablesSection />}
      {selectedSection === 'dbml' && <DbmlSection />}
      {selectedSection === 'refs' && <RefsSection />}
      {selectedSection === 'visuals' && <VisualsSection />}
    </div>
  );
}
