'use client';

import { useRef, useEffect } from 'react';
import { ForwardRefEditor } from './ForwardRefEditor';
import type { MDXEditorMethods } from '@mdxeditor/editor';

interface MarkdownNoteEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export function MarkdownNoteEditor({
    value,
    onChange,
    placeholder = 'Type your note here...',
}: MarkdownNoteEditorProps) {
    const editorRef = useRef<MDXEditorMethods>(null);

    // Sync external value changes to editor
    useEffect(() => {
        if (editorRef.current) {
            const currentMarkdown = editorRef.current.getMarkdown();
            if (currentMarkdown !== value) {
                editorRef.current.setMarkdown(value);
            }
        }
    }, [value]);

    return (
        <div className="mdx-note-editor-wrapper">
            <ForwardRefEditor
                ref={editorRef}
                markdown={value}
                onChange={onChange}
                placeholder={placeholder}
                contentEditableClassName="mdx-note-editor-content"
            />
        </div>
    );
}

export default MarkdownNoteEditor;
