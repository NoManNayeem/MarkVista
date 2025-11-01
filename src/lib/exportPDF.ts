import jsPDF from 'jspdf';
// Use html2canvas-pro for better support of modern CSS (lab() colors)
import html2canvas from 'html2canvas-pro';

export interface PDFExportOptions {
  fileName: string;
  element: HTMLElement;
}

export async function exportToPDF({ fileName, element }: PDFExportOptions): Promise<void> {
  try {
    // Find the actual markdown preview element (the one with id="markdown-preview")
    const markdownPreview = element.querySelector('#markdown-preview') as HTMLElement;
    const targetElement = markdownPreview || element;
    
    // Validate we have content
    if (!targetElement || targetElement.innerHTML.trim().length === 0) {
      throw new Error('No content found to export. Please ensure the preview is fully loaded.');
    }

    console.log('PDF export - Starting with html2canvas-pro');
    console.log('PDF export - Element dimensions:', {
      width: targetElement.offsetWidth,
      height: targetElement.offsetHeight,
      scrollHeight: targetElement.scrollHeight,
      scrollWidth: targetElement.scrollWidth,
    });

    // Wait for any images or diagrams to fully render
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Use html2canvas-pro which supports lab() colors natively
    const canvas = await html2canvas(targetElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      allowTaint: false,
      printBackground: true,
    } as any);

    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      throw new Error('Failed to generate canvas from HTML');
    }

    console.log('Canvas generated:', {
      width: canvas.width,
      height: canvas.height,
    });

    // Convert canvas to image
    const imgData = canvas.toDataURL('image/png', 1.0);
    
    // Calculate PDF dimensions
    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const pdf = new jsPDF({
      orientation: imgHeight > imgWidth ? 'portrait' : 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    // Handle multiple pages if content is long
    const pageHeight = 297; // A4 height in mm
    const pageWidth = 210; // A4 width in mm
    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if needed
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Save the PDF
    const safeFileName = fileName.replace(/[^a-z0-9_-]/gi, '_').toLowerCase() || 'document';
    pdf.save(`${safeFileName}.pdf`);
    
    console.log('PDF export completed successfully');
  } catch (error: any) {
    console.error('PDF export failed:', error);
    throw new Error(`Failed to export PDF: ${error?.message || 'Please try again'}`);
  }
}
