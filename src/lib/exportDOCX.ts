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

    console.log('DOCX export - Element passed:', element.className);
    console.log('DOCX export - Found markdown preview:', !!markdownPreview);
    console.log('DOCX export - Target element:', targetElement.id, targetElement.className);

    // Validate we have content
    if (!targetElement || targetElement.innerHTML.trim().length === 0) {
      throw new Error('No content found to export. Please ensure the preview is fully loaded.');
    }

    console.log('DOCX export - Original content length:', targetElement.innerHTML.length);

    // Force light theme for export by temporarily removing dark mode classes
    const htmlElement = document.documentElement;
    const bodyElement = document.body;
    const originalHtmlClass = htmlElement.className;
    const originalBodyClass = bodyElement.className;
    const originalTheme = htmlElement.getAttribute('data-theme');

    // Remove dark mode
    htmlElement.classList.remove('dark');
    bodyElement.classList.remove('dark');
    htmlElement.removeAttribute('data-theme');
    htmlElement.setAttribute('data-theme', 'light');

    // Wait a moment for styles to update
    await new Promise(resolve => setTimeout(resolve, 100));

    console.log('DOCX export - Applied light theme styles');

    try {
      // Clone the element to avoid modifying the original
      const clonedElement = targetElement.cloneNode(true) as HTMLElement;

    // Remove problematic elements that don't work well in DOCX
    const elementsToRemove = clonedElement.querySelectorAll('script, canvas, svg, button, [class*="mermaid"]');
    elementsToRemove.forEach(el => el.remove());

    // Get simple text content - the library will handle basic formatting
    const contentHTML = clonedElement.innerHTML;

    if (!contentHTML || contentHTML.trim().length === 0) {
      throw new Error('Content is empty after cleaning. Cannot export DOCX.');
    }

    console.log('DOCX export - Original content HTML length:', contentHTML.length);

    // Create a simple, clean HTML version
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = contentHTML;

    // Clean up all attributes except basic ones
    const tempAllElements = tempDiv.querySelectorAll('*');
    tempAllElements.forEach(el => {
      // Remove all class and data attributes
      el.removeAttribute('class');
      el.removeAttribute('node');
      Array.from(el.attributes).forEach(attr => {
        if (attr.name.startsWith('data-') || attr.name.startsWith('aria-') || attr.value === '[object Object]') {
          el.removeAttribute(attr.name);
        }
      });
    });

    // Get the cleaned HTML
    const cleanContentHTML = tempDiv.innerHTML
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    if (!cleanContentHTML || cleanContentHTML.length === 0) {
      throw new Error('Content became empty after cleaning. Cannot export DOCX.');
    }

    console.log('DOCX export - Cleaned content HTML length:', cleanContentHTML.length);

    // Build simple HTML document - html-docx-js-typescript has very limited CSS support
    const docxHTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
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
    } catch (convertError) {
      console.error('DOCX conversion error:', convertError);
      const message = convertError instanceof Error ? convertError.message : 'Unknown error';
      throw new Error(`DOCX conversion failed: ${message}`);
    }

    // Convert to Blob if needed
    let blob: Blob;
    if (docxBlob instanceof Blob) {
      blob = docxBlob;
    } else {
      // Handle Buffer or ArrayBuffer
      let data: BlobPart;
      if (typeof Buffer !== 'undefined' && Buffer.isBuffer(docxBlob)) {
        // Node.js Buffer - convert to Uint8Array for blob
        data = new Uint8Array(docxBlob as Buffer);
      } else if (docxBlob instanceof ArrayBuffer) {
        data = docxBlob;
      } else {
        // Try Uint8Array or convert unknown type
        data = new Uint8Array(docxBlob as ArrayBuffer | ArrayLike<number>);
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
    } finally {
      // Restore original theme
      htmlElement.className = originalHtmlClass;
      bodyElement.className = originalBodyClass;
      if (originalTheme) {
        htmlElement.setAttribute('data-theme', originalTheme);
      } else {
        htmlElement.removeAttribute('data-theme');
      }

      console.log('DOCX export - Restored original theme');
    }
  } catch (error) {
    console.error('DOCX export failed:', error);
    const message = error instanceof Error ? error.message : 'Please try again';
    throw new Error(`Failed to export DOCX: ${message}`);
  }
}
