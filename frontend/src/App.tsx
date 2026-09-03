import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectLayout from './pages/projects/ProjectLayout';
import NotesPage from './pages/projects/NotesPage';
import DocumentsPage from './pages/projects/DocumentsPage';
import DocumentEditorPage from './pages/projects/DocumentEditorPage';
import DiagramsHubPage from './pages/projects/DiagramsHubPage';
import DbDiagramPage from './pages/projects/DbDiagramPage';
import FlowchartDiagramPage from './pages/projects/FlowchartDiagramPage';
import WhiteboardDiagramPage from './pages/projects/WhiteboardDiagramPage';
import CanvasPage from './pages/projects/CanvasPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/projects" element={<ProjectsPage />} />

        {/* Project Routes with persistent Layout */}
        <Route path="/projects/:id" element={<ProjectLayout />}>
          <Route index element={<Navigate to="notes" replace />} />
          <Route path="notes" element={<NotesPage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="documents/:docId" element={<DocumentEditorPage />} />
          <Route path="diagrams" element={<DiagramsHubPage />} />
          <Route path="diagrams/db/:diagramId" element={<DbDiagramPage />} />
          <Route path="diagrams/flowchart/:diagramId" element={<FlowchartDiagramPage />} />
          <Route path="diagrams/whiteboard/:diagramId" element={<WhiteboardDiagramPage />} />
          <Route path="canvas" element={<CanvasPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
