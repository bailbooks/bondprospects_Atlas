/**
 * Agent API Routes
 * Handles agent-initiated e-sign requests from Bailbooks
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';
import { sendESignRequest } from '../services/messagingService.js';

const router = Router();
const prisma = new PrismaClient();

/**
 * Middleware to validate API key and get company
 */
async function validateApiKey(req, res, next) {
  const apiKey = req.query.apiKey || req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }
  
  try {
    const company = await prisma.company.findUnique({
      where: { apiKey },
      include: {
        syncedAgents: { where: { isActive: true }, orderBy: { name: 'asc' } },
        syncedFacilities: { where: { isActive: true }, orderBy: { name: 'asc' } },
        syncedCourts: { where: { isActive: true }, orderBy: { name: 'asc' } },
      }
    });
    
    if (!company) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
    
    if (!company.isActive) {
      return res.status(403).json({ error: 'Company account is inactive' });
    }
    
    // Update last used timestamp
    await prisma.company.update({
      where: { id: company.id },
      data: { apiKeyLastUsedAt: new Date() }
    });
    
    req.company = company;
    next();
    
  } catch (error) {
    console.error('API key validation error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

/**
 * GET /api/agent/init
 * Initialize agent wizard - returns company info and dropdown options
 */
router.get('/init', validateApiKey, async (req, res) => {
  try {
    const { company } = req;
    
    res.json({
      company: {
        id: company.id,
        name: company.name,
        slug: company.slug,
        logo: company.logo,
        primaryColor: company.primaryColor,
      },
      agents: company.syncedAgents.map(a => ({ 
        id: a.id, 
        bailbooksId: a.bailbooksAgentId,
        name: a.name 
      })),
      facilities: company.syncedFacilities.map(f => ({ 
        id: f.id, 
        bailbooksId: f.bailbooksFacilityId,
        name: f.name 
      })),
      courts: company.syncedCourts.map(c => ({ 
        id: c.id, 
        bailbooksId: c.bailbooksCourtId,
        name: c.name 
      })),
    });
    
  } catch (error) {
    console.error('Agent init error:', error);
    res.status(500).json({ error: 'Failed to initialize' });
  }
});

/**
 * POST /api/agent/create-request
 * Create a new e-sign request and send to co-signer
 */
router.post('/create-request', validateApiKey, async (req, res) => {
  try {
    const { company } = req;
    const {
      // Defendant info
      defendant,
      // Co-signer info
      coSigner,
      // Bond info (shared fields)
      bondDate,
      postingFacility,
      agentName,
      agentId, // Bailbooks agent ID (optional)
      // Array of bonds
      bonds,
    } = req.body;
    
    // Force SMS delivery (email not yet configured)
    const deliveryMethod = 'sms';
    
    // Validate required fields
    if (!defendant?.firstName || !defendant?.lastName) {
      return res.status(400).json({ error: 'Defendant name is required' });
    }
    
    if (!coSigner?.firstName || !coSigner?.lastName) {
      return res.status(400).json({ error: 'Co-signer name is required' });
    }
    
    if (!coSigner.cellPhone) {
      return res.status(400).json({ error: 'Co-signer cell phone is required' });
    }
    
    // Validate phone is 10 digits
    const phoneDigits = coSigner.cellPhone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      return res.status(400).json({ error: 'Co-signer cell phone must be 10 digits' });
    }
    
    if (!bonds || bonds.length === 0) {
      return res.status(400).json({ error: 'At least one bond is required' });
    }
    
    // Generate unique link code
    const linkCode = nanoid(8).toUpperCase();
    
    // Create intake record
    const intake = await prisma.intake.create({
      data: {
        linkCode,
        companyId: company.id,
        status: 'PENDING',
        source: 'AGENT',
        
        // Store defendant basic info (agent-provided)
        defendantData: {
          firstName: defendant.firstName,
          lastName: defendant.lastName,
          dob: defendant.dob,
          phone: defendant.phone,
          // These will be filled by co-signer later
          _agentProvided: true,
        },
        
        // Store co-signer basic info (agent-provided)
        indemnitorData: {
          firstName: coSigner.firstName,
          lastName: coSigner.lastName,
          email: coSigner.email,
          cellPhone: coSigner.cellPhone,
          // These will be filled by co-signer later
          _agentProvided: true,
        },
        
        // Store shared bond info
        sharedBondData: {
          bondDate,
          postingFacility,
          agentName,
          agentId,
        },
        
        // Store array of bonds
        bondsData: bonds.map((bond, index) => ({
          bondNumber: index + 1,
          amount: bond.amount,
          premium: bond.premium,
          returnCourt: bond.returnCourt,
          charges: bond.charges,
          caseNumber: bond.caseNumber,
        })),
        
        // Delivery tracking
        deliveryMethod,
        requestSentTo: deliveryMethod === 'email' ? coSigner.email : coSigner.cellPhone,
        
        // Set expiration (30 days from now)
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    
    // Build the intake URL
    const baseUrl = process.env.BASE_URL || 'https://www.bondprospects.com';
    const intakeUrl = `${baseUrl}/${company.slug}/${linkCode}`;
    
    // Send the request via email or SMS
    const coSignerName = `${coSigner.firstName} ${coSigner.lastName}`;
    const defendantName = `${defendant.firstName} ${defendant.lastName}`;
    
    const sendResult = await sendESignRequest({
      deliveryMethod,
      recipientEmail: coSigner.email,
      recipientPhone: coSigner.cellPhone,
      recipientName: coSignerName,
      defendantName,
      companyName: company.name,
      intakeUrl,
    });
    
    // Update intake with send status
    await prisma.intake.update({
      where: { id: intake.id },
      data: {
        requestSentAt: sendResult.success ? new Date() : null,
      },
    });
    
    // Log the action
    await prisma.auditLog.create({
      data: {
        intakeId: intake.id,
        action: 'agent_request_created',
        details: {
          deliveryMethod,
          sendSuccess: sendResult.success,
          sendError: sendResult.error,
          bondCount: bonds.length,
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });
    
    // Log API usage
    await prisma.apiLog.create({
      data: {
        companyId: company.id,
        endpoint: '/api/agent/create-request',
        method: 'POST',
        status: 200,
        ipAddress: req.ip,
      },
    });
    
    res.json({
      success: true,
      intake: {
        id: intake.id,
        linkCode: intake.linkCode,
        url: intakeUrl,
      },
      delivery: {
        method: deliveryMethod,
        sentTo: deliveryMethod === 'email' ? coSigner.email : coSigner.cellPhone,
        success: sendResult.success,
        error: sendResult.error,
      },
    });
    
  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({ error: 'Failed to create request' });
  }
});

/**
 * GET /api/agent/requests
 * List recent e-sign requests for this company
 */
router.get('/requests', validateApiKey, async (req, res) => {
  try {
    const { company } = req;
    const { status, limit = 50, offset = 0 } = req.query;
    
    const where = {
      companyId: company.id,
      source: 'AGENT',
    };
    
    if (status) {
      where.status = status;
    }
    
    const [requests, total] = await Promise.all([
      prisma.intake.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset),
        select: {
          id: true,
          linkCode: true,
          status: true,
          defendantData: true,
          indemnitorData: true,
          bondsData: true,
          sharedBondData: true,
          deliveryMethod: true,
          requestSentAt: true,
          requestSentTo: true,
          requestOpenedAt: true,
          submittedAt: true,
          createdAt: true,
        },
      }),
      prisma.intake.count({ where }),
    ]);
    
    res.json({
      requests: requests.map(r => ({
        id: r.id,
        linkCode: r.linkCode,
        status: r.status,
        defendant: {
          firstName: r.defendantData?.firstName,
          lastName: r.defendantData?.lastName,
        },
        coSigner: {
          firstName: r.indemnitorData?.firstName,
          lastName: r.indemnitorData?.lastName,
        },
        bondCount: r.bondsData?.length || 0,
        totalBondAmount: r.bondsData?.reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0) || 0,
        deliveryMethod: r.deliveryMethod,
        requestSentAt: r.requestSentAt,
        requestOpenedAt: r.requestOpenedAt,
        submittedAt: r.submittedAt,
        createdAt: r.createdAt,
      })),
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
    
  } catch (error) {
    console.error('List requests error:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

/**
 * GET /api/agent/request/:linkCode
 * Get details of a specific request
 */
router.get('/request/:linkCode', validateApiKey, async (req, res) => {
  try {
    const { company } = req;
    const { linkCode } = req.params;
    
    const intake = await prisma.intake.findFirst({
      where: {
        linkCode,
        companyId: company.id,
      },
    });
    
    if (!intake) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    res.json({
      id: intake.id,
      linkCode: intake.linkCode,
      status: intake.status,
      source: intake.source,
      defendant: intake.defendantData,
      coSigner: intake.indemnitorData,
      bonds: intake.bondsData,
      sharedBondData: intake.sharedBondData,
      references: intake.referencesData,
      signatures: intake.signatures ? Object.keys(intake.signatures) : [],
      deliveryMethod: intake.deliveryMethod,
      requestSentAt: intake.requestSentAt,
      requestSentTo: intake.requestSentTo,
      requestOpenedAt: intake.requestOpenedAt,
      submittedAt: intake.submittedAt,
      createdAt: intake.createdAt,
      expiresAt: intake.expiresAt,
    });
    
  } catch (error) {
    console.error('Get request error:', error);
    res.status(500).json({ error: 'Failed to fetch request' });
  }
});

/**
 * POST /api/agent/resend/:linkCode
 * Resend the e-sign request to co-signer
 */
router.post('/resend/:linkCode', validateApiKey, async (req, res) => {
  try {
    const { company } = req;
    const { linkCode } = req.params;
    const { deliveryMethod } = req.body; // Optional: override original delivery method
    
    const intake = await prisma.intake.findFirst({
      where: {
        linkCode,
        companyId: company.id,
        source: 'AGENT',
      },
    });
    
    if (!intake) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    if (intake.status === 'COMPLETED') {
      return res.status(400).json({ error: 'Request already completed' });
    }
    
    const method = deliveryMethod || intake.deliveryMethod;
    const coSigner = intake.indemnitorData;
    const defendant = intake.defendantData;
    
    const baseUrl = process.env.BASE_URL || 'https://www.bondprospects.com';
    const intakeUrl = `${baseUrl}/${company.slug}/${linkCode}`;
    
    const sendResult = await sendESignRequest({
      deliveryMethod: method,
      recipientEmail: coSigner.email,
      recipientPhone: coSigner.cellPhone,
      recipientName: `${coSigner.firstName} ${coSigner.lastName}`,
      defendantName: `${defendant.firstName} ${defendant.lastName}`,
      companyName: company.name,
      intakeUrl,
    });
    
    // Log the resend
    await prisma.auditLog.create({
      data: {
        intakeId: intake.id,
        action: 'agent_request_resent',
        details: {
          deliveryMethod: method,
          sendSuccess: sendResult.success,
          sendError: sendResult.error,
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });
    
    res.json({
      success: sendResult.success,
      error: sendResult.error,
      sentTo: method === 'email' ? coSigner.email : coSigner.cellPhone,
    });
    
  } catch (error) {
    console.error('Resend request error:', error);
    res.status(500).json({ error: 'Failed to resend request' });
  }
});

/**
 * DELETE /api/agent/request/:linkCode
 * Cancel an e-sign request
 */
router.delete('/request/:linkCode', validateApiKey, async (req, res) => {
  try {
    const { company } = req;
    const { linkCode } = req.params;
    
    const intake = await prisma.intake.findFirst({
      where: {
        linkCode,
        companyId: company.id,
        source: 'AGENT',
      },
    });
    
    if (!intake) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    if (intake.status === 'COMPLETED') {
      return res.status(400).json({ error: 'Cannot cancel completed request' });
    }
    
    await prisma.intake.update({
      where: { id: intake.id },
      data: { status: 'CANCELLED' },
    });
    
    await prisma.auditLog.create({
      data: {
        intakeId: intake.id,
        action: 'agent_request_cancelled',
        details: {},
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('Cancel request error:', error);
    res.status(500).json({ error: 'Failed to cancel request' });
  }
});

export default router;
