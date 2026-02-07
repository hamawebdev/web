'use client';

import dynamic from 'next/dynamic';
import { forwardRef } from 'react';
import { type MDXEditorMethods, type MDXEditorProps } from '@mdxeditor/editor';

// Dynamically import the initialized editor with SSR disabled
const Editor = dynamic(() => import('./InitializedMDXEditor'), {
    ssr: false,
    loading: () => (
        <div className="h-[120px] w-full animate-pulse rounded-md border bg-muted" />
    ),
});

// ForwardRef wrapper for parent components to access editor methods
export const ForwardRefEditor = forwardRef<MDXEditorMethods, MDXEditorProps>(
    (props, ref) => <Editor {...props} editorRef={ref} />
);

ForwardRefEditor.displayName = 'ForwardRefEditor';
