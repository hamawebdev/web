'use client';

import React, { memo } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { type Options as SanitizeSchema } from 'rehype-sanitize';
import { cn } from '@/lib/utils';
import { resolveImagePath } from '@/lib/image-loader';

/**
 * Renders question texts, options and explanations, which can be plain text, Markdown, Markdown
 * with inline HTML, or HTML from a rich-text editor (Quill inline styles). Raw HTML is parsed and
 * then sanitized: formatting, tables, links (http/https/mailto) and images (http/https/relative)
 * are kept with their Quill classes (ql-*) and harmless inline styles; scripts, event handlers,
 * iframes, forms, embeds, javascript: URLs, other classes and layout-breaking styles (negative
 * offsets, fixed/absolute positioning, z-index, oversized boxes) are removed.
 */

const FORMATTING_TAGS = [
  'p', 'br', 'hr', 'span', 'div', 'font', 'small', 'mark',
  'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del', 'ins', 'sub', 'sup', 'abbr',
  'ul', 'ol', 'li', 'dl', 'dt', 'dd',
  'table', 'caption', 'colgroup', 'col', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
  'blockquote', 'code', 'pre', 'kbd',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'a', 'img',
];

export const safeMarkdownSchema: SanitizeSchema = {
  tagNames: FORMATTING_TAGS,
  // Elements removed together with their content (anything else not allowed is unwrapped)
  strip: [
    'script', 'style', 'iframe', 'frame', 'frameset', 'object', 'embed', 'applet', 'noscript',
    'template', 'title', 'head', 'svg', 'math', 'input', 'textarea', 'select', 'button',
  ],
  attributes: {
    '*': ['className', 'style', 'title', 'lang', 'dir', 'align'],
    a: ['href'],
    img: ['src', 'alt', 'width', 'height'],
    font: ['color', 'size'],
    ol: ['start', 'type', 'reversed'],
    li: ['value'],
    th: ['colSpan', 'rowSpan', 'scope', 'width', 'vAlign'],
    td: ['colSpan', 'rowSpan', 'width', 'vAlign'],
    col: ['span', 'width'],
    colgroup: ['span', 'width'],
    table: ['width', 'border', 'cellPadding', 'cellSpacing'],
    blockquote: ['cite'],
  },
  protocols: {
    href: ['http', 'https', 'mailto'],
    src: ['http', 'https'],
    cite: ['http', 'https'],
  },
  ancestors: {
    tbody: ['table'],
    tfoot: ['table'],
    thead: ['table'],
    tr: ['table'],
    th: ['table'],
    td: ['table'],
    caption: ['table'],
    col: ['table'],
    colgroup: ['table'],
    li: ['ul', 'ol'],
  },
  required: {},
  clobber: [],
  clobberPrefix: '',
  allowComments: false,
  allowDoctypes: false,
};

/** Inline style properties kept after sanitizing (everything else, e.g. position, is dropped). */
const ALLOWED_STYLE_PROPERTY =
  /^(color|background-color|background|font(-(weight|style|size|family|variant))?|text-(align|decoration(-(line|color|style))?|indent|transform)|vertical-align|line-height|letter-spacing|word-spacing|white-space|(margin|padding)(-(top|right|bottom|left))?|border(-(top|right|bottom|left))?(-(width|style|color))?|border-collapse|border-radius|width|height|max-width|min-width|list-style(-type)?)$/i;
const UNSAFE_STYLE_VALUE = /url\s*\(|expression\s*\(|javascript:|@import|\\|<|>|\/\*/i;

/** Properties whose negative values pull content over the surrounding page. */
const OFFSET_PROPERTY = /^(margin(-(top|right|bottom|left))?|top|right|bottom|left|inset(-[a-z-]+)?|text-indent)$/i;
const NEGATIVE_NUMBER = /(^|[\s(,])-\s*\.?\d/;
const SIZE_PROPERTY = /^(min-|max-)?(width|height)$/i;
const MAX_BOX_SIZE_PX = 2000;
const LENGTH_TOKEN = /(\d*\.?\d+)\s*(px|pt|pc|in|cm|mm|q|r?em|ex|ch|vmin|vmax|vw|vh|%)?/gi;
const PX_PER_UNIT: Record<string, number> = {
  px: 1, pt: 96 / 72, pc: 16, in: 96, cm: 96 / 2.54, mm: 96 / 25.4, q: 96 / 101.6,
  em: 16, rem: 16, ex: 8, ch: 8,
};

/** True when a width/height value exceeds 2000px (or 100% / 100vw / 100vh). */
function exceedsMaxBoxSize(value: string): boolean {
  LENGTH_TOKEN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = LENGTH_TOKEN.exec(value)) !== null) {
    const amount = parseFloat(match[1]);
    const unit = (match[2] || 'px').toLowerCase();
    const factor = PX_PER_UNIT[unit];
    if (factor !== undefined ? amount * factor > MAX_BOX_SIZE_PX : amount > 100) return true;
  }
  return false;
}

/** Declarations that would let authored content overlay or blow up the page layout. */
function isLayoutBreaking(property: string, value: string): boolean {
  const name = property.toLowerCase();
  if (name === 'z-index') return true;
  if (name === 'position' && /fixed|absolute/i.test(value)) return true;
  if (OFFSET_PROPERTY.test(name) && NEGATIVE_NUMBER.test(value)) return true;
  if (SIZE_PROPERTY.test(name) && exceedsMaxBoxSize(value)) return true;
  return false;
}

/** Keep only harmless inline style declarations (colors, fonts, spacing, borders, sizes). */
export function filterInlineStyle(style: string): string {
  return style
    .split(';')
    .map((declaration) => declaration.trim())
    .filter((declaration) => {
      const colon = declaration.indexOf(':');
      if (colon <= 0) return false;
      const property = declaration.slice(0, colon).trim();
      const value = declaration.slice(colon + 1).trim();
      return (
        value.length > 0 &&
        ALLOWED_STYLE_PROPERTY.test(property) &&
        !UNSAFE_STYLE_VALUE.test(value) &&
        !isLayoutBreaking(property, value)
      );
    })
    .join('; ');
}

interface HastNode {
  type: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
}

/** Quill editor classes (ql-align-center, ql-indent-1, ql-size-large, ...); others are dropped. */
const QUILL_CLASS = /^ql-[\w-]+$/;

function filterClassNames(value: unknown): string[] {
  const names = Array.isArray(value) ? value : typeof value === 'string' ? value.split(/\s+/) : [];
  return names.filter((name): name is string => typeof name === 'string' && QUILL_CLASS.test(name));
}

function rehypeFilterStyles() {
  const visit = (node: HastNode) => {
    if (node.type === 'element' && node.properties) {
      if (typeof node.properties.style === 'string') {
        const filtered = filterInlineStyle(node.properties.style);
        if (filtered) node.properties.style = filtered;
        else delete node.properties.style;
      }
      if (node.properties.className !== undefined) {
        const classes = filterClassNames(node.properties.className);
        if (classes.length > 0) node.properties.className = classes;
        else delete node.properties.className;
      }
    }
    node.children?.forEach(visit);
  };
  return (tree: HastNode) => visit(tree);
}

const REMARK_PLUGINS = [remarkGfm];
const REHYPE_PLUGINS = [rehypeRaw, [rehypeSanitize, safeMarkdownSchema], rehypeFilterStyles] as NonNullable<
  React.ComponentProps<typeof ReactMarkdown>['rehypePlugins']
>;

function safeImageSrc(src: unknown): string | null {
  if (typeof src !== 'string' || !src.trim()) return null;
  const resolved = resolveImagePath(src);
  try {
    const url = new URL(resolved, 'https://med-adn.com');
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    return resolved;
  } catch {
    return null;
  }
}

const DEFAULT_COMPONENTS: Components = {
  a: ({ node: _node, className, children, ...props }) => (
    <a
      {...props}
      className={cn('text-primary underline underline-offset-2 hover:opacity-80 break-words', className)}
      target="_blank"
      rel="noopener noreferrer nofollow"
      onClick={(event) => event.stopPropagation()}
    >
      {children}
    </a>
  ),
  img: ({ node: _node, src, alt, className, ...props }) => {
    const safeSrc = safeImageSrc(src);
    if (!safeSrc) return null;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        {...props}
        src={safeSrc}
        alt={typeof alt === 'string' ? alt : ''}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        className={cn('inline-block max-w-full h-auto rounded', className)}
      />
    );
  },
  ul: ({ node: _node, className, ...props }) => <ul {...props} className={cn('list-disc pl-5 my-1', className)} />,
  ol: ({ node: _node, className, ...props }) => <ol {...props} className={cn('list-decimal pl-5 my-1', className)} />,
  li: ({ node: _node, className, ...props }) => <li {...props} className={cn('my-0.5', className)} />,
  table: ({ node: _node, className, ...props }) => (
    <div className="my-2 max-w-full overflow-x-auto">
      <table {...props} className={cn('border-collapse text-sm', className)} />
    </div>
  ),
  th: ({ node: _node, className, ...props }) => (
    <th {...props} className={cn('border border-border px-2 py-1 text-left align-top font-semibold', className)} />
  ),
  td: ({ node: _node, className, ...props }) => (
    <td {...props} className={cn('border border-border px-2 py-1 align-top', className)} />
  ),
  blockquote: ({ node: _node, className, ...props }) => (
    <blockquote {...props} className={cn('border-l-2 border-primary/50 pl-3 italic my-2', className)} />
  ),
  pre: ({ node: _node, className, ...props }) => (
    <pre {...props} className={cn('bg-muted p-2 rounded-lg overflow-x-auto my-2 text-xs font-mono', className)} />
  ),
  code: ({ node: _node, className, ...props }) => (
    <code {...props} className={cn('bg-muted px-1 py-0.5 rounded text-[0.9em] font-mono', className)} />
  ),
  h1: ({ node: _node, className, ...props }) => <h1 {...props} className={cn('text-xl font-bold my-1', className)} />,
  h2: ({ node: _node, className, ...props }) => <h2 {...props} className={cn('text-lg font-bold my-1', className)} />,
  h3: ({ node: _node, className, ...props }) => <h3 {...props} className={cn('text-base font-bold my-1', className)} />,
  h4: ({ node: _node, className, ...props }) => <h4 {...props} className={cn('text-sm font-bold my-1', className)} />,
  h5: ({ node: _node, className, ...props }) => <h5 {...props} className={cn('text-sm font-semibold my-1', className)} />,
  h6: ({ node: _node, className, ...props }) => <h6 {...props} className={cn('text-sm font-semibold my-1', className)} />,
};

/** Paragraphs as blocks that are valid inside inline parents (e.g. an option label). */
const INLINE_COMPONENTS: Components = {
  p: ({ node: _node, className, ...props }) => <span {...props} className={cn('block', className)} />,
};

export interface SafeMarkdownProps {
  /** Text to render (plain text, Markdown, or HTML). Empty values render nothing. */
  children?: string | null;
  /**
   * Render paragraphs as block-level spans so the output can sit inside a <p>, <span> or
   * <label> without producing invalid nesting.
   */
  inline?: boolean;
  /** Per-element overrides, merged over the defaults (define them outside render to keep memo). */
  components?: Components;
}

function SafeMarkdownImpl({ children, inline = false, components }: SafeMarkdownProps) {
  if (children === null || children === undefined) return null;
  const text = String(children);
  if (!text.trim()) return null;

  const merged: Components = {
    ...DEFAULT_COMPONENTS,
    ...(inline ? INLINE_COMPONENTS : null),
    ...components,
  };

  return (
    <ReactMarkdown remarkPlugins={REMARK_PLUGINS} rehypePlugins={REHYPE_PLUGINS} components={merged}>
      {text}
    </ReactMarkdown>
  );
}

export const SafeMarkdown = memo(SafeMarkdownImpl);
