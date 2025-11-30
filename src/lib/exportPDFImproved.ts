import { sanitizeFileName, createLightThemedClone, waitForImages, injectPrintStyles } from './exportUtils';

export interface PDFExportOptions {
  fileName: string;
  element: HTMLElement;
}

export async function exportToPDFImproved({ fileName, element }: PDFExportOptions): Promise<void> {
  try {
    // Dynamic import to avoid SSR issues
    const html2pdf = (await import('html2pdf.js')).default;

    // Find the actual markdown preview element
    const markdownPreview = element.querySelector('#markdown-preview') as HTMLElement;
    const targetElement = markdownPreview || element;

    // Validate we have content
    if (!targetElement || targetElement.innerHTML.trim().length === 0) {
      throw new Error('No content found to export. Please ensure the preview is fully loaded.');
    }

    console.log('PDF export - Starting with html2pdf.js');
    console.log('PDF export - Waiting for images and diagrams to load...');

    // Wait for all images to load
    await waitForImages(targetElement);

    // Wait additional time for Mermaid diagrams to fully render
    await new Promise(resolve => setTimeout(resolve, 1500));

    console.log('PDF export - Creating light-themed clone...');

    // Create a light-themed clone to ensure exports always have light backgrounds
    const clonedElement = createLightThemedClone(targetElement);

    // Inject comprehensive print-friendly styles
    injectPrintStyles(clonedElement);

    // Additional aggressive style forcing for html2pdf.js
    const additionalStyle = document.createElement('style');
    additionalStyle.textContent = `
      /* Extra aggressive style forcing for PDF export */
      body, html {
        background-color: rgb(255, 255, 255) !important;
      }
      
      /* Ensure all syntax highlighter elements are visible */
      .code-block-container * {
        background-color: rgb(245, 245, 245) !important;
      }
      
      /* Force visibility on all text */
      p, span, div, li, td, th, code, pre {
        color: rgb(0, 0, 0) !important;
      }
      
      /* Special handling for inline code */
      code:not(pre code) {
        color: rgb(219, 39, 119) !important;
      }
    `;
    clonedElement.appendChild(additionalStyle);

    console.log('PDF export - Configuring export options...');

    // Sanitize filename while preserving case
    const safeFileName = sanitizeFileName(fileName);

    // Configure html2pdf options for better quality
    const opt = {
      margin: [10, 10, 10, 10] as [number, number, number, number],
      filename: `${safeFileName}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1200,
        // Force light rendering
        onclone: (clonedDoc: Document) => {
          const clonedBody = clonedDoc.body;
          if (clonedBody) {
            clonedBody.style.backgroundColor = '#ffffff';
            clonedBody.style.color = '#000000';
          }
        },
      },
      jsPDF: {
        unit: 'mm' as const,
        format: 'a4' as const,
        orientation: 'portrait' as const,
      },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    };

    console.log('PDF export - Generating PDF...');

    // Generate and download PDF
    await html2pdf().set(opt).from(clonedElement).save();

    console.log('PDF export completed successfully - File:', `${safeFileName}.pdf`);
  } catch (error) {
    console.error('PDF export failed:', error);
    const message = error instanceof Error ? error.message : 'Please try again';
    throw new Error(`Failed to export PDF: ${message}`);
  }
}
