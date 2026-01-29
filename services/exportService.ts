
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportToExcel = (data: any[], fileName: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

export const exportToPDF = (headers: string[], data: any[][], title: string, fileName: string) => {
  const doc = new jsPDF();
  doc.text(title, 14, 15);
  autoTable(doc, {
    head: [headers],
    body: data,
    startY: 20,
    styles: { fontSize: 8 },
  });
  doc.save(`${fileName}.pdf`);
};

export const shareReportAsFile = async (type: 'excel' | 'pdf', data: any[], fileName: string, pdfConfig?: { headers: string[], body: any[][], title: string }) => {
  try {
    let blob: Blob;
    let extension: string;
    let mimeType: string;

    if (type === 'excel') {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
      const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      extension = 'xlsx';
      mimeType = blob.type;
    } else {
      const doc = new jsPDF();
      doc.text(pdfConfig?.title || 'Report', 14, 15);
      autoTable(doc, {
        head: [pdfConfig?.headers || []],
        body: pdfConfig?.body || [],
        startY: 20,
        styles: { fontSize: 8 },
      });
      blob = doc.output('blob');
      extension = 'pdf';
      mimeType = blob.type;
    }

    const file = new File([blob], `${fileName}.${extension}`, { type: mimeType });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: 'Inventory Report',
        text: 'Sharing the latest spare parts inventory report.',
      });
    } else {
      // Fallback: If cannot share (e.g., desktop browser), just download
      if (type === 'excel') exportToExcel(data, fileName);
      else exportToPDF(pdfConfig!.headers, pdfConfig!.body, pdfConfig!.title, fileName);
      alert('Sharing not supported on this browser. File has been downloaded instead.');
    }
  } catch (err) {
    console.error('Sharing failed', err);
    alert('Failed to share file. Please try downloading instead.');
  }
};

/**
 * Opens WhatsApp. If phone is provided, targets that specific user.
 */
export const shareToWhatsApp = (message: string, phone?: string) => {
  const cleanPhone = phone?.replace(/[^0-9]/g, '') || '';
  const url = cleanPhone 
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
};

export const printView = () => {
  window.print();
};
