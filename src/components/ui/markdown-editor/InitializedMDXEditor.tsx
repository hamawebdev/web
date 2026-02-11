'use client';

import type { ForwardedRef } from 'react';
import {
    headingsPlugin,
    listsPlugin,
    quotePlugin,
    linkPlugin,
    linkDialogPlugin,
    tablePlugin,
    markdownShortcutPlugin,
    toolbarPlugin,
    BoldItalicUnderlineToggles,
    BlockTypeSelect,
    InsertTable,
    ListsToggle,
    MDXEditor,
    type MDXEditorMethods,
    type MDXEditorProps,
} from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';

export default function InitializedMDXEditor({
    editorRef,
    ...props
}: { editorRef: ForwardedRef<MDXEditorMethods> | null } & MDXEditorProps) {
    return (
        <MDXEditor
            className="mdx-editor-sticky-toolbar mdx-editor-flex-grow"
            plugins={[
                headingsPlugin(),
                listsPlugin(),
                quotePlugin(),
                linkPlugin(),
                linkDialogPlugin(),
                tablePlugin(),
                markdownShortcutPlugin(),
                toolbarPlugin({
                    toolbarContents: () => (
                        <div className="mdx-toolbar-compact flex flex-wrap gap-1 p-1 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                            <BoldItalicUnderlineToggles />
                            <BlockTypeSelect />
                            <ListsToggle />
                            <InsertTable />
                        </div>
                    ),
                }),
            ]}
            {...props}
            ref={editorRef}
        />
    );
}
