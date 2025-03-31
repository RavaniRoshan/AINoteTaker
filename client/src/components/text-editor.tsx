import { RichTextEditor as Editor, parseEditorContent } from '@/lib/editor';

interface TextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  editable?: boolean;
}

export function TextEditor({ content, onChange, placeholder, editable }: TextEditorProps) {
  // Parse content to ensure it's in the right format for the editor
  const parsedContent = content ? parseEditorContent(content) : '';
  
  return (
    <div className="prose prose-sm sm:prose lg:prose-lg max-w-none">
      <Editor
        content={typeof parsedContent === 'string' ? parsedContent : JSON.stringify(parsedContent)}
        onChange={onChange}
        placeholder={placeholder || "Start writing..."}
        editable={editable}
      />
    </div>
  );
}
