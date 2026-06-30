import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

export function exportToCsv(data: any[], filename: string, customHeaders?: string[]) {
  try {
    if (!data || !data.length) {
      toast.error('No data to export');
      return;
    }

    const headers = customHeaders || Object.keys(data[0]);
    
    const csvRows = [];
    csvRows.push(headers.join(',')); // Add headers

    for (const row of data) {
      const values = headers.map(header => {
        let val = row[header] === null || row[header] === undefined ? '' : String(row[header]);
        // Escape quotes and wrap in quotes if contains comma
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          val = `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      });
      csvRows.push(values.join(','));
    }

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('CSV exported successfully');
  } catch (error) {
    console.error('CSV Export Error:', error);
    toast.error('Failed to export CSV');
  }
}

export function exportTableToPdf(data: any[][], headers: string[], filename: string, title: string) {
  try {
    if (!data || !data.length) {
      toast.error('No data to export');
      return;
    }

    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    
    // Add date
    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

    // Create table
    autoTable(doc, {
      head: [headers],
      body: data,
      startY: 35,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    });

    doc.save(`${filename}.pdf`);
    toast.success('PDF exported successfully');
  } catch (error) {
    console.error('PDF Export Error:', error);
    toast.error('Failed to export PDF');
  }
}

export function exportAiReportToPdf(reportText: string, title: string, filename: string) {
  try {
    if (!reportText) {
      toast.error('No report text to export');
      return;
    }

    const doc = new jsPDF();
    const margin = 14;
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin, 20);
    
    // Date
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, 28);
    
    // Line separator
    doc.setDrawColor(200);
    doc.line(margin, 32, pageWidth - margin, 32);
    
    // Body text
    doc.setFontSize(12);
    doc.setTextColor(0);
    
    // Split text into lines that fit the page width
    const textLines = doc.splitTextToSize(reportText, pageWidth - (margin * 2));
    
    let yPos = 40;
    const pageHeight = doc.internal.pageSize.getHeight();
    
    for (let i = 0; i < textLines.length; i++) {
      if (yPos > pageHeight - 20) {
        doc.addPage();
        yPos = 20; // reset Y for new page
      }
      doc.text(textLines[i], margin, yPos);
      yPos += 7; // line height
    }

    doc.save(`${filename}.pdf`);
    toast.success('AI Report PDF exported successfully');
  } catch (error) {
    console.error('AI Report PDF Export Error:', error);
    toast.error('Failed to export AI Report');
  }
}
