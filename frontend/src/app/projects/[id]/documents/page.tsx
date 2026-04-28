'use client';

import { useParams } from 'next/navigation';
import ProjectLayout from '@/components/projects/ProjectLayout';
import DocumentsSection from '@/components/projects/DocumentsSection';

export default function ProjectDocumentsPage() {
  const params = useParams();
  const id = params.id as string;

  return (
    <ProjectLayout projectTitle={id.slice(0, 8) + '...'}>
      <DocumentsSection />
    </ProjectLayout>
  );
}
