'use client';

import { useState, useCallback, useRef, type DragEvent } from 'react';
import {
  ReactFlow,
  Handle,
  Position,
  Background,
  Controls,
  MarkerType,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  addEdge,
  type Node,
  type Edge,
  type NodeProps,
  type Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

export type FlowNodeType = 'start' | 'process' | 'decision' | 'io' | 'end';

interface FlowNodeData extends Record<string, unknown> {
  label: string;
  nodeType: FlowNodeType;
}

type FlowNode = Node<FlowNodeData, FlowNodeType>;
type FlowEdge = Edge;

const nodeColors: Record<FlowNodeType, { bg: string; border: string; text: string; handle: string }> = {
  start: { bg: 'bg-emerald-500/15', border: 'border-emerald-500/40', text: 'text-emerald-400', handle: '#34d399' },
  process: { bg: 'bg-sky-500/15', border: 'border-sky-500/40', text: 'text-sky-400', handle: '#38bdf8' },
  decision: { bg: 'bg-amber-500/15', border: 'border-amber-500/40', text: 'text-amber-400', handle: '#fbbf24' },
  io: { bg: 'bg-violet-500/15', border: 'border-violet-500/40', text: 'text-violet-400', handle: '#a78bfa' },
  end: { bg: 'bg-rose-500/15', border: 'border-rose-500/40', text: 'text-rose-400', handle: '#fb7185' },
};

function StartNode({ data }: NodeProps<FlowNode>) {
  return (
    <div className={`rounded-full px-6 py-3 border ${nodeColors[data.nodeType].border} ${nodeColors[data.nodeType].bg} shadow-lg`}>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className={`text-sm font-bold ${nodeColors[data.nodeType].text}`}>{data.label}</span>
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: nodeColors[data.nodeType].handle, border: '2px solid #201f21' }} />
    </div>
  );
}

function ProcessNode({ data }: NodeProps<FlowNode>) {
  return (
    <div className={`rounded-xl px-5 py-3 border ${nodeColors[data.nodeType].border} ${nodeColors[data.nodeType].bg} shadow-lg w-[180px]`}>
      <span className={`text-sm font-semibold ${nodeColors[data.nodeType].text}`}>{data.label}</span>
      <Handle type="target" position={Position.Top} style={{ background: nodeColors[data.nodeType].handle, border: '2px solid #201f21' }} />
      <Handle type="source" position={Position.Bottom} style={{ background: nodeColors[data.nodeType].handle, border: '2px solid #201f21' }} />
    </div>
  );
}

function DecisionNode({ data }: NodeProps<FlowNode>) {
  return (
    <div className="relative w-28 h-28">
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
        <polygon
          points="50,5 95,50 50,95 5,50"
          fill="rgba(245,158,11,0.12)"
          stroke="rgba(245,158,11,0.35)"
          strokeWidth="2"
          className="drop-shadow-lg"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-xs font-bold ${nodeColors[data.nodeType].text} text-center px-2`}>{data.label}</span>
      </div>
      <Handle type="target" position={Position.Top} style={{ background: nodeColors[data.nodeType].handle, border: '2px solid #201f21' }} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={{ background: nodeColors[data.nodeType].handle, border: '2px solid #201f21' }} />
      <Handle type="source" position={Position.Left} id="left" style={{ background: nodeColors[data.nodeType].handle, border: '2px solid #201f21' }} />
      <Handle type="source" position={Position.Right} id="right" style={{ background: nodeColors[data.nodeType].handle, border: '2px solid #201f21' }} />
    </div>
  );
}

function IONode({ data }: NodeProps<FlowNode>) {
  return (
    <div className={`rounded-[4px] px-5 py-3 border ${nodeColors[data.nodeType].border} ${nodeColors[data.nodeType].bg} shadow-lg w-[180px]`}
      style={{ clipPath: 'polygon(10% 0%, 100% 0%, 90% 100%, 0% 100%)' }}
    >
      <span className={`text-sm font-semibold ${nodeColors[data.nodeType].text}`}>{data.label}</span>
      <Handle type="target" position={Position.Top} style={{ background: nodeColors[data.nodeType].handle, border: '2px solid #201f21' }} />
      <Handle type="source" position={Position.Bottom} style={{ background: nodeColors[data.nodeType].handle, border: '2px solid #201f21' }} />
    </div>
  );
}

function EndNode({ data }: NodeProps<FlowNode>) {
  return (
    <div className={`rounded-full px-6 py-3 border ${nodeColors[data.nodeType].border} ${nodeColors[data.nodeType].bg} shadow-lg`}>
      <span className={`text-sm font-bold ${nodeColors[data.nodeType].text}`}>{data.label}</span>
      <Handle type="target" position={Position.Top} style={{ background: nodeColors[data.nodeType].handle, border: '2px solid #201f21' }} />
    </div>
  );
}

const nodeTypes = {
  start: StartNode,
  process: ProcessNode,
  decision: DecisionNode,
  io: IONode,
  end: EndNode,
};

let idCounter = 0;
function nextId() {
  return `fc_${++idCounter}`;
}

const flowPresets: Record<string, { nodes: FlowNode[]; edges: FlowEdge[] }> = {
  'auth-flow': {
    nodes: [
      { id: nextId(), type: 'start', position: { x: 280, y: 0 }, data: { label: 'Login Request', nodeType: 'start' } },
      { id: nextId(), type: 'process', position: { x: 240, y: 100 }, data: { label: 'Validate Credentials', nodeType: 'process' } },
      { id: nextId(), type: 'decision', position: { x: 200, y: 220 }, data: { label: 'Valid?', nodeType: 'decision' } },
      { id: nextId(), type: 'process', position: { x: 20, y: 340 }, data: { label: 'Return Error', nodeType: 'process' } },
      { id: nextId(), type: 'process', position: { x: 380, y: 340 }, data: { label: 'Generate Token', nodeType: 'process' } },
      { id: nextId(), type: 'io', position: { x: 380, y: 460 }, data: { label: 'Send JWT Token', nodeType: 'io' } },
      { id: nextId(), type: 'end', position: { x: 280, y: 580 }, data: { label: 'End', nodeType: 'end' } },
    ],
    edges: [
      { id: 'fc-e1', source: 'fc_1', target: 'fc_2', type: 'smoothstep', animated: true, style: { stroke: '#4b5563', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#4b5563' } },
      { id: 'fc-e2', source: 'fc_2', target: 'fc_3', type: 'smoothstep', animated: true, style: { stroke: '#4b5563', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#4b5563' } },
      { id: 'fc-e3', source: 'fc_3', target: 'fc_4', sourceHandle: 'left', type: 'smoothstep', animated: true, style: { stroke: '#ef4444', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#ef4444' }, label: 'No', labelStyle: { fill: '#ef4444', fontSize: 11, fontWeight: 700 } },
      { id: 'fc-e4', source: 'fc_3', target: 'fc_5', sourceHandle: 'bottom', type: 'smoothstep', animated: true, style: { stroke: '#34d399', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#34d399' }, label: 'Yes', labelStyle: { fill: '#34d399', fontSize: 11, fontWeight: 700 } },
      { id: 'fc-e5', source: 'fc_5', target: 'fc_6', type: 'smoothstep', animated: true, style: { stroke: '#4b5563', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#4b5563' } },
      { id: 'fc-e6', source: 'fc_6', target: 'fc_7', type: 'smoothstep', animated: true, style: { stroke: '#4b5563', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#4b5563' } },
    ],
  },
  'payment-flow': {
    nodes: [
      { id: nextId(), type: 'start', position: { x: 300, y: 0 }, data: { label: 'Checkout', nodeType: 'start' } },
      { id: nextId(), type: 'process', position: { x: 260, y: 100 }, data: { label: 'Validate Cart', nodeType: 'process' } },
      { id: nextId(), type: 'decision', position: { x: 220, y: 220 }, data: { label: 'In Stock?', nodeType: 'decision' } },
      { id: nextId(), type: 'process', position: { x: -30, y: 340 }, data: { label: 'Cancel Order', nodeType: 'process' } },
      { id: nextId(), type: 'process', position: { x: 470, y: 340 }, data: { label: 'Process Payment', nodeType: 'process' } },
      { id: nextId(), type: 'decision', position: { x: 470, y: 480 }, data: { label: 'Approved?', nodeType: 'decision' } },
      { id: nextId(), type: 'process', position: { x: 470, y: 620 }, data: { label: 'Confirm Order', nodeType: 'process' } },
      { id: nextId(), type: 'io', position: { x: 470, y: 740 }, data: { label: 'Send Confirmation', nodeType: 'io' } },
      { id: nextId(), type: 'end', position: { x: 300, y: 860 }, data: { label: 'End', nodeType: 'end' } },
    ],
    edges: [
      { id: 'fp-e1', source: 'fc_1', target: 'fc_2', type: 'smoothstep', animated: true, style: { stroke: '#4b5563', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#4b5563' } },
      { id: 'fp-e2', source: 'fc_2', target: 'fc_3', type: 'smoothstep', animated: true, style: { stroke: '#4b5563', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#4b5563' } },
      { id: 'fp-e3', source: 'fc_3', target: 'fc_4', sourceHandle: 'left', type: 'smoothstep', animated: true, style: { stroke: '#ef4444', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#ef4444' }, label: 'No', labelStyle: { fill: '#ef4444', fontSize: 11, fontWeight: 700 } },
      { id: 'fp-e4', source: 'fc_3', target: 'fc_5', sourceHandle: 'bottom', type: 'smoothstep', animated: true, style: { stroke: '#34d399', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#34d399' }, label: 'Yes', labelStyle: { fill: '#34d399', fontSize: 11, fontWeight: 700 } },
      { id: 'fp-e5', source: 'fc_5', target: 'fc_6', type: 'smoothstep', animated: true, style: { stroke: '#4b5563', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#4b5563' } },
      { id: 'fp-e6', source: 'fc_6', target: 'fc_5', sourceHandle: 'left', type: 'smoothstep', animated: true, style: { stroke: '#ef4444', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#ef4444' }, label: 'Retry', labelStyle: { fill: '#ef4444', fontSize: 11, fontWeight: 700 } },
      { id: 'fp-e7', source: 'fc_6', target: 'fc_7', sourceHandle: 'bottom', type: 'smoothstep', animated: true, style: { stroke: '#34d399', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#34d399' }, label: 'Yes', labelStyle: { fill: '#34d399', fontSize: 11, fontWeight: 700 } },
      { id: 'fp-e8', source: 'fc_7', target: 'fc_8', type: 'smoothstep', animated: true, style: { stroke: '#4b5563', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#4b5563' } },
      { id: 'fp-e9', source: 'fc_8', target: 'fc_9', type: 'smoothstep', animated: true, style: { stroke: '#4b5563', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#4b5563' } },
    ],
  },
};

const defaultNodes = flowPresets['auth-flow'].nodes;
const defaultEdges = flowPresets['auth-flow'].edges;

function EditorInner() {
  const reactFlowInstance = useReactFlow();
  const [activePreset, setActivePreset] = useState('auth-flow');
  const preset = flowPresets[activePreset] || flowPresets['auth-flow'];
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>(preset.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<FlowEdge>(preset.edges);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [showPresets, setShowPresets] = useState(false);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge({ ...params, type: 'smoothstep', animated: true, style: { stroke: '#4b5563', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#4b5563' } }, eds));
    },
    [setEdges]
  );

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow') as FlowNodeType;
      if (!type) return;
      const position = reactFlowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
      const newNode: FlowNode = {
        id: nextId(),
        type,
        position,
        data: { label: type.charAt(0).toUpperCase() + type.slice(1), nodeType: type },
      };
      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  return (
    <div ref={reactFlowWrapper} className="w-full h-full relative">
      {/* Preset selector */}
      <div className="absolute top-3 left-3 z-10">
        <div className="relative">
          <button
            onClick={() => setShowPresets(!showPresets)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container/90 backdrop-blur-md border border-white/10 text-xs font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            <span>{activePreset === 'auth-flow' ? 'Auth Flow' : 'Payment Flow'}</span>
          </button>
          {showPresets && (
            <div className="absolute top-full left-0 mt-1 w-40 rounded-xl bg-surface-container border border-white/10 shadow-xl backdrop-blur-xl overflow-hidden z-20">
              {Object.keys(flowPresets).map((key) => (
                <button
                  key={key}
                  onClick={() => {
                    const p = flowPresets[key];
                    setNodes(p.nodes);
                    setEdges(p.edges);
                    setActivePreset(key);
                    setShowPresets(false);
                    setTimeout(() => reactFlowInstance.fitView({ duration: 300 }), 50);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-white/5 transition-colors ${activePreset === key ? 'text-primary bg-primary/5' : 'text-on-surface-variant'}`}
                >
                  {key === 'auth-flow' ? '🔐 Auth Flow' : '💳 Payment Flow'}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        fitView
        colorMode="dark"
        minZoom={0.3}
        maxZoom={2}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="rgba(255,255,255,0.05)" />
        <Controls className="[&>button]:bg-surface-container [&>button]:border-white/10 [&>button]:text-on-surface-variant [&>button]:hover:bg-surface-container-high" showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

export default function FlowchartEditor() {
  return (
    <ReactFlowProvider>
      <EditorInner />
    </ReactFlowProvider>
  );
}
