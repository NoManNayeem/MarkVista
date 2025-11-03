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

    // Clone the element to modify it without affecting the original
    const clonedElement = targetElement.cloneNode(true) as HTMLElement;

    // Ensure light backgrounds and RGB colors for all elements
    const style = document.createElement('style');
    style.textContent = `
      * {
        background-color: rgb(255, 255, 255) !important;
        color: rgb(0, 0, 0) !important;
      }
      .mermaid-rendered svg, svg {
        background-color: rgb(255, 255, 255) !important;
      }
      pre {
        background-color: rgb(245, 245, 245) !important;
        border: 1px solid rgb(221, 221, 221) !important;
        color: rgb(0, 0, 0) !important;
      }
      code {
        background-color: rgb(245, 245, 245) !important;
        color: rgb(0, 0, 0) !important;
      }
      /* Override any Tailwind lab() colors */
      [class*="text-"], [class*="bg-"], [class*="border-"] {
        color: inherit !important;
        background-color: inherit !important;
        border-color: currentColor !important;
      }
    `;
    clonedElement.prepend(style);

    // Configure html2pdf options for better quality
    const opt = {
      margin: [10, 10, 10, 10] as [number, number, number, number],
      filename: `${fileName.replace(/[^a-z0-9_-]/gi, '_').toLowerCase() || 'document'}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1200,
      },
      jsPDF: {
        unit: 'mm' as const,
        format: 'a4' as const,
        orientation: 'portrait' as const,
      },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    };

    // Generate and download PDF
    await html2pdf().set(opt).from(clonedElement).save();

    console.log('PDF export completed successfully');
  } catch (error) {
    console.error('PDF export failed:', error);
    const message = error instanceof Error ? error.message : 'Please try again';
    throw new Error(`Failed to export PDF: ${message}`);
  }
}
