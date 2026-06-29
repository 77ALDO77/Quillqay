'use client';

import FlowchartEditor from '@/components/projects/FlowchartEditor';
import FlowchartSidebar from '@/components/projects/FlowchartSidebar';

export default function FlowchartEditorPage() {
  return (
    <>
      <aside
        className="fixed z-40 top-[76px] bottom-4 left-4 w-[240px] rounded-3xl overflow-hidden border border-white/[0.12] shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
        style={{ background: 'linear-gradient(135deg, rgba(28,27,29,0.95) 0%, rgba(20,20,22,0.98) 100%)' }}
      >
        <FlowchartSidebar />
      </aside>
      <div className="ml-[260px] h-full flex flex-col">
        <div className="flex-1 glass-panel rounded-2xl border border-white/10 overflow-hidden p-1">
          <FlowchartEditor />
        </div>
      </div>
    </>
  );
}
