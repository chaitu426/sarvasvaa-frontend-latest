'use client';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose prose-invert max-w-full break-words overflow-hidden">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          table({ children }) {
            return (
              <div className="overflow-x-auto my-3 w-full">
                <table className="min-w-full table-auto border border-[#2a2a2a] text-sm sm:text-base">
                  {children}
                </table>
              </div>
            );
          },
          th({ children }) {
            return (
              <th className="px-3 sm:px-4 py-2 border border-[#2a2a2a] bg-[#1f1f1f] text-left text-gray-100">
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className="px-3 sm:px-4 py-2 border border-[#2a2a2a] text-gray-300 break-words">
                {children}
              </td>
            );
          },
          blockquote({ children }) {
            return (
              <blockquote className="border-l-4 border-[#0a84ff] pl-3 sm:pl-4 italic text-gray-400 my-3">
                {children}
              </blockquote>
            );
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                className="text-blue-500 hover:underline break-words"
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </a>
            );
          },
          h1({ children }) {
            return <h1 className="text-xl sm:text-2xl font-bold text-gray-100 my-3">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="text-lg sm:text-xl font-semibold text-gray-100 my-3">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="text-base sm:text-lg font-medium text-gray-100 my-2">{children}</h3>;
          },
          hr() {
            return <hr className="border-t border-[#2a2a2a] my-4" />;
          },
          p({ children }) {
            return <p className="my-2 text-gray-300 break-words">{children}</p>;
          },
          ul({ children }) {
            return <ul className="list-disc pl-5 sm:pl-6 my-2">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal pl-5 sm:pl-6 my-2">{children}</ol>;
          },
          li({ children }) {
            return <li className="my-1">{children}</li>;
          },
          code({ children }) {
            return (
              <code className="bg-[#1a1a1a] text-[#0a84ff] px-1 sm:px-2 py-0.5 rounded-sm break-words text-[13px] sm:text-[14px]">
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
