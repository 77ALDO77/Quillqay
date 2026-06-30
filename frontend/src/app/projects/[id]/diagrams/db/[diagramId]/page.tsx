'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { type TableDef } from '@/types/db-schema';
import { SchemaProvider } from '@/context/schema-context';
import { DiagramLayoutProvider } from '@/context/diagram-layout-context';
import { StorageProvider } from '@/context/storage-context';
import DbSchemaEditor from '@/components/projects/DbSchemaEditor';
import DbDiagramSidebar from '@/components/projects/DbDiagramSidebar';

const defaultTables: TableDef[] = [
  { name: 'pages', columns: [
    { name: 'id', type: 'UUID', isPK: true, isFK: false, nullable: false },
    { name: 'parent_id', type: 'UUID', isPK: false, isFK: true, nullable: true },
    { name: 'title', type: 'TEXT', isPK: false, isFK: false, nullable: false },
    { name: 'created_at', type: 'TIMESTAMPTZ', isPK: false, isFK: false, nullable: false },
    { name: 'updated_at', type: 'TIMESTAMPTZ', isPK: false, isFK: false, nullable: false },
  ] },
  { name: 'blocks', columns: [
    { name: 'id', type: 'TEXT', isPK: true, isFK: false, nullable: false },
    { name: 'page_id', type: 'UUID', isPK: false, isFK: true, nullable: false },
    { name: 'data', type: 'JSONB', isPK: false, isFK: false, nullable: false },
  ] },
];

export default function DbDiagramEditorPage() {
  const params = useParams();
  const diagramId = (params.diagramId as string) || 'default';
  const [tables, setTables] = useState<TableDef[]>(defaultTables);

  return (
    <StorageProvider>
    <SchemaProvider tables={tables} onTablesChange={setTables}>
      <DiagramLayoutProvider>
        <aside
          className="fixed z-40 top-[76px] bottom-4 left-4 w-[360px] rounded-3xl overflow-hidden border border-white/[0.12] shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
          style={{ background: 'linear-gradient(135deg, rgba(28,27,29,0.95) 0%, rgba(20,20,22,0.98) 100%)' }}
        >
          <DbDiagramSidebar />
        </aside>
        <div className="ml-[380px] h-full flex flex-col">
          <div className="flex-1 glass-panel rounded-2xl border border-white/10 overflow-hidden p-1">
            <DbSchemaEditor diagramId={diagramId} />
          </div>
        </div>
      </DiagramLayoutProvider>
    </SchemaProvider>
    </StorageProvider>
  );
}
