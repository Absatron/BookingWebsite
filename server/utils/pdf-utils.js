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

      // Define layout constants
      const leftMargin = 50;
      const rightMargin = 50;
      const pageWidth = 595; // Full A4 width
      const contentWidth = pageWidth - leftMargin - rightMargin; // Available content width

      // Professional Header with Brand Bar
      doc.fillColor('#1a365d')
         .rect(0, 0, pageWidth, 60)
         .fill();

      doc.fontSize(28)
         .font('Helvetica-Bold')
         .fillColor('#ffffff')
         .text('KALU CUTS', leftMargin, 20);

      doc.fontSize(12)
         .font('Helvetica')
         .fillColor('#ffffff')
         .text('Professional Barbering Services', leftMargin, 45);

      // Receipt title and reference in header area
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .fillColor('#ffffff')
         .text('RECEIPT', leftMargin + contentWidth - 80, 20, { align: 'right', width: 80 });

      doc.fontSize(12)
         .font('Helvetica')
         .fillColor('#ffffff')
         .text(`#${bookingReference}`, leftMargin + contentWidth - 160, 40, { align: 'right', width: 160 });

      doc.y = 90; // Position after header

      // Receipt Information Box
      const receiptBoxY = doc.y;
      doc.fillColor('#f8f9fa')
         .rect(leftMargin, receiptBoxY, contentWidth, 60)
         .fill();

      doc.strokeColor('#e9ecef')
         .lineWidth(1)
         .rect(leftMargin, receiptBoxY, contentWidth, 60)
         .stroke();

      // Receipt info content
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .fillColor('#495057')
         .text('Receipt Information', leftMargin + 20, receiptBoxY + 15);

      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#6c757d')
         .text(`Issue Date: ${currentDate}`, leftMargin + 20, receiptBoxY + 35)
         .text(`Receipt #: ${bookingReference}`, leftMargin + 280, receiptBoxY + 35);

      doc.y = receiptBoxY + 80;

      // Booking Details Section
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .fillColor('#1a365d')
         .text('Booking Details', leftMargin);

      doc.moveDown(0.8);

      // Booking details box
      const bookingBoxY = doc.y;
      doc.fillColor('#ffffff')
         .rect(leftMargin, bookingBoxY, contentWidth, 100)
         .fill();

      doc.strokeColor('#dee2e6')
         .lineWidth(1)
         .rect(leftMargin, bookingBoxY, contentWidth, 100)
         .stroke();

      // Booking content with improved layout
      const contentX = leftMargin + 25;
      const labelWidth = 120;
      const valueX = contentX + labelWidth;

      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor('#495057');

      // Appointment Date
      doc.text('Appointment Date:', contentX, bookingBoxY + 20);
      doc.font('Helvetica')
         .fillColor('#212529')
         .text(bookingDate, valueX, bookingBoxY + 20);

      // Appointment Time
      doc.font('Helvetica-Bold')
         .fillColor('#495057')
         .text('Appointment Time:', contentX, bookingBoxY + 40);
      doc.font('Helvetica')
         .fillColor('#212529')
         .text(`${booking.startTime} - ${booking.endTime}`, valueX, bookingBoxY + 40);

      // Service details if available
      if (booking.service) {
        doc.font('Helvetica-Bold')
           .fillColor('#495057')
           .text('Service:', contentX, bookingBoxY + 60);
        doc.font('Helvetica')
           .fillColor('#212529')
           .text(booking.service, valueX, bookingBoxY + 60);
      }

      doc.y = bookingBoxY + 120;

      // Payment Summary Section
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .fillColor('#1a365d')
         .text('Payment Summary', leftMargin);

      doc.moveDown(0.8);

      // Payment box with highlight
      const paymentBoxY = doc.y;
      doc.fillColor('#e8f5e8')
         .rect(leftMargin, paymentBoxY, contentWidth, 60)
         .fill();

      doc.strokeColor('#28a745')
         .lineWidth(2)
         .rect(leftMargin, paymentBoxY, contentWidth, 60)
         .stroke();

      // Payment content
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .fillColor('#155724')
         .text('Total Paid:', leftMargin + 25, paymentBoxY + 15);

      doc.fontSize(20)
         .font('Helvetica-Bold')
         .fillColor('#155724')
         .text(`$${booking.price.toFixed(2)}`, leftMargin + 25, paymentBoxY + 35);

      doc.fontSize(11)
         .font('Helvetica')
         .fillColor('#155724')
         .text('✓ Payment Confirmed', leftMargin + contentWidth - 140, paymentBoxY + 25, { align: 'right', width: 120 });

      doc.y = paymentBoxY + 80;

      // Professional Footer
      doc.moveDown(2);
      
      // Footer separator
      doc.strokeColor('#dee2e6')
         .lineWidth(1)
         .moveTo(leftMargin, doc.y)
         .lineTo(leftMargin + contentWidth, doc.y)
         .stroke();

      doc.moveDown(1);

      // Finalize the PDF
      doc.end();

    } catch (error) {
      console.error('Error generating PDF:', error);
      reject(new Error('Failed to generate receipt PDF'));
    }
  });
};
