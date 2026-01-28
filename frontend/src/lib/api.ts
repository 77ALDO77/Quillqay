
import axios from 'axios'; // Using axios might be easier for config, but sticking to fetch as requested initially or switching if user prefers. 
// User asked for fetch in previous turn, but let's stick to the prompt requirements. I'll use fetch.

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

export interface EditorJsData {
    time: number;
    blocks: Block[];
    version: string;
}

export interface Block {
    id: string;
    type: 'header' | 'paragraph' | 'list' | 'checklist' | 'code';
    data: any; // EditorJS specific data structure
}

export interface Page {
    id: string;
    title: string;
    content?: string; // Legacy field
    blocks?: Block[]; // New field for structured data
    updated_at?: string;
}

export async function fetchPages(): Promise<Page[]> {
    const res = await fetch(`${API_BASE_URL}/pages`, {
        headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) throw new Error('Failed to fetch pages');

    // Adapt old response if needed, or expect new format
    const json = await res.json();

    // Handler for the specific "DemoResponse" structure if backend still returns it
    if (json.data && json.data.page) {
        const p = json.data.page;
        // Mocking list return for the single demo page
        return [{
            id: p.id,
            title: p.title,
            blocks: json.data.blocks || []
        }];
    }

    return json; // Expecting array if backend supports it
}

export async function getPage(id: string): Promise<Page> {
    const res = await fetch(`${API_BASE_URL}/pages/${id}`, {
        headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Failed to fetch page');
    return res.json();
}

export async function createPage(title: string): Promise<Page> {
    const res = await fetch(`${API_BASE_URL}/pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
    });
    if (!res.ok) throw new Error('Failed to create page');
    return res.json();
}

export async function updatePage(id: string, title: string, blocks: Block[]): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/pages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, blocks }),
    });
    if (!res.ok) throw new Error('Failed to update page');
    // Backend returns 200 OK with empty body, so do not parse JSON
}
