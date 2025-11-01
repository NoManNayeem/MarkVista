import { saveAs } from 'file-saver';
import * as htmlDocx from 'html-docx-js-typescript';

export interface DOCXExportOptions {
  fileName: string;
  element: HTMLElement;
}

export async function exportToDOCX({ fileName, element }: DOCXExportOptions): Promise<void> {
  try {
    // Find the actual markdown preview element (the one with id="markdown-preview")
    const markdownPreview = element.querySelector('#markdown-preview') as HTMLElement;
    const targetElement = markdownPreview || element;
    
    // Validate we have content
    if (!targetElement || targetElement.innerHTML.trim().length === 0) {
      throw new Error('No content found to export. Please ensure the preview is fully loaded.');
    }
    
    // Clone the element to avoid modifying the original
    const clonedElement = targetElement.cloneNode(true) as HTMLElement;
    
    // Remove problematic elements that don't work well in DOCX
    const elementsToRemove = clonedElement.querySelectorAll('script, canvas, svg');
    elementsToRemove.forEach(el => el.remove());
    
    // Convert all lab() colors to RGB using computed styles
    const allElements = clonedElement.querySelectorAll('*');
    const elementsToProcess = [clonedElement, ...Array.from(allElements)] as HTMLElement[];
    
    elementsToProcess.forEach((el) => {
      const computedStyle = window.getComputedStyle(el);
      const styleProps = ['color', 'background-color', 'border-color'];
      
      styleProps.forEach(prop => {
        const computedValue = computedStyle.getPropertyValue(prop);
        if (computedValue && computedValue.startsWith('rgb')) {
          el.style.setProperty(prop, computedValue, 'important');
        }
      });
    });
    
    // Get cleaned HTML content
    let contentHTML = clonedElement.innerHTML;
    
    if (!contentHTML || contentHTML.trim().length === 0) {
      throw new Error('Content is empty after cleaning. Cannot export DOCX.');
    }

    console.log('DOCX export - Original content HTML length:', contentHTML.length);
    console.log('DOCX export - Content preview:', contentHTML.substring(0, 300));

    // Convert Tailwind classes and computed styles to inline styles
    // First, we need to create a temporary DOM element to parse the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = contentHTML;
    
    // Remove problematic elements from temp div
    const tempElementsToRemove = tempDiv.querySelectorAll('script, canvas, svg');
    tempElementsToRemove.forEach(el => el.remove());
    
    // Function to convert Tailwind classes to inline styles using computed styles
    const convertClassesToStyles = (element: HTMLElement, originalRoot: HTMLElement) => {
      // Get the corresponding original element to compute styles
      const originalElements = originalRoot.querySelectorAll('*');
      let originalElement: HTMLElement | null = null;
      
      // Try to find matching element by tag name and content
      for (const orig of Array.from(originalElements)) {
        if (orig.tagName === element.tagName && 
            orig.textContent?.trim() === element.textContent?.trim() &&
            orig.className === element.className) {
          originalElement = orig as HTMLElement;
          break;
        }
      }
      
      // If found, apply computed styles
      if (originalElement) {
        const computedStyle = window.getComputedStyle(originalElement);
        
        // Critical style properties to preserve
        const styleProps = [
          'color', 'background-color', 'background',
          'font-family', 'font-size', 'font-weight', 'font-style',
          'text-align', 'line-height', 'letter-spacing',
          'margin', 'margin-top', 'margin-bottom', 'margin-left', 'margin-right',
          'padding', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right',
          'border', 'border-top', 'border-bottom', 'border-left', 'border-right',
          'border-color', 'border-width', 'border-style', 'border-radius',
          'width', 'max-width', 'min-width',
          'display', 'list-style-type'
        ];
        
        // Build inline style string
        let inlineStyles: string[] = [];
        styleProps.forEach(prop => {
          try {
            const value = computedStyle.getPropertyValue(prop);
            if (value && value.trim() !== 'none' && value.trim() !== 'auto' && value.trim() !== '') {
              // Convert CSS property name to camelCase for inline styles
              const camelProp = prop.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
              
              // For colors, ensure RGB format
              if (prop.includes('color') || prop === 'background' || prop.includes('border')) {
                if (value.startsWith('rgb') || value.startsWith('#') || value.startsWith('rgba')) {
                  inlineStyles.push(`${prop}: ${value}`);
                }
              } else {
                inlineStyles.push(`${prop}: ${value}`);
              }
            }
          } catch (e) {
            // Ignore errors
          }
        });
        
        // Apply inline styles
        if (inlineStyles.length > 0) {
          element.setAttribute('style', inlineStyles.join('; ') + (element.getAttribute('style') || ''));
        }
      }
      
      // Process children recursively
      Array.from(element.children).forEach(child => {
        convertClassesToStyles(child as HTMLElement, originalRoot);
      });
    };
    
    // Convert all elements to have inline styles
    Array.from(tempDiv.children).forEach(child => {
      convertClassesToStyles(child as HTMLElement, targetElement);
    });
    
    // Clean up React-specific attributes
    const tempAllElements = tempDiv.querySelectorAll('*');
    tempAllElements.forEach(el => {
      // Remove React node attributes
      el.removeAttribute('node');
      // Remove data attributes
      Array.from(el.attributes).forEach(attr => {
        if (attr.name.startsWith('data-') || attr.value === '[object Object]') {
          el.removeAttribute(attr.name);
        }
      });
      // Remove class attributes (styles are now inline)
      el.removeAttribute('class');
    });
    
    // Remove script tags and replace SVG
    tempDiv.querySelectorAll('script').forEach(el => el.remove());
    tempDiv.querySelectorAll('svg').forEach(el => {
      const p = document.createElement('p');
      p.textContent = '[Diagram - SVG not supported in DOCX]';
      p.setAttribute('style', 'color: #666; font-style: italic;');
      el.parentNode?.replaceChild(p, el);
    });
    
    // Get cleaned HTML
    let cleanContentHTML = tempDiv.innerHTML
      .replace(/style="[^"]*lab\([^"]*\)[^"]*"/gi, '') // Remove any remaining lab() colors
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    if (!cleanContentHTML || cleanContentHTML.length === 0) {
      throw new Error('Content became empty after cleaning. Cannot export DOCX.');
    }

    console.log('DOCX export - Cleaned content HTML length:', cleanContentHTML.length);
    console.log('DOCX export - Cleaned preview:', cleanContentHTML.substring(0, 300));

    // Build HTML with enhanced styling that matches the rendered version
    // Inline styles from elements should already be preserved above
    const docxHTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
body { 
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
  font-size: 16px; 
  line-height: 1.6; 
  color: #000; 
  margin: 0;
  padding: 48px;
  max-width: 210mm;
}
h1 { 
  font-size: 2.25rem; 
  font-weight: 700; 
  margin-top: 2rem; 
  margin-bottom: 1.5rem; 
  padding-bottom: 0.75rem; 
  border-bottom: 2px solid #d1d5db; 
  color: #111827; 
}
h2 { 
  font-size: 1.875rem; 
  font-weight: 600; 
  margin-top: 2rem; 
  margin-bottom: 1rem; 
  color: #1f2937; 
}
h3 { 
  font-size: 1.5rem; 
  font-weight: 600; 
  margin-top: 1.5rem; 
  margin-bottom: 0.75rem; 
  color: #1f2937; 
}
p { 
  font-size: 1rem; 
  line-height: 1.75; 
  margin-bottom: 1rem; 
  color: #374151; 
}
table { 
  border-collapse: collapse; 
  width: 100%; 
  margin: 1.5rem 0; 
  border: 2px solid #d1d5db; 
}
th { 
  background-color: #f3f4f6; 
  border: 1px solid #d1d5db; 
  padding: 0.75rem 1rem; 
  text-align: left; 
  font-weight: 600; 
  color: #111827; 
}
td { 
  border: 1px solid #d1d5db; 
  padding: 0.75rem 1rem; 
  color: #374151; 
}
blockquote { 
  border-left: 4px solid #3b82f6; 
  padding-left: 1.5rem; 
  padding-top: 0.75rem; 
  padding-bottom: 0.75rem; 
  margin: 1.5rem 0; 
  background-color: #eff6ff; 
  font-style: italic; 
  color: #374151; 
  border-radius: 0 0.25rem 0.25rem 0; 
}
code { 
  background-color: #f3f4f6; 
  color: #ec4899; 
  padding: 0.125rem 0.5rem; 
  border-radius: 0.25rem; 
  font-family: 'Courier New', 'Consolas', monospace; 
  font-size: 0.875rem; 
}
pre { 
  background-color: #282c34; 
  color: #ffffff; 
  padding: 1rem; 
  border-radius: 0.5rem; 
  margin: 1.5rem 0; 
  overflow-x: auto; 
  font-family: 'Courier New', 'Consolas', monospace; 
}
pre code { 
  background-color: transparent; 
  color: #ffffff; 
  padding: 0; 
}
ul, ol { 
  margin: 0 0 1rem 1.5rem; 
  padding-left: 1.5rem; 
  color: #374151; 
}
li { 
  margin-bottom: 0.5rem; 
}
a { 
  color: #2563eb; 
  text-decoration: underline; 
}
a:hover { 
  color: #1e40af; 
}
hr { 
  border: none; 
  border-top: 2px solid #d1d5db; 
  margin: 2rem 0; 
}
img { 
  max-width: 100%; 
  height: auto; 
  border-radius: 0.5rem; 
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); 
  margin: 1.5rem 0; 
  display: block; 
}
</style>
</head>
<body>
${cleanContentHTML}
</body>
</html>`;

    console.log('DOCX export - Final HTML length:', docxHTML.length);

    // Convert HTML to DOCX - html-docx-js-typescript expects complete HTML document
    let docxBlob;
    try {
      docxBlob = await htmlDocx.asBlob(docxHTML);
      console.log('DOCX conversion successful');
    } catch (convertError: any) {
      console.error('DOCX conversion error:', convertError);
      throw new Error(`DOCX conversion failed: ${convertError?.message || 'Unknown error'}`);
    }

    // Convert to Blob if needed
    let blob: Blob;
    if (docxBlob instanceof Blob) {
      blob = docxBlob;
    } else {
      // Handle Buffer or ArrayBuffer
      let data: BlobPart;
      if (typeof Buffer !== 'undefined' && Buffer.isBuffer(docxBlob)) {
        // Node.js Buffer - convert to ArrayBuffer
        const buf = docxBlob as any;
        data = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
      } else if (docxBlob instanceof ArrayBuffer) {
        data = docxBlob;
      } else {
        // Try Uint8Array
        try {
          data = new Uint8Array(docxBlob as any);
        } catch {
          // Last resort: wrap as-is
          data = docxBlob as any;
        }
      }
      blob = new Blob([data], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
    }

    // Validate blob
    if (!blob || blob.size === 0) {
      throw new Error(`Failed to generate DOCX file. Blob size: ${blob?.size || 0} bytes`);
    }

    console.log('DOCX blob size:', blob.size, 'bytes');
    console.log('DOCX blob type:', blob.type);

    // Save the file
    const safeFileName = fileName.replace(/[^a-z0-9_-]/gi, '_').toLowerCase() || 'document';
    saveAs(blob, `${safeFileName}.docx`);
    
    console.log('DOCX export completed successfully');
  } catch (error: any) {
    console.error('DOCX export failed:', error);
    throw new Error(`Failed to export DOCX: ${error?.message || 'Please try again'}`);
  }
}
