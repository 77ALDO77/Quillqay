import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getDiagram } from '@/lib/api';
import {
  type TableDef,
  SchemaProvider,
  DiagramLayoutProvider,
  StorageProvider,
  DbSchemaEditor,
  DbDiagramSidebar,
} from '@/features/db-diagram';

export default function DbDiagramPage() {
  const params = useParams();
  const projectId = (params.id as string) || '';
  const diagramId = (params.diagramId as string) || 'default';
  const [tables, setTables] = useState<TableDef[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const { data: diagram } = useQuery({
    queryKey: ['diagram', projectId, diagramId],
    queryFn: () => getDiagram(projectId, diagramId),
    enabled: !!projectId && !!diagramId && diagramId !== 'default',
  });

  useEffect(() => {
    if (diagram?.content?.tables && Array.isArray(diagram.content.tables)) {
      setTables(diagram.content.tables);
    }
  }, [diagram]);

  const diagramTitle = diagram?.title || 'Database Schema';

  return (
    <StorageProvider>
      <SchemaProvider tables={tables} onTablesChange={setTables}>
        <DiagramLayoutProvider>
          <div className="flex min-h-0 flex-1 gap-4 overflow-hidden">
            <aside
              className={`hidden h-full shrink-0 overflow-hidden rounded-3xl border border-white/[0.12] shadow-[0_24px_80px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.04)_inset] backdrop-blur-2xl transition-[width] duration-300 md:flex ${sidebarCollapsed ? 'w-[72px]' : 'w-[360px]'}`}
              style={{ background: 'linear-gradient(135deg, rgba(28,27,29,0.95) 0%, rgba(14,14,16,0.98) 100%)' }}
            >
              <DbDiagramSidebar
                diagramTitle={diagramTitle}
                collapsed={sidebarCollapsed}
                onToggleCollapsed={() => setSidebarCollapsed((collapsed) => !collapsed)}
              />
            </aside>

            <section className="glass-panel relative flex min-w-0 flex-1 overflow-hidden rounded-3xl border border-white/10 p-1 shadow-[0_24px_80px_rgba(0,0,0,0.38)]">
              <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-primary/[0.055] blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 right-12 h-56 w-56 rounded-full bg-secondary/[0.035] blur-3xl" />
              <DbSchemaEditor diagramId={diagramId} projectId={projectId} />
            </section>
          </div>
        </DiagramLayoutProvider>
      </SchemaProvider>
    </StorageProvider>
  );
}
