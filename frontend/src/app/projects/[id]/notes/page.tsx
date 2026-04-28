'use client';

import { useParams } from 'next/navigation';
import ProjectLayout from '@/components/projects/ProjectLayout';
import NotesSection from '@/components/projects/NotesSection';

export default function ProjectNotesPage() {
  const params = useParams();
  const id = params.id as string;

  return (
    <ProjectLayout projectTitle={id.slice(0, 8) + '...'}>
      <NotesSection />
    </ProjectLayout>
  );
}
