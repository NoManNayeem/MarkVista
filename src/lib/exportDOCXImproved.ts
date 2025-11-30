import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType } from 'docx';
import { saveAs } from 'file-saver';
import { sanitizeFileName } from './exportUtils';

export interface DOCXExportOptions {
  fileName: string;
  element: HTMLElement;
}

// Parse HTML content to structured document content
function parseHTMLToDocx(element: HTMLElement): Array<Paragraph | Table> {
  const elements: Array<Paragraph | Table> = [];

  function processNode(node: Node): void {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) {
        elements.push(
          new Paragraph({
            children: [new TextRun(text)],
          })
        );
      }
      return;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tagName = el.tagName.toLowerCase();
      const textContent = el.textContent?.trim() || '';

      switch (tagName) {
        case 'h1':
          elements.push(
            new Paragraph({
              text: textContent,
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 200 },
            })
          );
          break;

        case 'h2':
          elements.push(
            new Paragraph({
              text: textContent,
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 360, after: 180 },
            })
          );
          break;

        case 'h3':
          elements.push(
            new Paragraph({
              text: textContent,
              heading: HeadingLevel.HEADING_3,
              spacing: { before: 320, after: 160 },
            })
          );
          break;

        case 'h4':
          elements.push(
            new Paragraph({
              text: textContent,
              heading: HeadingLevel.HEADING_4,
              spacing: { before: 280, after: 140 },
            })
          );
          break;

        case 'h5':
          elements.push(
            new Paragraph({
              text: textContent,
              heading: HeadingLevel.HEADING_5,
              spacing: { before: 240, after: 120 },
            })
          );
          break;

        case 'h6':
          elements.push(
            new Paragraph({
              text: textContent,
              heading: HeadingLevel.HEADING_6,
              spacing: { before: 200, after: 100 },
            })
          );
          break;

        case 'p':
          if (textContent) {
            elements.push(
              new Paragraph({
                children: [new TextRun(textContent)],
                spacing: { after: 200 },
              })
            );
          }
          break;

        case 'strong':
        case 'b':
          if (textContent) {
            elements.push(
              new Paragraph({
                children: [new TextRun({ text: textContent, bold: true })],
                spacing: { after: 200 },
              })
            );
          }
          break;

        case 'em':
        case 'i':
          if (textContent) {
            elements.push(
              new Paragraph({
                children: [new TextRun({ text: textContent, italics: true })],
                spacing: { after: 200 },
              })
            );
          }
          break;

        case 'code':
          if (textContent) {
            elements.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: textContent,
                    font: 'Courier New',
                    shading: { fill: 'F5F5F5' },
                  }),
                ],
                spacing: { after: 200 },
              })
            );
          }
          break;

        case 'pre':
          if (textContent) {
            elements.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: textContent,
                    font: 'Courier New',
                    size: 20,
                  }),
                ],
                shading: { fill: 'F5F5F5' },
                spacing: { before: 200, after: 200 },
              })
            );
          }
          break;

        case 'blockquote':
          if (textContent) {
            elements.push(
              new Paragraph({
                children: [new TextRun({ text: textContent, italics: true })],
                indent: { left: 720 },
                spacing: { before: 200, after: 200 },
              })
            );
          }
          break;

        case 'ul':
        case 'ol':
          Array.from(el.children).forEach((li) => {
            if (li.tagName.toLowerCase() === 'li') {
              const liText = li.textContent?.trim();
              if (liText) {
                elements.push(
                  new Paragraph({
                    text: liText,
                    bullet: tagName === 'ul' ? { level: 0 } : undefined,
                    numbering: tagName === 'ol' ? { reference: 'default-numbering', level: 0 } : undefined,
                    spacing: { after: 100 },
                  })
                );
              }
            }
          });
          break;

        case 'table':
          try {
            const tableRows: TableRow[] = [];
            const rows = el.querySelectorAll('tr');

            rows.forEach((row) => {
              const cells: TableCell[] = [];
              const cellElements = row.querySelectorAll('td, th');

              cellElements.forEach((cell) => {
                const cellText = cell.textContent?.trim() || '';
                cells.push(
                  new TableCell({
                    children: [new Paragraph(cellText)],
                    width: { size: 100 / cellElements.length, type: WidthType.PERCENTAGE },
                  })
                );
              });

              if (cells.length > 0) {
                tableRows.push(new TableRow({ children: cells }));
              }
            });

            if (tableRows.length > 0) {
              elements.push(
                new Table({
                  rows: tableRows,
                  width: { size: 100, type: WidthType.PERCENTAGE },
                })
              );
            }
          } catch (tableError) {
            console.warn('Failed to parse table:', tableError);
          }
          break;

        case 'br':
          elements.push(new Paragraph({ text: '' }));
          break;

        case 'hr':
          elements.push(
            new Paragraph({
              border: {
                bottom: {
                  color: '000000',
                  space: 1,
                  style: 'single',
                  size: 6,
                },
              },
              spacing: { before: 200, after: 200 },
            })
          );
          break;

        default:
          // Recursively process children for other elements
          Array.from(node.childNodes).forEach(processNode);
          break;
      }
    }
  }

  // Process all child nodes
  Array.from(element.childNodes).forEach(processNode);

  return elements;
}

export async function exportToDOCXImproved({ fileName, element }: DOCXExportOptions): Promise<void> {
  try {
    // Find the actual markdown preview element
    const markdownPreview = element.querySelector('#markdown-preview') as HTMLElement;
    const targetElement = markdownPreview || element;

    // Validate we have content
    if (!targetElement || targetElement.innerHTML.trim().length === 0) {
      throw new Error('No content found to export. Please ensure the preview is fully loaded.');
    }

    console.log('DOCX export - Starting with docx library');

    // Parse HTML to docx elements
    const documentElements = parseHTMLToDocx(targetElement);

    if (documentElements.length === 0) {
      throw new Error('No content could be parsed for export.');
    }

    console.log('DOCX export - Creating document with', documentElements.length, 'elements');

    // Create document
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 720,
                right: 720,
                bottom: 720,
                left: 720,
              },
            },
          },
          children: documentElements,
        },
      ],
    });

    console.log('DOCX export - Generating file...');

    // Generate and save
    const blob = await Packer.toBlob(doc);

    // Sanitize filename while preserving case
    const safeFileName = sanitizeFileName(fileName);
    saveAs(blob, `${safeFileName}.docx`);

    console.log('DOCX export completed successfully - File:', `${safeFileName}.docx`);
  } catch (error) {
    console.error('DOCX export failed:', error);
    const message = error instanceof Error ? error.message : 'Please try again';
    throw new Error(`Failed to export DOCX: ${message}`);
  }
}
