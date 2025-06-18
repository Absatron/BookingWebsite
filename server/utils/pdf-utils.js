import PDFDocument from 'pdfkit';

/**
 * Generate PDF from booking data using PDFKit
 * @param {Object} booking - Booking details
 * @param {string} bookingReference - Booking reference number
 * @returns {Promise<Buffer>} PDF buffer
 */
export const generateReceiptPDF = async (booking, bookingReference) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];

      // Collect PDF data
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Format dates
      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const bookingDate = new Date(booking.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Header
      doc.fontSize(24)
         .font('Helvetica-Bold')
         .fillColor('#1a365d')
         .text('Kalu Cuts', { align: 'center' });

      doc.fontSize(16)
         .font('Helvetica')
         .fillColor('#666666')
         .text('Booking Receipt', { align: 'center' });

      // Add some space
      doc.moveDown(2);

      // Draw a line
      doc.strokeColor('#eeeeee')
         .lineWidth(1)
         .moveTo(50, doc.y)
         .lineTo(550, doc.y)
         .stroke();

      doc.moveDown(1);

      // Receipt info section
      const leftColumn = 80;
      const rightColumn = 300;
      let currentY = doc.y;

      doc.fontSize(12)
         .font('Helvetica')
         .fillColor('#666666')
         .text('Receipt #:', leftColumn, currentY)
         .font('Helvetica-Bold')
         .fillColor('#333333')
         .text(bookingReference, rightColumn, currentY);

      currentY += 20;
      doc.font('Helvetica')
         .fillColor('#666666')
         .text('Issue Date:', leftColumn, currentY)
         .font('Helvetica-Bold')
         .fillColor('#333333')
         .text(currentDate, rightColumn, currentY);

      doc.moveDown(2);

      // Booking Details Section
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .fillColor('#333333')
         .text('Booking Details');

      doc.moveDown(0.5);

      currentY = doc.y;

      // Date
      doc.fontSize(12)
         .font('Helvetica')
         .fillColor('#666666')
         .text('Date:', leftColumn, currentY)
         .font('Helvetica-Bold')
         .fillColor('#333333')
         .text(bookingDate, rightColumn, currentY);

      currentY += 20;

      // Time
      doc.font('Helvetica')
         .fillColor('#666666')
         .text('Time:', leftColumn, currentY)
         .font('Helvetica-Bold')
         .fillColor('#333333')
         .text(`${booking.startTime} - ${booking.endTime}`, rightColumn, currentY);

      doc.moveDown(2);

      // Total section with border
      const totalY = doc.y;
      doc.strokeColor('#333333')
         .lineWidth(2)
         .moveTo(50, totalY)
         .lineTo(550, totalY)
         .stroke();

      doc.moveDown(0.5);

      doc.fontSize(16)
         .font('Helvetica-Bold')
         .fillColor('#333333')
         .text('Total Paid:', leftColumn, doc.y)
         .text(`$${booking.price.toFixed(2)}`, rightColumn, doc.y);

      doc.moveDown(3);

      // Footer
      doc.strokeColor('#eeeeee')
         .lineWidth(1)
         .moveTo(50, doc.y)
         .lineTo(550, doc.y)
         .stroke();

      doc.moveDown(1);

      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor('#333333')
         .text('Thank you for your booking!', { align: 'center' });

      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#666666')
         .text('Keep this receipt for your records.', { align: 'center' });

      // Finalize the PDF
      doc.end();

    } catch (error) {
      console.error('Error generating PDF:', error);
      reject(new Error('Failed to generate receipt PDF'));
    }
  });
};
