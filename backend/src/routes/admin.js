import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const router = express.Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'bondprospects-secret-change-in-production';

// ============================================================================
// MIDDLEWARE: Verify admin JWT token
// ============================================================================
const authenticateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const admin = await prisma.adminUser.findUnique({
      where: { id: decoded.adminId }
    });
    
    if (!admin || !admin.isActive) {
      return res.status(401).json({ error: 'Invalid or inactive admin' });
    }
    
    req.admin = admin;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// ============================================================================
// AUTH ROUTES
// ============================================================================

/**
 * POST /api/admin/login
 * Admin login
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    const admin = await prisma.adminUser.findUnique({
      where: { email: email.toLowerCase() }
    });
    
    if (!admin || !admin.isActive) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const validPassword = await bcrypt.compare(password, admin.passwordHash);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Update last login
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: req.ip
      }
    });
    
    // Generate JWT
    const token = jwt.sign(
      { adminId: admin.id, email: admin.email, role: admin.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/me
 * Get current admin info
 */
router.get('/me', authenticateAdmin, async (req, res) => {
  res.json({
    id: req.admin.id,
    email: req.admin.email,
    name: req.admin.name,
    role: req.admin.role
  });
});

/**
 * POST /api/admin/setup
 * Initial admin setup (only works if no admins exist)
 */
router.post('/setup', async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    
    // Check if any admin exists
    const existingAdmin = await prisma.adminUser.findFirst();
    
    if (existingAdmin) {
      return res.status(403).json({ error: 'Admin already exists. Use login.' });
    }
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name required' });
    }
    
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    
    const passwordHash = await bcrypt.hash(password, 12);
    
    const admin = await prisma.adminUser.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        name,
        role: 'superadmin'
      }
    });
    
    // Generate token
    const token = jwt.sign(
      { adminId: admin.id, email: admin.email, role: admin.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.status(201).json({
      message: 'Admin account created successfully',
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      }
    });
    
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// COMPANY MANAGEMENT ROUTES (all require authentication)
// ============================================================================

/**
 * GET /api/admin/companies
 * List all companies with stats
 */
router.get('/companies', authenticateAdmin, async (req, res, next) => {
  try {
    const companies = await prisma.company.findMany({
      select: {
        id: true,
        slug: true,
        name: true,
        email: true,
        phone: true,
        logo: true,
        primaryColor: true,
        isActive: true,
        bailbooksCompanyId: true,
        apiKey: true,
        apiKeyCreatedAt: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { 
            intakes: true 
          }
        }
      },
      orderBy: { name: 'asc' }
    });
    
    // Get intake stats per company
    const companiesWithStats = await Promise.all(
      companies.map(async (company) => {
        const stats = await prisma.intake.groupBy({
          by: ['status'],
          where: { companyId: company.id },
          _count: true
        });
        
        const statusCounts = {
          total: company._count.intakes,
          pending: 0,
          inProgress: 0,
          completed: 0,
          expired: 0
        };
        
        stats.forEach(s => {
          if (s.status === 'PENDING') statusCounts.pending = s._count;
          if (s.status === 'IN_PROGRESS') statusCounts.inProgress = s._count;
          if (s.status === 'COMPLETED') statusCounts.completed = s._count;
          if (s.status === 'EXPIRED') statusCounts.expired = s._count;
        });
        
        return {
          ...company,
          hasApiKey: !!company.apiKey,
          apiKey: undefined, // Don't expose the actual key in list
          stats: statusCounts
        };
      })
    );
    
    res.json(companiesWithStats);
    
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/companies/:id
 * Get single company details
 */
router.get('/companies/:id', authenticateAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        _count: {
          select: { intakes: true }
        }
      }
    });
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    // Get recent intakes
    const recentIntakes = await prisma.intake.findMany({
      where: { companyId: id },
      select: {
        id: true,
        linkCode: true,
        status: true,
        createdAt: true,
        submittedAt: true,
        defendantData: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    res.json({
      ...company,
      hasApiKey: !!company.apiKey,
      // Only show masked API key
      apiKeyMasked: company.apiKey 
        ? company.apiKey.substring(0, 8) + '...' + company.apiKey.substring(company.apiKey.length - 4)
        : null,
      apiKey: undefined,
      recentIntakes
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/companies
 * Create new company
 */
router.post('/companies', authenticateAdmin, async (req, res, next) => {
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
      wizardType,
      requiredFields
    } = req.body;
    
    if (!slug || !name) {
      return res.status(400).json({ error: 'Slug and name are required' });
    }
    
    // Validate slug format
    const slugRegex = /^[a-z0-9-]+$/;
    const cleanSlug = slug.toLowerCase().trim();
    
    if (!slugRegex.test(cleanSlug)) {
      return res.status(400).json({ 
        error: 'Slug can only contain lowercase letters, numbers, and hyphens' 
      });
    }
    
    if (cleanSlug.length < 3 || cleanSlug.length > 50) {
      return res.status(400).json({ 
        error: 'Slug must be between 3 and 50 characters' 
      });
    }
    
    // Check reserved slugs
    const reservedSlugs = ['admin', 'api', 'login', 'signup', 'health', 'i', 'expired', 'www'];
    if (reservedSlugs.includes(cleanSlug)) {
      return res.status(400).json({ 
        error: 'This URL is reserved and cannot be used' 
      });
    }
    
    // Check if slug already exists
    const existingSlug = await prisma.company.findUnique({
      where: { slug: cleanSlug }
    });
    
    if (existingSlug) {
      return res.status(409).json({ 
        error: 'This URL is already in use by another company' 
      });
    }
    
    // Check if bailbooksCompanyId already linked
    if (bailbooksCompanyId) {
      const existingBailbooks = await prisma.company.findUnique({
        where: { bailbooksCompanyId: parseInt(bailbooksCompanyId) }
      });
      
      if (existingBailbooks) {
        return res.status(409).json({ 
          error: 'This Bailbooks Company ID is already linked to another account' 
        });
      }
    }
    
    const company = await prisma.company.create({
      data: {
        slug: cleanSlug,
        name,
        address,
        city,
        state,
        zip,
        phone,
        email,
        logo,
        primaryColor,
        bailbooksCompanyId: bailbooksCompanyId ? parseInt(bailbooksCompanyId) : null,
        wizardType: wizardType || 'medium',
        requiredFields: requiredFields || null,
        isActive: true
      }
    });
    
    res.status(201).json({
      ...company,
      formUrl: `https://www.bondprospects.com/${company.slug}`
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/admin/companies/:id
 * Update company
 */
router.put('/companies/:id', authenticateAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
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
      wizardType,
      requiredFields,
      isActive
    } = req.body;
    
    const existing = await prisma.company.findUnique({
      where: { id }
    });
    
    if (!existing) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    // If slug is changing, validate it
    if (slug && slug !== existing.slug) {
      const cleanSlug = slug.toLowerCase().trim();
      const slugRegex = /^[a-z0-9-]+$/;
      
      if (!slugRegex.test(cleanSlug)) {
        return res.status(400).json({ 
          error: 'Slug can only contain lowercase letters, numbers, and hyphens' 
        });
      }
      
      const existingSlug = await prisma.company.findUnique({
        where: { slug: cleanSlug }
      });
      
      if (existingSlug && existingSlug.id !== id) {
        return res.status(409).json({ 
          error: 'This URL is already in use by another company' 
        });
      }
    }
    
    // If bailbooksCompanyId is changing, check it's not already linked
    if (bailbooksCompanyId && bailbooksCompanyId !== existing.bailbooksCompanyId) {
      const existingBailbooks = await prisma.company.findUnique({
        where: { bailbooksCompanyId: parseInt(bailbooksCompanyId) }
      });
      
      if (existingBailbooks && existingBailbooks.id !== id) {
        return res.status(409).json({ 
          error: 'This Bailbooks Company ID is already linked to another account' 
        });
      }
    }
    
    const company = await prisma.company.update({
      where: { id },
      data: {
        slug: slug ? slug.toLowerCase().trim() : undefined,
        name,
        address,
        city,
        state,
        zip,
        phone,
        email,
        logo,
        primaryColor,
        bailbooksCompanyId: bailbooksCompanyId ? parseInt(bailbooksCompanyId) : null,
        wizardType,
        requiredFields,
        isActive
      }
    });
    
    res.json(company);
    
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/admin/companies/:id
 * Delete company (soft delete - just deactivate)
 */
router.delete('/companies/:id', authenticateAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const company = await prisma.company.findUnique({
      where: { id }
    });
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    // Soft delete - just deactivate
    await prisma.company.update({
      where: { id },
      data: { isActive: false }
    });
    
    res.json({ message: 'Company deactivated successfully' });
    
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// API KEY MANAGEMENT
// ============================================================================

/**
 * Generate a secure API key
 */
function generateApiKey() {
  const prefix = 'bp_live_';
  const randomPart = crypto.randomBytes(24).toString('hex');
  return prefix + randomPart;
}

/**
 * POST /api/admin/companies/:id/api-key
 * Generate new API key for company
 */
router.post('/companies/:id/api-key', authenticateAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const company = await prisma.company.findUnique({
      where: { id }
    });
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    const apiKey = generateApiKey();
    
    await prisma.company.update({
      where: { id },
      data: {
        apiKey,
        apiKeyCreatedAt: new Date()
      }
    });
    
    res.json({
      apiKey,
      message: 'API key generated successfully. Save this key - it will only be shown once.',
      createdAt: new Date()
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/admin/companies/:id/api-key
 * Revoke/delete API key
 */
router.delete('/companies/:id/api-key', authenticateAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const company = await prisma.company.findUnique({
      where: { id }
    });
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    await prisma.company.update({
      where: { id },
      data: {
        apiKey: null,
        apiKeyCreatedAt: null
      }
    });
    
    res.json({ message: 'API key revoked successfully' });
    
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// SLUG AVAILABILITY CHECK
// ============================================================================

/**
 * GET /api/admin/check-slug/:slug
 * Check if a slug is available
 */
router.get('/check-slug/:slug', authenticateAdmin, async (req, res, next) => {
  try {
    const { slug } = req.params;
    const cleanSlug = slug.toLowerCase().trim();
    
    // Check reserved slugs
    const reservedSlugs = ['admin', 'api', 'login', 'signup', 'health', 'i', 'expired', 'www'];
    if (reservedSlugs.includes(cleanSlug)) {
      return res.json({ available: false, reason: 'Reserved URL' });
    }
    
    // Check format
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(cleanSlug)) {
      return res.json({ available: false, reason: 'Invalid format' });
    }
    
    // Check if exists
    const existing = await prisma.company.findUnique({
      where: { slug: cleanSlug }
    });
    
    res.json({ 
      available: !existing,
      reason: existing ? 'Already in use' : null,
      previewUrl: !existing ? `https://www.bondprospects.com/${cleanSlug}` : null
    });
    
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// DASHBOARD STATS
// ============================================================================

/**
 * GET /api/admin/stats
 * Get dashboard statistics
 */
router.get('/stats', authenticateAdmin, async (req, res, next) => {
  try {
    const [
      totalCompanies,
      activeCompanies,
      totalIntakes,
      completedIntakes,
      todayIntakes
    ] = await Promise.all([
      prisma.company.count(),
      prisma.company.count({ where: { isActive: true } }),
      prisma.intake.count(),
      prisma.intake.count({ where: { status: 'COMPLETED' } }),
      prisma.intake.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      })
    ]);
    
    // Get last 7 days intake trend
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentIntakes = await prisma.intake.groupBy({
      by: ['status'],
      where: {
        createdAt: { gte: sevenDaysAgo }
      },
      _count: true
    });
    
    res.json({
      companies: {
        total: totalCompanies,
        active: activeCompanies
      },
      intakes: {
        total: totalIntakes,
        completed: completedIntakes,
        today: todayIntakes,
        conversionRate: totalIntakes > 0 
          ? ((completedIntakes / totalIntakes) * 100).toFixed(1) 
          : 0
      },
      recentActivity: recentIntakes
    });
    
  } catch (error) {
    next(error);
  }
});

import { saveCompanyTemplates, getCompanyTemplateInfo, deleteCompanyTemplates, clearTemplateCache } from '../services/formTemplateLoader.js';

// ============================================================================
// CLEAR TEST DATA
// ============================================================================

/**
 * DELETE /api/admin/clear-test-data
 * Delete all non-completed intakes (test data cleanup)
 */
router.delete('/clear-test-data', authenticateAdmin, async (req, res, next) => {
  try {
    // Only superadmin can clear data
    if (req.admin.role !== 'superadmin') {
      return res.status(403).json({ error: 'Only superadmin can clear test data' });
    }
    
    // Delete all intakes that are not COMPLETED
    const deleted = await prisma.intake.deleteMany({
      where: {
        status: {
          not: 'COMPLETED'
        }
      }
    });
    
    // Also delete audit logs for deleted intakes
    await prisma.auditLog.deleteMany({
      where: {
        action: {
          in: ['created', 'viewed', 'started']
        }
      }
    });
    
    res.json({ 
      message: 'Test data cleared successfully',
      deletedIntakes: deleted.count
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/admin/clear-all-data
 * Delete ALL intakes (complete reset - use with caution)
 */
router.delete('/clear-all-data', authenticateAdmin, async (req, res, next) => {
  try {
    // Only superadmin can clear data
    if (req.admin.role !== 'superadmin') {
      return res.status(403).json({ error: 'Only superadmin can clear all data' });
    }
    
    // Delete all audit logs first (foreign key constraint)
    await prisma.auditLog.deleteMany({});
    
    // Delete all intakes
    const deleted = await prisma.intake.deleteMany({});
    
    res.json({ 
      message: 'All intake data cleared successfully',
      deletedIntakes: deleted.count
    });
    
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// FORM TEMPLATE MANAGEMENT
// ============================================================================

/**
 * GET /api/admin/companies/:id/templates
 * Get form templates for a company
 */
router.get('/companies/:id/templates', authenticateAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const company = await prisma.company.findUnique({
      where: { id }
    });
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    const templates = await getCompanyTemplateInfo(id);
    res.json(templates);
    
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/companies/:id/templates/:formType
 * Get a specific form template with full HTML
 */
router.get('/companies/:id/templates/:formType', authenticateAdmin, async (req, res, next) => {
  try {
    const { id, formType } = req.params;
    
    const template = await prisma.formTemplate.findUnique({
      where: {
        companyId_formType: {
          companyId: id,
          formType
        }
      }
    });
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found', isDefault: true });
    }
    
    res.json(template);
    
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/companies/:id/templates
 * Save form templates for a company
 * Body: { templates: [{ formType, name, htmlTemplate, requiredSignatures }] }
 */
router.post('/companies/:id/templates', authenticateAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { templates } = req.body;
    
    if (!templates || !Array.isArray(templates)) {
      return res.status(400).json({ error: 'Templates array required' });
    }
    
    const company = await prisma.company.findUnique({
      where: { id }
    });
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    const results = await saveCompanyTemplates(id, templates);
    
    res.json({
      message: `Saved ${results.length} template(s)`,
      templates: results
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/admin/companies/:id/templates/:formType
 * Update a specific form template
 */
router.put('/companies/:id/templates/:formType', authenticateAdmin, async (req, res, next) => {
  try {
    const { id, formType } = req.params;
    const { name, htmlTemplate, requiredSignatures, isActive } = req.body;
    
    const result = await prisma.formTemplate.upsert({
      where: {
        companyId_formType: {
          companyId: id,
          formType
        }
      },
      update: {
        name,
        htmlTemplate,
        requiredSignatures,
        isActive
      },
      create: {
        companyId: id,
        formType,
        name,
        htmlTemplate,
        requiredSignatures,
        isActive: isActive ?? true
      }
    });
    
    // Clear cache
    clearTemplateCache(id);
    
    res.json(result);
    
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/admin/companies/:id/templates/:formType
 * Delete a specific form template (reverts to default)
 */
router.delete('/companies/:id/templates/:formType', authenticateAdmin, async (req, res, next) => {
  try {
    const { id, formType } = req.params;
    
    await prisma.formTemplate.delete({
      where: {
        companyId_formType: {
          companyId: id,
          formType
        }
      }
    });
    
    // Clear cache
    clearTemplateCache(id);
    
    res.json({ message: 'Template deleted, will use default' });
    
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Template not found' });
    }
    next(error);
  }
});

/**
 * POST /api/admin/companies/:id/templates/import
 * Import form templates from a JavaScript file content
 * This allows uploading generated template files from the skill
 */
router.post('/companies/:id/templates/import', authenticateAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { templateCode } = req.body;
    
    if (!templateCode) {
      return res.status(400).json({ error: 'Template code required' });
    }
    
    // For security, we don't eval the code
    // Instead, we expect pre-parsed template objects
    // The admin UI should parse the JS and extract the HTML templates
    
    return res.status(501).json({ 
      error: 'Direct code import not yet implemented. Please use the individual template endpoints.',
      hint: 'Parse the JS file client-side and POST each template to /api/admin/companies/:id/templates/:formType'
    });
    
  } catch (error) {
    next(error);
  }
});

export default router;
