import express from 'express';
import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/company/:slug
 * Get company by slug and auto-create an intake session
 */
router.get('/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;
    
    // Find company by slug (case-insensitive)
    const company = await prisma.company.findFirst({
      where: {
        slug: {
          equals: slug.toLowerCase(),
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        slug: true,
        name: true,
        address: true,
        city: true,
        state: true,
        zip: true,
        phone: true,
        email: true,
        logo: true,
        primaryColor: true,
        wizardType: true
      }
    });
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    // Auto-create a new intake session for this visitor
    const linkCode = nanoid(8);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 day expiration
    
    const intake = await prisma.intake.create({
      data: {
        linkCode,
        companyId: company.id,
        expiresAt
      }
    });
    
    // Log the visit
    await prisma.auditLog.create({
      data: {
        intakeId: intake.id,
        action: 'created_via_slug',
        details: { slug, userAgent: req.get('user-agent') },
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });
    
    res.json({
      company,
      intake: {
        id: intake.id,
        linkCode: intake.linkCode,
        status: intake.status,
        expiresAt: intake.expiresAt
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/company/:slug/info
 * Get company info only (no intake creation) - for checking if slug exists
 */
router.get('/:slug/info', async (req, res, next) => {
  try {
    const { slug } = req.params;
    
    const company = await prisma.company.findFirst({
      where: { 
        slug: {
          equals: slug.toLowerCase(),
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        slug: true,
        name: true,
        logo: true,
        primaryColor: true,
        phone: true
      }
    });
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    res.json(company);
    
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/company
 * Create a new company (admin only - add auth later)
 */
router.post('/', async (req, res, next) => {
  try {
    const { 
      slug, 
      name, 
      address, 
      city, 
      state, 
      zip, 
      phone, 
      email, 
      logo,
      primaryColor,
      bailbooksCompanyId,
      bailbooksApiKey,
      bailbooksApiUrl
    } = req.body;
    
    if (!slug || !name) {
      return res.status(400).json({ error: 'slug and name are required' });
    }
    
    // Validate slug format (lowercase, alphanumeric, hyphens only)
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug.toLowerCase())) {
      return res.status(400).json({ 
        error: 'Slug can only contain lowercase letters, numbers, and hyphens' 
      });
    }
    
    // Check if slug already exists
    const existing = await prisma.company.findFirst({
      where: { slug: slug.toLowerCase() }
    });
    
    if (existing) {
      return res.status(409).json({ error: 'This slug is already in use' });
    }
    
    const company = await prisma.company.create({
      data: {
        slug: slug.toLowerCase(),
        name,
        address,
        city,
        state,
        zip,
        phone,
        email,
        logo,
        primaryColor,
        bailbooksCompanyId,
        bailbooksApiKey,
        bailbooksApiUrl
      }
    });
    
    res.status(201).json(company);
    
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/company
 * List all companies (admin only - add auth later)
 */
router.get('/', async (req, res, next) => {
  try {
    const companies = await prisma.company.findMany({
      select: {
        id: true,
        slug: true,
        name: true,
        email: true,
        phone: true,
        logo: true,
        createdAt: true,
        _count: {
          select: { intakes: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    
    res.json(companies);
    
  } catch (error) {
    next(error);
  }
});

export default router;
