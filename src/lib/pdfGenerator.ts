import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export async function generateDashboardPDF(
  filename: string,
  onProgress?: (status: string) => void
): Promise<void> {
  try {
    onProgress?.('Initializing PDF generator...');

    const cleanFilename = filename.toLowerCase().replace('.csv', '').replace(/[^a-z0-9]/g, '_');
    const pdfName = `${cleanFilename}_dashboard.pdf`;

    // Retrieve the page elements
    const page1 = document.getElementById('pdf-page-1');
    const page2 = document.getElementById('pdf-page-2');
    const page3 = document.getElementById('pdf-page-3');

    if (!page1 || !page2) {
      throw new Error('PDF template elements not found in the DOM.');
    }

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4', // A4 Landscape: 297mm x 210mm
    });

    const canvasOptions = {
      scale: 1.5, // Optimized 1.5x resolution scaling for high-speed conversion
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    };

    // Render Page 1
    onProgress?.('Rendering Page 1 (KPIs & Primary Charts)...');
    const canvas1 = await html2canvas(page1, canvasOptions);
    const imgData1 = canvas1.toDataURL('image/jpeg', 0.95);
    pdf.addImage(imgData1, 'JPEG', 0, 0, 297, 210);

    // Render Page 2
    onProgress?.('Rendering Page 2 (Secondary Charts)...');
    const canvas2 = await html2canvas(page2, canvasOptions);
    const imgData2 = canvas2.toDataURL('image/jpeg', 0.95);
    pdf.addPage();
    pdf.addImage(imgData2, 'JPEG', 0, 0, 297, 210);

    // Render Page 3 (if exists)
    if (page3) {
      onProgress?.('Rendering Page 3 (Summary & Matrix)...');
      const canvas3 = await html2canvas(page3, canvasOptions);
      const imgData3 = canvas3.toDataURL('image/jpeg', 0.95);
      pdf.addPage();
      pdf.addImage(imgData3, 'JPEG', 0, 0, 297, 210);
    }

    onProgress?.('Saving PDF report...');
    pdf.save(pdfName);
    onProgress?.('Complete');
  } catch (error: any) {
    console.error('PDF Generation Failed:', error);
    throw new Error(`Failed to generate PDF: ${error.message || error}`);
  }
}
