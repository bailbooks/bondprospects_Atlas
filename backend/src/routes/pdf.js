import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/pdf/:linkCode/:formType
 * Download a specific generated PDF
 * formTypes: preApplication, indemnitorApp, bondAgreement, immigrationWaiver, referenceForm
 */
router.get('/:linkCode/:formType', async (req, res, next) => {
  try {
    const { linkCode, formType } = req.params;
    
    const intake = await prisma.intake.findUnique({
      where: { linkCode }
    });
    
    if (!intake) {
      return res.status(404).json({ error: 'Intake not found' });
    }
    
    if (intake.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Form not yet submitted' });
    }
    
    const pdfs = intake.generatedPdfs;
    if (!pdfs || !pdfs[formType]) {
      return res.status(404).json({ error: 'PDF not found' });
    }
    
    // PDFs are stored as base64
    const pdfBase64 = pdfs[formType];
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');
    
    // Generate filename
    const defendantName = intake.defendantData?.lastName || 'Defendant';
    const filename = `${defendantName}_${formType}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(pdfBuffer);
    
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/pdf/:linkCode/all
 * Download all PDFs as a zip (future enhancement)
 * For now, returns list of available PDFs
 */
router.get('/:linkCode/all', async (req, res, next) => {
  try {
    const { linkCode } = req.params;
    
    const intake = await prisma.intake.findUnique({
      where: { linkCode }
    });
    
    if (!intake) {
      return res.status(404).json({ error: 'Intake not found' });
    }
    
    if (intake.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Form not yet submitted' });
    }
    
    const pdfs = intake.generatedPdfs || {};
    const availablePdfs = Object.keys(pdfs).map(formType => ({
      formType,
      downloadUrl: `/api/pdf/${linkCode}/${formType}`
    }));
    
    res.json({
      linkCode,
      submittedAt: intake.submittedAt,
      pdfs: availablePdfs
    });
    
  } catch (error) {
    next(error);
  }
});

export default router;
