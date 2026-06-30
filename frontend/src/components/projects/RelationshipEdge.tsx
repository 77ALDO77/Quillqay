'use client';

import { useMemo } from 'react';
import { getSmoothStepPath, BaseEdge, Position, type Edge, type EdgeProps, type Node, useNodes } from '@xyflow/react';
import type { RelationshipDef } from '@/types/db-schema';
import { getMarkerId } from './MarkerDefinitions';
import { isLeftSource, isRightSource } from '@/lib/handle-constants';

export type RelEdge = Edge<{ relationship: RelationshipDef }, 'relationship-edge'>;

export function RelationshipEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  source,
  target,
  sourceHandleId,
  selected,
  data,
}: EdgeProps<RelEdge>) {
  const rel = data?.relationship;
  const nodes = useNodes();

  const sourceNode = nodes.find((n: Node) => n.id === source);
  const targetNode = nodes.find((n: Node) => n.id === target);
  const sourceW = sourceNode?.measured?.width ?? 260;
  const targetW = targetNode?.measured?.width ?? 260;

  // Detect which side of the table the handle is on
  const sourceHandleSide = sourceHandleId
    ? isRightSource(sourceHandleId) ? 'right' : 'left'
    : 'right';

  // Calculate virtual edge points (left and right edges of each node)
  const srcLeftX = sourceHandleSide === 'left' ? sourceX + 3 : sourceX - sourceW - 10;
  const srcRightX = sourceHandleSide === 'left' ? sourceX + sourceW + 10 : sourceX;
  const tgtLeftX = targetX - 1;
  const tgtRightX = targetX + targetW + 10;

  // Pick shortest path among 4 combinations
  const { sourceSide, targetSide } = useMemo(() => {
    const dist = {
      ll: Math.abs(srcLeftX - tgtLeftX),
      lr: Math.abs(srcLeftX - tgtRightX),
      rl: Math.abs(srcRightX - tgtLeftX),
      rr: Math.abs(srcRightX - tgtRightX),
    };
    const min = Math.min(dist.ll, dist.lr, dist.rl, dist.rr);
    if (min === dist.ll) return { sourceSide: 'left' as const, targetSide: 'left' as const };
    if (min === dist.lr) return { sourceSide: 'left' as const, targetSide: 'right' as const };
    if (min === dist.rl) return { sourceSide: 'right' as const, targetSide: 'left' as const };
    return { sourceSide: 'right' as const, targetSide: 'right' as const };
  }, [srcLeftX, srcRightX, tgtLeftX, tgtRightX]);

  const rx = Math.round(sourceSide === 'left' ? srcLeftX : srcRightX);
  const tx = Math.round(targetSide === 'left' ? tgtLeftX : tgtRightX);

  const [path] = getSmoothStepPath({
    sourceX: rx,
    sourceY: Math.round(sourceY),
    targetX: tx,
    targetY: Math.round(targetY),
    borderRadius: 14,
    sourcePosition: sourceSide === 'left' ? Position.Left : Position.Right,
    targetPosition: targetSide === 'left' ? Position.Left : Position.Right,
  });

  const cardinality1 = getMarkerId('1', sourceSide, selected ?? false);
  const cardinalityN = getMarkerId('N', targetSide, selected ?? false);
  const edgeColor = selected ? '#d6baff' : 'rgba(214,186,255,0.3)';
  const edgeWidth = selected ? 2.5 : 1.5;

  return (
    <>
      {/* Invisible wide path for easier click targeting */}
      <path d={path} fill="none" stroke="transparent" strokeWidth={20} style={{ pointerEvents: 'stroke' }} />
      {/* Visible edge */}
      <BaseEdge
        id={id}
        path={path}
        markerStart={cardinality1}
        markerEnd={cardinalityN}
        style={{
          stroke: edgeColor,
          strokeWidth: edgeWidth,
          transition: 'stroke 0.2s, stroke-width 0.2s',
        }}
      />
    </>
  );
}
