export type BlockType = 'header' | 'paragraph' | 'list' | 'checklist' | 'code';

export interface BlockData {
  text?: string;
  level?: number;
  items?: string[];
  content?: string;
  language?: string;
  checked?: boolean;
  file?: { url: string };
}

export interface Block {
  id: string;
  type: BlockType;
  data: BlockData;
}

export interface Page {
  id: string;
  title: string;
  parent_id?: string | null;
  blocks?: Block[];
  created_at?: string;
  updated_at?: string;
}

export interface CreatePageRequest {
  title: string;
}

export interface UpdatePageRequest {
  title: string;
  blocks: Block[];
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface EditorJsData {
  time: number;
  blocks: Block[];
  version: string;
}
