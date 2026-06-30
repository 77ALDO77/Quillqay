'use client';

import { useState, useCallback } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Key, X, Plus } from 'lucide-react';
import type { TableDef } from '@/types/db-schema';

interface FieldRow {
  name: string;
  type: string;
  isPK: boolean;
  nullable: boolean;
}

interface TableSchemaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table?: TableDef;
  onSave: (name: string, fields: FieldRow[]) => void;
}

const commonTypes = [
  'INTEGER', 'BIGINT', 'SMALLINT', 'SERIAL', 'VARCHAR(255)', 'CHAR(1)',
  'TEXT', 'BOOLEAN', 'DATE', 'TIMESTAMP', 'TIMESTAMPTZ', 'UUID',
  'DECIMAL(10,2)', 'FLOAT', 'JSON', 'JSONB', 'BYTEA',
];

export function TableSchemaDialog({ open, onOpenChange, table, onSave }: TableSchemaDialogProps) {
  const [name, setName] = useState(table?.name || '');
  const [fields, setFields] = useState<FieldRow[]>(
    table?.columns.map((c) => ({ name: c.name, type: c.type, isPK: c.isPK, nullable: c.nullable })) ||
    [{ name: 'id', type: 'INTEGER', isPK: true, nullable: false }]
  );

  const updateField = useCallback((index: number, upd: Partial<FieldRow>) => {
    setFields((prev) => prev.map((f, i) => i === index ? { ...f, ...upd } : f));
  }, []);

  const removeField = useCallback((index: number) => {
    setFields((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const addField = useCallback(() => {
    setFields((prev) => [...prev, { name: `col_${prev.length + 1}`, type: 'VARCHAR(255)', isPK: false, nullable: true }]);
  }, []);

  const handleSave = useCallback(() => {
    if (!name.trim()) return;
    onSave(name.trim(), fields);
    onOpenChange(false);
  }, [name, fields, onSave, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{table ? `Edit ${table.name}` : 'New Table'}</DialogTitle>
          <p className="text-sm text-on-surface-variant/60 mt-1">
            {table ? 'Modify the table schema below.' : 'Define the columns for your new table.'}
          </p>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-on-surface-variant/60 mb-1 block">Table Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="table_name" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-on-surface-variant/60">Columns</label>
              <Button variant="outline" size="sm" onClick={addField}>
                <Plus className="w-3 h-3 mr-1" /> Add Column
              </Button>
            </div>

            <div className="space-y-1.5 max-h-[300px] overflow-y-auto custom-scrollbar">
              {fields.map((field, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-surface-container-low">
                  <div className="flex-1 min-w-0">
                    <input
                      value={field.name}
                      onChange={(e) => updateField(i, { name: e.target.value })}
                      className="w-full bg-transparent border-b border-white/10 text-sm font-mono text-on-surface outline-none focus:border-primary/40 pb-0.5"
                      placeholder="column_name"
                    />
                  </div>
                  <select
                    value={field.type}
                    onChange={(e) => updateField(i, { type: e.target.value })}
                    className="bg-surface-container border border-white/10 rounded-lg px-2 py-1 text-xs font-mono text-on-surface-variant outline-none focus:border-primary/40"
                  >
                    {commonTypes.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => updateField(i, { isPK: !field.isPK })}
                    className={`p-1.5 rounded-lg transition-colors ${field.isPK ? 'bg-primary/10 text-primary' : 'text-on-surface-variant/30 hover:text-on-surface-variant/60'}`}
                    title="Primary Key"
                  >
                    <Key className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => updateField(i, { nullable: !field.nullable })}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors ${field.nullable ? 'text-on-surface-variant/40 bg-white/5' : 'text-primary bg-primary/10'}`}
                  >
                    {field.nullable ? 'NULL' : 'NN'}
                  </button>
                  {fields.length > 1 && (
                    <button
                      onClick={() => removeField(i)}
                      className="p-1.5 rounded-lg text-on-surface-variant/20 hover:text-error/70 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            {table ? 'Save Changes' : 'Create Table'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
