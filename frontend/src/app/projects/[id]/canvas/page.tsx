'use client';

import { useParams } from 'next/navigation';
import ProjectLayout from '@/components/projects/ProjectLayout';
import CanvasSection from '@/components/projects/CanvasSection';

export default function ProjectCanvasPage() {
  const params = useParams();
  const id = params.id as string;

  return (
    <ProjectLayout projectTitle={id.slice(0, 8) + '...'}>
      <CanvasSection />
    </ProjectLayout>
  );
}
