import { WhiteboardEditor } from '@/features/whiteboard';

export default function WhiteboardDiagramPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 glass-panel rounded-2xl border border-white/10 overflow-hidden">
        <WhiteboardEditor />
      </div>
    </div>
  );
}
