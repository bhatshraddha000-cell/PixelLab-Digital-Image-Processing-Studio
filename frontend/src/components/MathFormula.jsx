import React, { useMemo } from 'react';
import katex from 'katex';

/**
 * MathFormula: Renders LaTeX mathematical expressions using KaTeX.
 * Falls back to readable plain-text math if KaTeX encounters parsing anomalies.
 */
export const MathFormula = ({
  tex,
  display = false,
  className = '',
  fallback = '',
}) => {
  const renderedHtml = useMemo(() => {
    if (!tex) return '';
    try {
      return katex.renderToString(tex, {
        displayMode: display,
        throwOnError: false,
        output: 'htmlAndMathml',
      });
    } catch (err) {
      console.warn('[KaTeX Render Warning]:', err.message);
      return null;
    }
  }, [tex, display]);

  if (!renderedHtml) {
    return (
      <span className={`font-mono text-xs ${className}`}>
        {fallback || tex}
      </span>
    );
  }

  return (
    <span
      className={`inline-block select-none ${display ? 'my-2 block text-center' : ''} ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
};

export default MathFormula;

