import express from 'express';
import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';
import { validateIntakeData } from '../utils/validation.js';
import { generateAllPdfs } from '../services/pdfService.js';
import { sendCompletionEmail } from '../services/emailService.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/intake/:linkCode
 * Retrieve intake form data by link code (for customer to fill out)
 */
router.get('/:linkCode', async (req, res, next) => {
  try {
    const { linkCode } = req.params;
    
    const intake = await prisma.intake.findUnique({
      where: { linkCode },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            address: true,
            city: true,
            state: true,
            zip: true,
            phone: true,
            logo: true
          }
        }
      }
    });
    
    if (!intake) {
      return res.status(404).json({ error: 'Intake form not found' });
    }
    
    // Check if expired
    if (new Date() > intake.expiresAt) {
      await prisma.intake.update({
        where: { id: intake.id },
        data: { status: 'EXPIRED' }
      });
      return res.status(410).json({ error: 'This form link has expired' });
    }
    
    // Check if already completed
    if (intake.status === 'COMPLETED') {
      return res.status(409).json({ 
        error: 'This form has already been submitted',
        submittedAt: intake.submittedAt
      });
    }
    
    // Log view
    await prisma.auditLog.create({
      data: {
        intakeId: intake.id,
        action: 'viewed',
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });
    
    // Return intake data (excluding sensitive internal fields)
    res.json({
      id: intake.id,
      linkCode: intake.linkCode,
      status: intake.status,
      source: intake.source,
      company: {
        ...intake.company,
        slug: intake.company?.slug,
      },
      defendantData: intake.defendantData,
      indemnitorData: intake.indemnitorData,
      referencesData: intake.referencesData,
      bondData: intake.bondData,
      bondsData: intake.bondsData,
      sharedBondData: intake.sharedBondData,
      expiresAt: intake.expiresAt
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/intake/:linkCode/opened
 * Track when co-signer first opens an agent-initiated request
 */
router.post('/:linkCode/opened', async (req, res, next) => {
  try {
    const { linkCode } = req.params;
    
    const intake = await prisma.intake.findUnique({
      where: { linkCode }
    });
    
    if (!intake) {
      return res.status(404).json({ error: 'Intake form not found' });
    }
    
    // Only update if not already opened
    if (!intake.requestOpenedAt) {
      await prisma.intake.update({
        where: { id: intake.id },
        data: { requestOpenedAt: new Date() }
      });
      
      await prisma.auditLog.create({
        data: {
          intakeId: intake.id,
          action: 'request_opened',
          ipAddress: req.ip,
          userAgent: req.get('user-agent')
        }
      });
    }
    
    res.json({ success: true });
    
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/intake/:linkCode/save
 * Save progress (auto-save as user fills out form)
 */
router.post('/:linkCode/save', async (req, res, next) => {
  try {
    const { linkCode } = req.params;
    const { defendantData, indemnitorData, referencesData, bondData } = req.body;
    
    const intake = await prisma.intake.findUnique({
      where: { linkCode }
    });
    
    if (!intake) {
      return res.status(404).json({ error: 'Intake form not found' });
    }
    
    if (intake.status === 'COMPLETED') {
      return res.status(409).json({ error: 'Form already submitted' });
    }
    
    if (new Date() > intake.expiresAt) {
      return res.status(410).json({ error: 'Form link expired' });
    }
    
    // Update intake with partial data
    const updated = await prisma.intake.update({
      where: { id: intake.id },
      data: {
        status: 'IN_PROGRESS',
        defendantData: defendantData || intake.defendantData,
        indemnitorData: indemnitorData || intake.indemnitorData,
        referencesData: referencesData || intake.referencesData,
        bondData: bondData || intake.bondData
      }
    });
    
    res.json({ 
      success: true, 
      savedAt: updated.updatedAt 
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/intake/:linkCode/submit
 * Final submission with signatures
 */
router.post('/:linkCode/submit', async (req, res, next) => {
  try {
    const { linkCode } = req.params;
    const { 
      defendantData, 
      indemnitorData, 
      referencesData, 
      bondData,
      signatures 
    } = req.body;
    
    console.log('=== SUBMISSION DEBUG ===');
    console.log('Signatures received:', Object.keys(signatures || {}));
    
    // Check for required signatures
    const requiredSignatures = [
      'preApplication_coSigner',
      'referenceForm_applicant',
      'immigrationWaiver_coSigner',
      'indemnitorApplication_indemnitor',
      'immigrationBondAgreement_indemnitor'
    ];
    const missingSignatures = requiredSignatures.filter(key => {
      const value = signatures?.[key];
      return !value || typeof value !== 'string' || !value.startsWith('data:image');
    });
    if (missingSignatures.length > 0) {
      console.log('Missing signatures:', missingSignatures);
    } else {
      console.log('All required signatures present');
    }
    
    // Validate all required data
    const validation = validateIntakeData({
      defendantData,
      indemnitorData,
      referencesData,
      signatures
    });
    
    if (!validation.success) {
      console.log('Validation errors:', JSON.stringify(validation.errors, null, 2));
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validation.errors 
      });
    }
    
    const intake = await prisma.intake.findUnique({
      where: { linkCode },
      include: { company: true }
    });
    
    if (!intake) {
      return res.status(404).json({ error: 'Intake form not found' });
    }
    
    if (intake.status === 'COMPLETED') {
      return res.status(409).json({ error: 'Form already submitted' });
    }
    
    if (new Date() > intake.expiresAt) {
      return res.status(410).json({ error: 'Form link expired' });
    }
    
    // Generate PDFs - wrap in try/catch so submission succeeds even if PDF fails
    let generatedPdfs = {};
    try {
      console.log('Generating PDFs for intake:', intake.id);
      generatedPdfs = await generateAllPdfs({
        company: intake.company,
        defendantData,
        indemnitorData,
        referencesData,
        bondData,
        signatures
      });
      console.log('PDFs generated successfully:', Object.keys(generatedPdfs));
    } catch (pdfError) {
      console.error('PDF generation failed (non-blocking):', pdfError);
      // Continue with submission even if PDF generation fails
      generatedPdfs = { error: pdfError.message };
    }
    
    // Update intake as completed
    const completed = await prisma.intake.update({
      where: { id: intake.id },
      data: {
        status: 'COMPLETED',
        defendantData,
        indemnitorData,
        referencesData,
        bondData,
        signatures,
        generatedPdfs,
        submittedAt: new Date(),
        submitterIp: req.ip,
        submitterUserAgent: req.get('user-agent')
      }
    });
    
    // Log submission
    await prisma.auditLog.create({
      data: {
        intakeId: intake.id,
        action: 'submitted',
        details: { pdfCount: Object.keys(generatedPdfs).length },
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });
    
    // Send email to agent
    const agentEmail = intake.company.email;
    if (agentEmail) {
      try {
        await sendCompletionEmail({
          to: agentEmail,
          company: intake.company,
          defendantName: `${defendantData.firstName} ${defendantData.lastName}`,
          indemnitorName: `${indemnitorData.firstName} ${indemnitorData.lastName}`,
          pdfs: generatedPdfs
        });
        
        await prisma.intake.update({
          where: { id: intake.id },
          data: {
            emailSentAt: new Date(),
            emailSentTo: agentEmail
          }
        });
        
        await prisma.auditLog.create({
          data: {
            intakeId: intake.id,
            action: 'email_sent',
            details: { to: agentEmail }
          }
        });
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
        // Don't fail the submission if email fails
      }
    }
    
    res.json({
      success: true,
      submittedAt: completed.submittedAt,
      pdfKeys: Object.keys(generatedPdfs),
      message: 'Your forms have been submitted successfully. The bail bond agent will contact you shortly.'
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/intake/:linkCode/pdfs
 * Retrieve generated PDFs for a completed submission
 */
router.get('/:linkCode/pdfs', async (req, res, next) => {
  try {
    const { linkCode } = req.params;
    console.log('Fetching PDFs for linkCode:', linkCode);
    
    const intake = await prisma.intake.findUnique({
      where: { linkCode },
      select: {
        status: true,
        generatedPdfs: true,
        defendantData: true,
        company: {
          select: { name: true }
        }
      }
    });
    
    console.log('Intake found:', !!intake, 'Status:', intake?.status);
    console.log('generatedPdfs type:', typeof intake?.generatedPdfs);
    console.log('generatedPdfs keys:', intake?.generatedPdfs ? Object.keys(intake.generatedPdfs) : 'null');
    
    if (!intake) {
      return res.status(404).json({ error: 'Intake form not found' });
    }
    
    if (intake.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Form not yet submitted' });
    }
    
    // Return PDF metadata and data
    const pdfs = intake.generatedPdfs || {};
    
    // Check if there was an error during PDF generation
    if (pdfs.error) {
      return res.json({
        defendantName: `${intake.defendantData?.firstName || ''} ${intake.defendantData?.lastName || ''}`.trim(),
        companyName: intake.company?.name,
        pdfs: [],
        error: 'PDF generation failed. Please contact the bail bond agent for your documents.'
      });
    }
    
    const pdfList = Object.entries(pdfs)
      .filter(([key]) => key !== 'error') // Filter out error key if present
      .map(([key, base64]) => ({
      key,
      name: getPdfDisplayName(key),
      size: Math.round((base64.length * 3) / 4 / 1024), // Approximate KB
      data: base64
    }));
    
    console.log('Returning', pdfList.length, 'PDFs');
    
    res.json({
      defendantName: `${intake.defendantData?.firstName || ''} ${intake.defendantData?.lastName || ''}`.trim(),
      companyName: intake.company?.name,
      pdfs: pdfList
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/intake/:linkCode/pdf/:pdfKey
 * Download a specific PDF
 */
router.get('/:linkCode/pdf/:pdfKey', async (req, res, next) => {
  try {
    const { linkCode, pdfKey } = req.params;
    
    const intake = await prisma.intake.findUnique({
      where: { linkCode },
      select: {
        status: true,
        generatedPdfs: true,
        defendantData: true
      }
    });
    
    if (!intake) {
      return res.status(404).json({ error: 'Intake form not found' });
    }
    
    if (intake.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Form not yet submitted' });
    }
    
    const pdfs = intake.generatedPdfs || {};
    const pdfBase64 = pdfs[pdfKey];
    
    if (!pdfBase64) {
      return res.status(404).json({ error: 'PDF not found' });
    }
    
    // Convert base64 to buffer
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');
    const defendantName = `${intake.defendantData?.lastName || 'Unknown'}`;
    const filename = `${defendantName}_${getPdfDisplayName(pdfKey).replace(/\s+/g, '_')}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
    
  } catch (error) {
    next(error);
  }
});

/**
 * Helper to get display name for PDF key
 */
function getPdfDisplayName(key) {
  const names = {
    preApplication: 'Pre-Application',
    indemnitorApp: 'Indemnitor Application',
    bondAgreement: 'Immigration Bond Agreement',
    immigrationWaiver: 'Immigration Waiver',
    referenceForm: 'Reference Form'
  };
  return names[key] || key;
}

/**
 * POST /api/intake/create
 * Create a new intake link (called by agent - future auth required)
 */
router.post('/create', async (req, res, next) => {
  try {
    const { companyId, agentId, expiresInDays = 7 } = req.body;
    
    if (!companyId) {
      return res.status(400).json({ error: 'companyId is required' });
    }
    
    // Verify company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    // Generate unique link code
    const linkCode = nanoid(8); // e.g., "x7k9m2Pq"
    
    // Calculate expiration
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    
    // Create intake record
    const intake = await prisma.intake.create({
      data: {
        linkCode,
        companyId,
        agentId,
        expiresAt
      }
    });
    
    // Log creation
    await prisma.auditLog.create({
      data: {
        intakeId: intake.id,
        action: 'created',
        details: { expiresAt, createdBy: agentId }
      }
    });
    
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const formUrl = `${baseUrl}/i/${linkCode}`;
    
    res.status(201).json({
      id: intake.id,
      linkCode,
      formUrl,
      expiresAt
    });
    
  } catch (error) {
    next(error);
  }
});

export default router;
