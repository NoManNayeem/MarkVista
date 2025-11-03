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

    console.log('PDF export - Element passed:', element.className);
    console.log('PDF export - Found markdown preview:', !!markdownPreview);
    console.log('PDF export - Target element:', targetElement.id, targetElement.className);

    // Validate we have content
    if (!targetElement || targetElement.innerHTML.trim().length === 0) {
      throw new Error('No content found to export. Please ensure the preview is fully loaded.');
    }

    console.log('PDF export - Content length:', targetElement.innerHTML.length);
    console.log('PDF export - Starting with html2canvas-pro');
    console.log('PDF export - Element dimensions:', {
      width: targetElement.offsetWidth,
      height: targetElement.offsetHeight,
      scrollHeight: targetElement.scrollHeight,
      scrollWidth: targetElement.scrollWidth,
    });

    // Wait for any images or diagrams to fully render
    await new Promise(resolve => setTimeout(resolve, 1000));

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

    // Force light background on the target element and all children
    const originalStyles = new Map<HTMLElement, string>();
    const allElements = [targetElement, ...Array.from(targetElement.querySelectorAll('*'))] as HTMLElement[];

    allElements.forEach(el => {
      originalStyles.set(el, el.style.cssText);
      const computedStyle = window.getComputedStyle(el);

      // Force light theme background colors
      const bgColor = computedStyle.backgroundColor;
      if (bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent' || bgColor === '') {
        el.style.backgroundColor = '#ffffff';
      } else if (bgColor.includes('rgba') || bgColor.includes('rgb')) {
        // Check if it's a dark background
        const rgbMatch = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (rgbMatch) {
          const r = parseInt(rgbMatch[1]);
          const g = parseInt(rgbMatch[2]);
          const b = parseInt(rgbMatch[3]);
          // If background is dark (brightness < 128), make it white
          const brightness = (r + g + b) / 3;
          if (brightness < 128) {
            el.style.backgroundColor = '#ffffff';
          }
        }
      }

      // Ensure text is visible - convert light text to dark
      const textColor = computedStyle.color;
      if (textColor.includes('rgba') || textColor.includes('rgb')) {
        const rgbMatch = textColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (rgbMatch) {
          const r = parseInt(rgbMatch[1]);
          const g = parseInt(rgbMatch[2]);
          const b = parseInt(rgbMatch[3]);
          // If text is light (brightness > 200), make it dark
          const brightness = (r + g + b) / 3;
          if (brightness > 200) {
            el.style.color = '#000000';
          }
        }
      }
    });

    console.log('PDF export - Applied light theme styles');

    try {
      // Use html2canvas-pro which supports lab() colors natively
      const canvas = await html2canvas(targetElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: false,
      });

      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        throw new Error('Failed to generate canvas from HTML');
      }

      console.log('Canvas generated:', {
        width: canvas.width,
        height: canvas.height,
      });

      // Convert canvas to image with error handling
      let imgData: string;
      try {
        imgData = canvas.toDataURL('image/jpeg', 0.95); // Use JPEG instead of PNG for better compatibility and smaller size

        // Validate the image data
        if (!imgData || imgData === 'data:,' || imgData.length < 100) {
          throw new Error('Canvas produced invalid image data');
        }
      } catch (canvasError) {
        console.error('Canvas toDataURL failed:', canvasError);
        throw new Error('Failed to convert canvas to image. The content may be too large or contain cross-origin resources.');
      }

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

      try {
        // Add first page
        pdf.addImage(imgData, 'JPEG', 0, position, pageWidth, imgHeight);
        heightLeft -= pageHeight;

        // Add additional pages if needed
        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 0, position, pageWidth, imgHeight);
          heightLeft -= pageHeight;
        }
      } catch (addImageError) {
        console.error('Failed to add image to PDF:', addImageError);
        throw new Error('Failed to add content to PDF. The document may be too large.');
      }

      // Save the PDF
      const safeFileName = fileName.replace(/[^a-z0-9_-]/gi, '_').toLowerCase() || 'document';
      pdf.save(`${safeFileName}.pdf`);

      console.log('PDF export completed successfully');
    } finally {
      // Restore original styles
      allElements.forEach(el => {
        const originalStyle = originalStyles.get(el);
        if (originalStyle !== undefined) {
          el.style.cssText = originalStyle;
        }
      });

      // Restore original theme
      htmlElement.className = originalHtmlClass;
      bodyElement.className = originalBodyClass;
      if (originalTheme) {
        htmlElement.setAttribute('data-theme', originalTheme);
      } else {
        htmlElement.removeAttribute('data-theme');
      }

      console.log('PDF export - Restored original theme');
    }
  } catch (error) {
    console.error('PDF export failed:', error);
    const message = error instanceof Error ? error.message : 'Please try again';
    throw new Error(`Failed to export PDF: ${message}`);
  }
}
