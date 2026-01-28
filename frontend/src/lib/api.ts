
// Adapting to the current Backend Demo Response
export interface DemoResponse {
    data: {
        page: {
            id: string;
            title: string;
            parent_id: string | null;
        };
        blocks: any[];
    };
}

export interface Note {
    id: string;
    title: string;
    content: string;
    created_at: string;
    updated_at: string;
}

const API_BASE_URL = '/api';

export async function fetchNotes(): Promise<Note[]> {
    const response = await fetch(`${API_BASE_URL}/v1/pages`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error('Error fetching notes');
    }

    const json: DemoResponse = await response.json();

    // Transform the single demo page into a list of notes for the UI
    // Since the backend returns a single structure { data: { page: ... } }, we wrap it in an array
    const note: Note = {
        id: json.data.page.id,
        title: json.data.page.title,
        content: `Demo content with ${json.data.blocks.length} blocks loaded from Rust backend.`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };

    return [note];
}
