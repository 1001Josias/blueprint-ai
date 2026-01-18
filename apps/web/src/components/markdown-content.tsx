"use client";

import { useState, useEffect } from "react";
import { remark } from "remark";
import html from "remark-html";
import { cn } from "@/lib/utils";

interface MarkdownContentProps {
  content: string;
  className?: string;
}

/**
 * Renders markdown content as styled HTML
 */
export function MarkdownContent({ content, className }: MarkdownContentProps) {
  const [htmlContent, setHtmlContent] = useState<string>("");

  useEffect(() => {
    async function parseMarkdown() {
      const result = await remark().use(html).process(content);
      setHtmlContent(result.toString());
    }
    parseMarkdown();
  }, [content]);

  return (
    <div
      className={cn(
        "prose prose-invert prose-sm max-w-none",
        // Headings
        "prose-headings:text-white prose-headings:font-semibold",
        // Paragraphs
        "prose-p:text-slate-300 prose-p:leading-relaxed prose-p:my-2",
        // Links
        "prose-a:text-violet-400 prose-a:no-underline hover:prose-a:underline",
        // Code
        "prose-code:text-violet-300 prose-code:bg-slate-800/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none",
        // Pre/Code blocks
        "prose-pre:bg-slate-800/80 prose-pre:border prose-pre:border-slate-700/50 prose-pre:rounded-lg",
        // Lists
        "prose-ul:text-slate-300 prose-ol:text-slate-300",
        "prose-li:marker:text-slate-500",
        // Strong/Em
        "prose-strong:text-white prose-strong:font-semibold",
        "prose-em:text-slate-200",
        // Blockquote
        "prose-blockquote:border-violet-500 prose-blockquote:text-slate-400",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}
