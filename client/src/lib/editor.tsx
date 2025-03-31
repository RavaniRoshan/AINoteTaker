import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { ReactNode } from 'react';

interface EditorProps {
  content: string;
  onChange: (content: string) => void;
  children?: ReactNode;
  placeholder?: string;
  autofocus?: boolean;
  editable?: boolean;
}

export function useRichTextEditor(options: EditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: options.placeholder || 'Start writing...',
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Highlight,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Image,
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: options.content,
    onUpdate: ({ editor }) => {
      options.onChange(JSON.stringify(editor.getJSON()));
    },
    autofocus: options.autofocus || false,
    editable: options.editable !== undefined ? options.editable : true,
  });
  
  return editor;
}

export function RichTextEditor({ children, ...props }: EditorProps) {
  const editor = useRichTextEditor(props);
  
  if (!editor) {
    return <div>Loading editor...</div>;
  }
  
  return (
    <div className="rich-text-editor">
      {children}
      <EditorContent editor={editor} />
    </div>
  );
}

export function parseEditorContent(content: string) {
  try {
    return JSON.parse(content);
  } catch (e) {
    return {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: content || '',
            },
          ],
        },
      ],
    };
  }
}

export function getPlainTextFromContent(content: string): string {
  try {
    const parsed = JSON.parse(content);
    return extractTextFromNode(parsed);
  } catch (e) {
    return content || '';
  }
}

function extractTextFromNode(node: any): string {
  if (!node) return '';
  
  if (typeof node === 'string') return node;
  
  if (node.text) return node.text;
  
  if (node.content && Array.isArray(node.content)) {
    return node.content.map(extractTextFromNode).join(' ');
  }
  
  return '';
}
