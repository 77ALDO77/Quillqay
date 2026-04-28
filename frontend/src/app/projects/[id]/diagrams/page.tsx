'use client';

import { useParams } from 'next/navigation';
import ProjectLayout from '@/components/projects/ProjectLayout';
import DiagramsHub from '@/components/projects/DiagramsHub';

export default function ProjectDiagramsPage() {
  const params = useParams();
  const id = params.id as string;

  return (
    <ProjectLayout projectTitle={id.slice(0, 8) + '...'}>
      <DiagramsHub />
    </ProjectLayout>
  );
}
