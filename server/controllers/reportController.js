const PDFDocument = require('pdfkit');
const Store = require('../models/Store');
const User = require('../models/User');
const Product = require('../models/Product');
const Complaint = require('../models/Complaint');
const LoginEvent = require('../models/LoginEvent');

// Helper to draw a modern header on PDF pages
const drawHeader = (doc, title, subtitle) => {
  doc.rect(0, 0, doc.page.width, 70).fill('#0F172A'); // Slate 900
  doc.fillColor('#FFFFFF').fontSize(18).font('Helvetica-Bold').text('STOREFLOW ENTERPRISE', 40, 20);
  doc.fontSize(10).font('Helvetica').fillColor('#94A3B8').text(title.toUpperCase(), 40, 42);
  doc.fillColor('#10B981').fontSize(9).font('Helvetica-Bold').text('PLATFORM REPORT', doc.page.width - 150, 25, { width: 110, align: 'right' });
  doc.fillColor('#64748B').fontSize(8).font('Helvetica').text(new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }), doc.page.width - 150, 40, { width: 110, align: 'right' });
  
  doc.y = 90;
  doc.fillColor('#0F172A');
  if (subtitle) {
    doc.fontSize(14).font('Helvetica-Bold').text(subtitle);
    doc.moveDown(0.4);
  }
};

// Helper to draw page footer
const drawFooter = (doc) => {
  const bottom = doc.page.height - 35;
  doc.strokeColor('#E2E8F0').lineWidth(0.5).moveTo(40, bottom - 5).lineTo(doc.page.width - 40, bottom - 5).stroke();
  doc.fontSize(8).font('Helvetica').fillColor('#94A3B8').text('StoreFlow Retail Platform | Confidential Executive Document', 40, bottom);
  doc.text(`Generated: ${new Date().toLocaleString()}`, doc.page.width - 240, bottom, { width: 200, align: 'right' });
};

// @desc    Download Platform Summary PDF Report
// @route   GET /api/admin/reports/platform-summary.pdf
// @access  Platform Admin Only
const getPlatformSummaryReport = async (req, res) => {
  try {
    const [stores, users, productsCount, complaints] = await Promise.all([
      Store.find().sort({ createdAt: -1 }).populate('ownerUser', 'name email phone'),
      User.find().select('-password'),
      Product.countDocuments(),
      Complaint.find(),
    ]);

    const activeStores = stores.filter((s) => s.status === 'ACTIVE').length;
    const pendingStores = stores.filter((s) => s.status === 'PENDING').length;
    const suspendedStores = stores.filter((s) => s.status === 'SUSPENDED').length;
    const rejectedStores = stores.filter((s) => s.status === 'REJECTED').length;

    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="storeflow-platform-summary.pdf"');
    doc.pipe(res);

    drawHeader(doc, 'Platform Executive Summary', 'StoreFlow Multi-Supermarket Ecosystem Overview');

    // Key Performance Indicators (Cards)
    const cardY = 125;
    const cardWidth = 120;
    const cardHeight = 55;
    const gap = 12;

    const cards = [
      { label: 'Total Supermarkets', value: stores.length.toString(), color: '#3B82F6' },
      { label: 'Active Supermarkets', value: activeStores.toString(), color: '#10B981' },
      { label: 'Pending Approvals', value: pendingStores.toString(), color: '#F59E0B' },
      { label: 'Total Staff Users', value: users.length.toString(), color: '#8B5CF6' },
    ];

    cards.forEach((c, idx) => {
      const x = 40 + idx * (cardWidth + gap);
      doc.rect(x, cardY, cardWidth, cardHeight).fill('#F8FAFC').stroke('#E2E8F0');
      doc.fillColor(c.color).fontSize(18).font('Helvetica-Bold').text(c.value, x + 10, cardY + 10);
      doc.fillColor('#64748B').fontSize(8).font('Helvetica').text(c.label, x + 10, cardY + 35);
    });

    doc.y = 200;

    // Breakdown Section
    doc.fillColor('#0F172A').fontSize(12).font('Helvetica-Bold').text('System Breakdown');
    doc.strokeColor('#CBD5E1').lineWidth(0.5).moveTo(40, doc.y + 4).lineTo(doc.page.width - 40, doc.y + 4).stroke();
    doc.moveDown(0.8);

    doc.fontSize(9).font('Helvetica').fillColor('#334155');
    doc.text(`- Supermarkets Status: ${activeStores} Active | ${pendingStores} Pending Review | ${suspendedStores} Suspended | ${rejectedStores} Rejected`);
    doc.text(`- Product Catalog Volume: ${productsCount} individual items cataloged across supermarkets`);
    doc.text(`- Support Desk: ${complaints.length} tickets total (${complaints.filter((c) => c.status === 'OPEN').length} Open, ${complaints.filter((c) => c.status === 'IN_PROGRESS').length} In Progress, ${complaints.filter((c) => c.status === 'RESOLVED').length} Resolved)`);
    doc.moveDown(1.5);

    // Supermarkets Directory Table
    doc.fillColor('#0F172A').fontSize(12).font('Helvetica-Bold').text('Supermarket Directory & Status');
    doc.strokeColor('#CBD5E1').lineWidth(0.5).moveTo(40, doc.y + 4).lineTo(doc.page.width - 40, doc.y + 4).stroke();
    doc.moveDown(0.8);

    // Table Header
    const tableTop = doc.y;
    doc.rect(40, tableTop, doc.page.width - 80, 20).fill('#0F172A');
    doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
    doc.text('CODE', 45, tableTop + 6);
    doc.text('STORE NAME', 115, tableTop + 6);
    doc.text('CITY', 255, tableTop + 6);
    doc.text('OWNER', 345, tableTop + 6);
    doc.text('STATUS', 445, tableTop + 6);
    doc.text('REQUESTED', 505, tableTop + 6);

    let rowY = tableTop + 20;
    doc.font('Helvetica').fontSize(8);

    if (stores.length === 0) {
      rowY += 10;
      doc.fillColor('#64748B').text('No registered supermarkets found in database.', 45, rowY);
    } else {
      stores.slice(0, 15).forEach((st, i) => {
        const bg = i % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
        doc.rect(40, rowY, doc.page.width - 80, 18).fill(bg);
        doc.fillColor('#334155');
        doc.text(st.storeCode || '-', 45, rowY + 5);
        doc.font('Helvetica-Bold').text(st.name.slice(0, 26), 115, rowY + 5).font('Helvetica');
        doc.text(st.city || '-', 255, rowY + 5);
        doc.text((st.ownerUser?.name || '-').slice(0, 18), 345, rowY + 5);

        // Status pill text
        if (st.status === 'ACTIVE') doc.fillColor('#059669');
        else if (st.status === 'PENDING') doc.fillColor('#D97706');
        else if (st.status === 'SUSPENDED') doc.fillColor('#DC2626');
        else doc.fillColor('#6B7280');

        doc.text(st.status, 445, rowY + 5);
        doc.fillColor('#64748B');
        doc.text(st.createdAt ? new Date(st.createdAt).toLocaleDateString('en-GB') : '-', 505, rowY + 5);

        rowY += 18;
      });
    }

    drawFooter(doc);
    doc.end();
  } catch (error) {
    console.error('getPlatformSummaryReport error:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to generate PDF report' });
    }
  }
};

// @desc    Download Supermarkets Registry PDF Report
// @route   GET /api/admin/reports/supermarkets.pdf
// @access  Platform Admin Only
const getSupermarketsReport = async (req, res) => {
  try {
    const stores = await Store.find()
      .sort({ createdAt: -1 })
      .populate('ownerUser', 'name email phone');

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="storeflow-supermarkets.pdf"');
    doc.pipe(res);

    drawHeader(doc, 'Supermarkets Registry', 'Registered Supermarket Applications & Tenants');

    const tableTop = 130;
    doc.rect(40, tableTop, doc.page.width - 80, 20).fill('#0F172A');
    doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
    doc.text('CODE', 45, tableTop + 6);
    doc.text('NAME', 115, tableTop + 6);
    doc.text('PHONE', 240, tableTop + 6);
    doc.text('CITY', 320, tableTop + 6);
    doc.text('STATUS', 400, tableTop + 6);
    doc.text('OWNER EMAIL', 460, tableTop + 6);

    let rowY = tableTop + 20;
    doc.font('Helvetica').fontSize(8);

    if (stores.length === 0) {
      rowY += 10;
      doc.fillColor('#64748B').text('No registered supermarkets in the platform.', 45, rowY);
    } else {
      stores.forEach((st, i) => {
        if (rowY > doc.page.height - 60) {
          drawFooter(doc);
          doc.addPage();
          drawHeader(doc, 'Supermarkets Registry', 'Registered Supermarket Applications & Tenants (Continued)');
          rowY = 110;
        }

        const bg = i % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
        doc.rect(40, rowY, doc.page.width - 80, 18).fill(bg);
        doc.fillColor('#334155');
        doc.text(st.storeCode || '-', 45, rowY + 5);
        doc.font('Helvetica-Bold').text(st.name.slice(0, 24), 115, rowY + 5).font('Helvetica');
        doc.text(st.phone || '-', 240, rowY + 5);
        doc.text(st.city || '-', 320, rowY + 5);

        if (st.status === 'ACTIVE') doc.fillColor('#059669');
        else if (st.status === 'PENDING') doc.fillColor('#D97706');
        else if (st.status === 'SUSPENDED') doc.fillColor('#DC2626');
        else doc.fillColor('#6B7280');

        doc.text(st.status, 400, rowY + 5);
        doc.fillColor('#64748B');
        doc.text((st.ownerUser?.email || '-').slice(0, 22), 460, rowY + 5);

        rowY += 18;
      });
    }

    drawFooter(doc);
    doc.end();
  } catch (error) {
    console.error('getSupermarketsReport error:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to generate Supermarkets PDF report' });
    }
  }
};

// @desc    Download Staff & Access Audit PDF Report
// @route   GET /api/admin/reports/staff-access.pdf
// @access  Platform Admin Only
const getStaffAccessReport = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .populate('store', 'name storeCode');

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="storeflow-staff-access.pdf"');
    doc.pipe(res);

    drawHeader(doc, 'Staff & Access Security Audit', 'Platform-Wide User Roster & Account Access');

    const tableTop = 130;
    doc.rect(40, tableTop, doc.page.width - 80, 20).fill('#0F172A');
    doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
    doc.text('USER NAME', 45, tableTop + 6);
    doc.text('EMAIL', 160, tableTop + 6);
    doc.text('ROLE', 290, tableTop + 6);
    doc.text('SUPERMARKET', 370, tableTop + 6);
    doc.text('STATUS', 475, tableTop + 6);

    let rowY = tableTop + 20;
    doc.font('Helvetica').fontSize(8);

    if (users.length === 0) {
      rowY += 10;
      doc.fillColor('#64748B').text('No users found.', 45, rowY);
    } else {
      users.forEach((u, i) => {
        if (rowY > doc.page.height - 60) {
          drawFooter(doc);
          doc.addPage();
          drawHeader(doc, 'Staff & Access Security Audit', 'Platform-Wide User Roster (Continued)');
          rowY = 110;
        }

        const bg = i % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
        doc.rect(40, rowY, doc.page.width - 80, 18).fill(bg);
        doc.fillColor('#334155');
        doc.font('Helvetica-Bold').text(u.name.slice(0, 20), 45, rowY + 5).font('Helvetica');
        doc.text(u.email.slice(0, 24), 160, rowY + 5);
        doc.text(u.role, 290, rowY + 5);
        doc.text(u.store?.name ? u.store.name.slice(0, 18) : 'GLOBAL PLATFORM', 370, rowY + 5);

        if (u.isActive) doc.fillColor('#059669').text('ACTIVE', 475, rowY + 5);
        else doc.fillColor('#DC2626').text('DISABLED', 475, rowY + 5);

        rowY += 18;
      });
    }

    drawFooter(doc);
    doc.end();
  } catch (error) {
    console.error('getStaffAccessReport error:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to generate Staff Access PDF report' });
    }
  }
};

// @desc    Download Complaints & Support Tickets PDF Report
// @route   GET /api/admin/reports/complaints.pdf
// @access  Platform Admin Only
const getComplaintsReport = async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .sort({ createdAt: -1 })
      .populate('store', 'name storeCode')
      .populate('raisedBy', 'name email');

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="storeflow-complaints.pdf"');
    doc.pipe(res);

    drawHeader(doc, 'Complaints & Support Tickets', 'Store Support Requests & Resolution Log');

    const tableTop = 130;
    doc.rect(40, tableTop, doc.page.width - 80, 20).fill('#0F172A');
    doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
    doc.text('TICKET', 45, tableTop + 6);
    doc.text('SUPERMARKET', 105, tableTop + 6);
    doc.text('SUBJECT', 215, tableTop + 6);
    doc.text('PRIORITY', 345, tableTop + 6);
    doc.text('STATUS', 415, tableTop + 6);
    doc.text('DATE', 485, tableTop + 6);

    let rowY = tableTop + 20;
    doc.font('Helvetica').fontSize(8);

    if (complaints.length === 0) {
      rowY += 10;
      doc.fillColor('#64748B').text('No support tickets or complaints found.', 45, rowY);
    } else {
      complaints.forEach((c, i) => {
        if (rowY > doc.page.height - 60) {
          drawFooter(doc);
          doc.addPage();
          drawHeader(doc, 'Complaints & Support Tickets', 'Support Requests (Continued)');
          rowY = 110;
        }

        const bg = i % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
        doc.rect(40, rowY, doc.page.width - 80, 18).fill(bg);
        doc.fillColor('#334155');
        doc.font('Helvetica-Bold').text(`#${c.ticketNo}`, 45, rowY + 5).font('Helvetica');
        doc.text((c.store?.name || 'General').slice(0, 18), 105, rowY + 5);
        doc.text(c.subject.slice(0, 24), 215, rowY + 5);
        doc.text(c.priority, 345, rowY + 5);

        if (c.status === 'RESOLVED') doc.fillColor('#059669');
        else if (c.status === 'IN_PROGRESS') doc.fillColor('#2563EB');
        else if (c.status === 'OPEN') doc.fillColor('#D97706');
        else doc.fillColor('#6B7280');

        doc.text(c.status, 415, rowY + 5);
        doc.fillColor('#64748B');
        doc.text(new Date(c.createdAt).toLocaleDateString('en-GB'), 485, rowY + 5);

        rowY += 18;
      });
    }

    drawFooter(doc);
    doc.end();
  } catch (error) {
    console.error('getComplaintsReport error:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to generate Complaints PDF report' });
    }
  }
};

// @desc    Download Detailed Single Supermarket Executive Profile PDF
// @route   GET /api/admin/reports/stores/:id.pdf
// @access  Platform Admin Only
const getSingleStoreReport = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id)
      .populate('ownerUser', 'name email phone lastLoginAt createdAt')
      .populate('reviewedBy', 'name email');

    if (!store) {
      return res.status(404).json({ success: false, message: 'Supermarket not found' });
    }

    const [staff, productCount, complaints] = await Promise.all([
      User.find({ store: store._id }).select('name email role isActive lastLoginAt'),
      Product.countDocuments({ store: store._id }),
      Complaint.find({ store: store._id }).sort({ createdAt: -1 }),
    ]);

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="storeflow-profile-${store.storeCode}.pdf"`);
    doc.pipe(res);

    drawHeader(doc, `Store Profile: ${store.storeCode}`, store.name);

    // Profile Details Card
    doc.rect(40, 125, doc.page.width - 80, 110).fill('#F8FAFC').stroke('#E2E8F0');
    doc.fillColor('#0F172A').fontSize(11).font('Helvetica-Bold').text('Operational & Legal Details', 55, 135);
    doc.fontSize(9).font('Helvetica').fillColor('#475569');

    doc.text(`Store Code: ${store.storeCode}`, 55, 155);
    doc.text(`Status: ${store.status} (${store.statusReason || 'Standard'})`, 55, 170);
    doc.text(`Business Type: ${store.businessType || 'Supermarket'}`, 55, 185);
    doc.text(`Location: ${store.address || '-'}, ${store.city || '-'}`, 55, 200);

    doc.text(`Owner: ${store.ownerUser?.name || '-'} (${store.ownerUser?.email || '-'})`, 280, 155);
    doc.text(`Phone: ${store.phone || '-'}`, 280, 170);
    doc.text(`GSTIN / Tax ID: ${store.gstin || 'Not registered'}`, 280, 185);
    doc.text(`Registered: ${store.createdAt ? new Date(store.createdAt).toLocaleDateString('en-GB') : '-'}`, 280, 200);

    // Stats
    doc.y = 250;
    doc.fillColor('#0F172A').fontSize(11).font('Helvetica-Bold').text(`Staff Roster (${staff.length} employees)`);
    doc.strokeColor('#CBD5E1').lineWidth(0.5).moveTo(40, doc.y + 4).lineTo(doc.page.width - 40, doc.y + 4).stroke();
    doc.moveDown(0.8);

    const staffTableTop = doc.y;
    doc.rect(40, staffTableTop, doc.page.width - 80, 18).fill('#0F172A');
    doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
    doc.text('NAME', 50, staffTableTop + 5);
    doc.text('EMAIL', 180, staffTableTop + 5);
    doc.text('ROLE', 330, staffTableTop + 5);
    doc.text('STATUS', 440, staffTableTop + 5);

    let sY = staffTableTop + 18;
    doc.font('Helvetica').fontSize(8);
    staff.forEach((st, i) => {
      const bg = i % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
      doc.rect(40, sY, doc.page.width - 80, 16).fill(bg);
      doc.fillColor('#334155');
      doc.text(st.name, 50, sY + 4);
      doc.text(st.email, 180, sY + 4);
      doc.text(st.role, 330, sY + 4);
      doc.fillColor(st.isActive ? '#059669' : '#DC2626').text(st.isActive ? 'Active' : 'Disabled', 440, sY + 4);
      sY += 16;
    });

    drawFooter(doc);
    doc.end();
  } catch (error) {
    console.error('getSingleStoreReport error:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to generate Store Profile PDF' });
    }
  }
};

module.exports = {
  getPlatformSummaryReport,
  getSupermarketsReport,
  getStaffAccessReport,
  getComplaintsReport,
  getSingleStoreReport,
};
