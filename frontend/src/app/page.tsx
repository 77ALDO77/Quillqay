
import NotesList from '@/components/NotesList';
import { Plus } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white p-4 pb-20">
      <header className="flex justify-between items-center mb-8 pt-4 px-2">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
            Qillqay
          </h1>
          <p className="text-gray-500 text-sm">Your thoughts, organized.</p>
        </div>
        <button className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-full transition-colors">
          <Plus className="w-6 h-6" />
        </button>
      </header>

      <NotesList />
    </main>
  );
}
