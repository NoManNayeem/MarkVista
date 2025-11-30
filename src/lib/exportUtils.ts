/**
 * Shared utilities for PDF and DOCX export functionality
 */

/**
 * Sanitize filename while preserving original casing
 * Replaces special characters with underscores, keeps alphanumeric and hyphens
 */
export function sanitizeFileName(name: string): string {
  if (!name || name.trim().length === 0) {
    return 'document';
  }

  // Remove file extension if present
  const nameWithoutExt = name.replace(/\.(md|markdown)$/i, '');

  // Replace special characters with underscores, but preserve case
  // Keep alphanumeric, hyphens, and underscores
  const sanitized = nameWithoutExt
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores

  return sanitized || 'document';
}

/**
 * Create a light-themed clone of the element for export
 * This ensures exports always have light backgrounds regardless of UI theme
 */
export function createLightThemedClone(element: HTMLElement): HTMLElement {
  const clone = element.cloneNode(true) as HTMLElement;

  // Remove all dark mode classes and force light theme
  const allElements = clone.querySelectorAll('*');
  allElements.forEach((el) => {
    const htmlEl = el as HTMLElement;
    
    // Remove dark: prefixed classes
    const classes = htmlEl.className.split(' ');
    const lightClasses = classes.filter(c => !c.startsWith('dark:'));
    htmlEl.className = lightClasses.join(' ');
    
    // Force light backgrounds on specific elements
    if (htmlEl.tagName === 'CODE' || htmlEl.tagName === 'PRE') {
      htmlEl.style.backgroundColor = '#f5f5f5';
      htmlEl.style.color = '#000000';
    }
    
    if (htmlEl.classList.contains('mermaid-rendered') || 
        htmlEl.classList.contains('mermaid-container')) {
      htmlEl.style.backgroundColor = '#ffffff';
    }
  });

  return clone;
}

/**
 * Wait for all images in the element to load
 */
export function waitForImages(element: HTMLElement): Promise<void> {
  const images = Array.from(element.querySelectorAll('img'));
  
  if (images.length === 0) {
    return Promise.resolve();
  }

  const promises = images.map((img) => {
    if (img.complete) {
      return Promise.resolve();
    }
    
    return new Promise<void>((resolve) => {
      img.addEventListener('load', () => resolve());
      img.addEventListener('error', () => resolve()); // Resolve even on error
      
      // Timeout after 5 seconds
      setTimeout(() => resolve(), 5000);
    });
  });

  return Promise.all(promises).then(() => {});
}

/**
 * Inject print-friendly styles into the element
 * Forces light theme and ensures all content is visible
 */
export function injectPrintStyles(element: HTMLElement): void {
  const style = document.createElement('style');
  style.textContent = `
    /* Force light theme for all elements */
    * {
      background-color: rgb(255, 255, 255) !important;
      color: rgb(0, 0, 0) !important;
      border-color: rgb(0, 0, 0) !important;
    }
    
    /* Ensure SVG diagrams have white background */
    .mermaid-rendered svg,
    .mermaid-container svg,
    svg {
      background-color: rgb(255, 255, 255) !important;
    }
    
    /* Code blocks */
    pre,
    code {
      background-color: rgb(245, 245, 245) !important;
      color: rgb(0, 0, 0) !important;
      border: 1px solid rgb(221, 221, 221) !important;
    }
    
    /* Inline code */
    code:not(pre code) {
      background-color: rgb(245, 245, 245) !important;
      color: rgb(219, 39, 119) !important;
      padding: 2px 6px;
      border-radius: 3px;
    }
    
    /* Tables */
    table {
      background-color: rgb(255, 255, 255) !important;
      border-collapse: collapse !important;
    }
    
    th {
      background-color: rgb(243, 244, 246) !important;
      color: rgb(0, 0, 0) !important;
      font-weight: 600 !important;
    }
    
    td, th {
      border: 1px solid rgb(209, 213, 219) !important;
      padding: 8px 12px !important;
    }
    
    /* Headings */
    h1, h2, h3, h4, h5, h6 {
      color: rgb(0, 0, 0) !important;
      page-break-after: avoid !important;
    }
    
    h1 {
      border-bottom: 2px solid rgb(209, 213, 219) !important;
      padding-bottom: 8px !important;
    }
    
    /* Blockquotes */
    blockquote {
      border-left: 4px solid rgb(59, 130, 246) !important;
      background-color: rgb(239, 246, 255) !important;
      color: rgb(0, 0, 0) !important;
      padding: 12px 16px !important;
      margin: 16px 0 !important;
    }
    
    /* Links */
    a {
      color: rgb(37, 99, 235) !important;
      text-decoration: underline !important;
    }
    
    /* Lists */
    ul, ol {
      color: rgb(0, 0, 0) !important;
    }
    
    /* Page breaks */
    table, pre, .mermaid-container {
      page-break-inside: avoid !important;
    }
    
    /* Override any Tailwind classes */
    [class*="text-"],
    [class*="bg-"],
    [class*="border-"] {
      /* Reset to defaults, let above rules take precedence */
    }
    
    /* Math equations */
    .katex,
    .katex * {
      color: rgb(0, 0, 0) !important;
    }
    
    /* Syntax highlighting - ensure readability */
    .code-block-container {
      background-color: rgb(245, 245, 245) !important;
      border-radius: 8px !important;
      overflow: hidden !important;
    }
  `;
  
  element.prepend(style);
}

/**
 * Get smart name for diagram based on nearest heading
 * Used for naming downloaded diagram images
 */
export function getSmartDiagramName(svgElement: SVGElement, index: number = 1): string {
  try {
    // Find the nearest parent container
    let currentElement: HTMLElement | null = svgElement.parentElement;
    let headingText = '';
    const maxLevels = 10; // Prevent infinite loops
    let level = 0;
    
    // Search up the DOM tree for nearest heading
    while (currentElement && level < maxLevels && !headingText) {
      // Look for heading in current level or previous siblings
      const heading = findNearestHeading(currentElement);
      if (heading) {
        headingText = heading.textContent?.trim() || '';
        break;
      }
      
      currentElement = currentElement.parentElement;
      level++;
    }
    
    // If found heading, sanitize it for filename
    if (headingText) {
      const sanitized = headingText
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 50); // Limit length
      
      return `${sanitized}-diagram-${index}.png`;
    }
    
    // Fallback to generic name with index
    return `diagram-${index}.png`;
  } catch (error) {
    console.error('Error generating diagram name:', error);
    return `diagram-${Date.now()}.png`;
  }
}

/**
 * Helper function to find nearest heading element
 */
function findNearestHeading(element: HTMLElement): HTMLElement | null {
  // Check previous siblings
  let sibling = element.previousElementSibling;
  while (sibling) {
    if (sibling.tagName.match(/^H[1-6]$/)) {
      return sibling as HTMLElement;
    }
    sibling = sibling.previousElementSibling;
  }
  
  // Check within the element itself (before the diagram)
  const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6');
  if (headings.length > 0) {
    // Return the last heading found (closest to the diagram)
    return headings[headings.length - 1] as HTMLElement;
  }
  
  return null;
}
