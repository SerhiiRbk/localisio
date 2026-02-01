'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Simple markdown renderer for basic formatting
 * Supports: **bold**, *italic*, - bullet points, line breaks
 */
export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const renderMarkdown = (text: string): React.ReactNode[] => {
    // Split by lines first to handle bullet points
    const lines = text.split('\n');
    const result: React.ReactNode[] = [];
    let currentList: string[] = [];
    
    const flushList = () => {
      if (currentList.length > 0) {
        result.push(
          <ul key={`list-${result.length}`} className="list-disc list-inside space-y-1 my-2">
            {currentList.map((item, i) => (
              <li key={i}>{renderInlineMarkdown(item)}</li>
            ))}
          </ul>
        );
        currentList = [];
      }
    };
    
    lines.forEach((line, lineIndex) => {
      const trimmedLine = line.trim();
      
      // Check for bullet points (- or *)
      if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
        currentList.push(trimmedLine.slice(2));
      } else {
        flushList();
        
        if (trimmedLine === '') {
          // Empty line - add spacing
          result.push(<br key={`br-${lineIndex}`} />);
        } else {
          // Regular paragraph
          result.push(
            <p key={`p-${lineIndex}`} className="mb-2 last:mb-0">
              {renderInlineMarkdown(line)}
            </p>
          );
        }
      }
    });
    
    flushList();
    return result;
  };
  
  const renderInlineMarkdown = (text: string): React.ReactNode => {
    // Pattern to match **bold**, *italic*
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let keyIndex = 0;
    
    while (remaining.length > 0) {
      // Try to match bold first (** **)
      const boldMatch = remaining.match(/^\*\*(.+?)\*\*/);
      if (boldMatch) {
        parts.push(<strong key={keyIndex++} className="font-semibold">{boldMatch[1]}</strong>);
        remaining = remaining.slice(boldMatch[0].length);
        continue;
      }
      
      // Try to match italic (* *)
      const italicMatch = remaining.match(/^\*(.+?)\*/);
      if (italicMatch) {
        parts.push(<em key={keyIndex++} className="italic">{italicMatch[1]}</em>);
        remaining = remaining.slice(italicMatch[0].length);
        continue;
      }
      
      // Find the next special character
      const nextSpecial = remaining.search(/\*/);
      if (nextSpecial === -1) {
        // No more special characters
        parts.push(<span key={keyIndex++}>{remaining}</span>);
        break;
      } else if (nextSpecial === 0) {
        // Unmatched asterisk, treat as literal
        parts.push(<span key={keyIndex++}>*</span>);
        remaining = remaining.slice(1);
      } else {
        // Regular text before next special
        parts.push(<span key={keyIndex++}>{remaining.slice(0, nextSpecial)}</span>);
        remaining = remaining.slice(nextSpecial);
      }
    }
    
    return parts.length === 1 ? parts[0] : <>{parts}</>;
  };
  
  if (!content) return null;
  
  return (
    <div className={cn('text-slate-700', className)}>
      {renderMarkdown(content)}
    </div>
  );
}
