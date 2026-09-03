const API_BASE_URL = (import.meta.env?.VITE_API_URL as string) || '/api/v1';

export interface Block {
  id: string;
  type: string;
  data: Record<string, unknown>;
}

export interface EditorDocument {
  schemaVersion: 1;
  editor: 'editorjs';
  time: number;
  version: string;
  blocks: Block[];
}

export interface DocumentSummary {
  id: string;
  projectId: string;
  title: string;
  currentVersion: number;
  currentChecksum: string | null;
  currentSizeBytes: number | null;
  lastCheckpointAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  checksum: string;
  sizeBytes: number;
  isCheckpoint: boolean;
  createdBy: string;
  createdAt: string;
}

export interface DocumentDetail {
  document: DocumentSummary;
  content: EditorDocument;
}

interface ApiErrorEnvelope {
  error?: {
    code?: string;
    message?: string;
  };
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiErrorEnvelope;
    throw new ApiError(
      response.status,
      body.error?.code || 'request_failed',
      body.error?.message || 'The request could not be completed',
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export function listDocuments(projectId: string): Promise<DocumentSummary[]> {
  return apiRequest(`/projects/${projectId}/documents`);
}

export function createDocument(
  projectId: string,
  title: string,
): Promise<DocumentSummary> {
  return apiRequest(`/projects/${projectId}/documents`, {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
}

export function getDocument(
  projectId: string,
  documentId: string,
): Promise<DocumentDetail> {
  return apiRequest(`/projects/${projectId}/documents/${documentId}`);
}

export function renameDocument(
  projectId: string,
  documentId: string,
  title: string,
): Promise<DocumentSummary> {
  return apiRequest(`/projects/${projectId}/documents/${documentId}`, {
    method: 'PATCH',
    body: JSON.stringify({ title }),
  });
}

export function saveDocument(
  projectId: string,
  documentId: string,
  baseVersion: number,
  content: EditorDocument,
): Promise<DocumentVersion> {
  return apiRequest(`/projects/${projectId}/documents/${documentId}/content`, {
    method: 'PUT',
    body: JSON.stringify({ baseVersion, content }),
  });
}

export function deleteDocument(
  projectId: string,
  documentId: string,
): Promise<void> {
  return apiRequest(`/projects/${projectId}/documents/${documentId}`, {
    method: 'DELETE',
  });
}
