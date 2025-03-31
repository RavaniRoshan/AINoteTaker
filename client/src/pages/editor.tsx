import { useRoute } from 'wouter';
import { AppLayout } from '@/components/app-layout';
import { NoteEditor } from '@/components/note-editor';

export default function EditorPage() {
  // Match route patterns for note ID
  const [newNoteMatch] = useRoute('/new');
  const [noteMatch, params] = useRoute('/note/:id');
  
  return (
    <AppLayout>
      <NoteEditor 
        noteId={noteMatch && params ? parseInt(params.id) : undefined} 
      />
    </AppLayout>
  );
}
