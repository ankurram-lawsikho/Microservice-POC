import React from 'react';

const MarkdownRenderer = ({ content, className = "" }) => {
  if (!content) return null;

  // Simple markdown parser for basic formatting
  const parseMarkdown = (text) => {
    // Split by lines and process each line
    const lines = text.split('\n');
    const elements = [];
    let listIndex = 0;

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Skip empty lines
      if (!trimmedLine) {
        elements.push(<br key={`br-${index}`} />);
        return;
      }

      // Headers
      if (trimmedLine.startsWith('###')) {
        elements.push(
          <h3 key={index} className="text-lg font-semibold text-gray-900 mt-4 mb-2">
            {trimmedLine.replace(/^###\s*/, '')}
          </h3>
        );
      } else if (trimmedLine.startsWith('##')) {
        elements.push(
          <h2 key={index} className="text-xl font-bold text-gray-900 mt-6 mb-3">
            {trimmedLine.replace(/^##\s*/, '')}
          </h2>
        );
      } else if (trimmedLine.startsWith('#')) {
        elements.push(
          <h1 key={index} className="text-2xl font-bold text-gray-900 mt-8 mb-4">
            {trimmedLine.replace(/^#\s*/, '')}
          </h1>
        );
      }
      // Numbered lists
      else if (/^\d+\.\s/.test(trimmedLine)) {
        const listItem = trimmedLine.replace(/^\d+\.\s/, '');
        elements.push(
          <div key={index} className="flex items-start mb-2">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
              {trimmedLine.match(/^\d+/)[0]}
            </span>
            <span className="text-gray-700">{parseInlineMarkdown(listItem)}</span>
          </div>
        );
      }
      // Bullet points
      else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
        const listItem = trimmedLine.replace(/^[-*]\s/, '');
        elements.push(
          <div key={index} className="flex items-start mb-2">
            <span className="flex-shrink-0 w-2 h-2 bg-gray-400 rounded-full mr-3 mt-2"></span>
            <span className="text-gray-700">{parseInlineMarkdown(listItem)}</span>
          </div>
        );
      }
      // Code blocks
      else if (trimmedLine.startsWith('```')) {
        elements.push(
          <div key={index} className="bg-gray-100 rounded-lg p-4 my-4">
            <pre className="text-sm text-gray-800 overflow-x-auto">
              <code>{trimmedLine.replace(/^```/, '')}</code>
            </pre>
          </div>
        );
      }
      // Regular paragraphs
      else {
        elements.push(
          <p key={index} className="text-gray-700 mb-3 leading-relaxed">
            {parseInlineMarkdown(trimmedLine)}
          </p>
        );
      }
    });

    return elements;
  };

  // Parse inline markdown (bold, italic, etc.)
  const parseInlineMarkdown = (text) => {
    const elements = [];
    let currentIndex = 0;
    
    // Process text character by character to handle nested formatting
    const processText = (inputText) => {
      const parts = [];
      let i = 0;
      
      while (i < inputText.length) {
        // Check for bold **text** or __text__
        if (inputText.substr(i, 2) === '**' || inputText.substr(i, 2) === '__') {
          const delimiter = inputText.substr(i, 2);
          const endIndex = inputText.indexOf(delimiter, i + 2);
          
          if (endIndex !== -1) {
            const content = inputText.substring(i + 2, endIndex);
            parts.push(
              <strong key={`bold-${i}`} className="font-semibold text-gray-900">
                {processText(content)}
              </strong>
            );
            i = endIndex + 2;
            continue;
          }
        }
        
        // Check for italic *text* or _text_ (but not if it's part of bold)
        if (inputText[i] === '*' && inputText[i + 1] !== '*') {
          const endIndex = inputText.indexOf('*', i + 1);
          if (endIndex !== -1 && inputText[endIndex + 1] !== '*') {
            const content = inputText.substring(i + 1, endIndex);
            parts.push(
              <em key={`italic-${i}`} className="italic text-gray-800">
                {processText(content)}
              </em>
            );
            i = endIndex + 1;
            continue;
          }
        }
        
        if (inputText[i] === '_' && inputText[i + 1] !== '_') {
          const endIndex = inputText.indexOf('_', i + 1);
          if (endIndex !== -1 && inputText[endIndex + 1] !== '_') {
            const content = inputText.substring(i + 1, endIndex);
            parts.push(
              <em key={`italic-${i}`} className="italic text-gray-800">
                {processText(content)}
              </em>
            );
            i = endIndex + 1;
            continue;
          }
        }
        
        // Check for inline code `code`
        if (inputText[i] === '`') {
          const endIndex = inputText.indexOf('`', i + 1);
          if (endIndex !== -1) {
            const content = inputText.substring(i + 1, endIndex);
            parts.push(
              <code key={`code-${i}`} className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800">
                {content}
              </code>
            );
            i = endIndex + 1;
            continue;
          }
        }
        
        // Regular character
        parts.push(inputText[i]);
        i++;
      }
      
      return parts;
    };
    
    const processedParts = processText(text);
    return processedParts.length > 0 ? processedParts : text;
  };

  return (
    <div className={`prose prose-sm max-w-none ${className}`}>
      {parseMarkdown(content)}
    </div>
  );
};

export default MarkdownRenderer;
