import express from 'express';
import { PrismaClient } from '@prisma/client';
import {
  generatePreApplication,
  generateReferenceForm,
  generateImmigrationWaiver,
  generateIndemnitorApplication,
  generateImmigrationBondAgreement,
  generateAllForms
} from '../services/formTemplates.js';
import { getCompanyTemplates, getCompanyTemplateInfo } from '../services/formTemplateLoader.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Get the correct template generator for a company
 */
async function getTemplateGenerator(companyId, formType) {
  const templates = await getCompanyTemplates(companyId);
  
  const generatorMap = {
    'pre-application': templates.generatePreApplication || generatePreApplication,
    'reference-form': templates.generateReferenceForm || generateReferenceForm,
    'immigration-waiver': templates.generateImmigrationWaiver || generateImmigrationWaiver,
    'indemnitor-application': templates.generateIndemnitorApplication || generateIndemnitorApplication,
    'immigration-bond-agreement': templates.generateImmigrationBondAgreement || generateImmigrationBondAgreement
  };
  
  return generatorMap[formType];
}

/**
 * GET /api/forms/templates/:companyId
 * Get list of form templates for a company
 */
router.get('/templates/:companyId', async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const templates = await getCompanyTemplateInfo(companyId);
    res.json(templates);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/forms/preview/:intakeId/:formType
 * Preview a form as HTML (for viewing and printing)
 */
router.get('/preview/:intakeId/:formType', async (req, res, next) => {
  try {
    const { intakeId, formType } = req.params;
    
    // Get intake data
    const intake = await prisma.intake.findUnique({
      where: { id: intakeId },
      include: { company: true }
    });
    
    if (!intake) {
      return res.status(404).json({ error: 'Intake not found' });
    }
    
    // Build form data from intake
    const formData = {
      defendant: intake.defendantData || {},
      indemnitor: intake.indemnitorData || {},
      references: intake.referencesData || [],
      bond: intake.bondData || {},
      company: {
        name: intake.company?.name || 'Bail Bond Company',
        address: intake.company?.address || '',
        city: intake.company?.city || '',
        state: intake.company?.state || '',
        zip: intake.company?.zip || '',
        phone: intake.company?.phone || '',
        license: intake.company?.license || '',
        primaryColor: intake.company?.primaryColor || '#f7941d'
      }
    };
    
    const signatures = intake.signatures || {};
    
    // Get the correct template generator for this company
    const generator = await getTemplateGenerator(intake.companyId, formType);
    
    if (!generator) {
      return res.status(400).json({ error: 'Invalid form type' });
    }
    
    const html = generator(formData, signatures);
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
    
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/forms/print/:intakeId
 * Get all forms combined as a single printable HTML page
 */
router.get('/print/:intakeId', async (req, res, next) => {
  try {
    const { intakeId } = req.params;
    
    // Get intake data
    const intake = await prisma.intake.findUnique({
      where: { id: intakeId },
      include: { company: true }
    });
    
    if (!intake) {
      return res.status(404).json({ error: 'Intake not found' });
    }
    
    // Build form data from intake
    const formData = {
      defendant: intake.defendantData || {},
      indemnitor: intake.indemnitorData || {},
      references: intake.referencesData || [],
      bond: intake.bondData || {},
      company: {
        name: intake.company?.name || 'Bail Bond Company',
        address: intake.company?.address || '',
        city: intake.company?.city || '',
        state: intake.company?.state || '',
        zip: intake.company?.zip || '',
        phone: intake.company?.phone || '',
        license: intake.company?.license || '',
        primaryColor: intake.company?.primaryColor || '#f7941d'
      }
    };
    
    const signatures = intake.signatures || {};
    
    // Get company-specific templates
    const templates = await getCompanyTemplates(intake.companyId);
    
    // Generate combined printable HTML
    const html = generateCombinedForms(formData, signatures, templates);
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
    
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/forms/generate
 * Generate forms from raw data (for testing without intake)
 */
router.post('/generate', async (req, res, next) => {
  try {
    const { formType, data, signatures, companyId } = req.body;
    
    // If companyId provided, use company-specific templates
    let generator;
    if (companyId) {
      generator = await getTemplateGenerator(companyId, formType);
    } else {
      // Use default templates
      const defaultGenerators = {
        'pre-application': generatePreApplication,
        'reference-form': generateReferenceForm,
        'immigration-waiver': generateImmigrationWaiver,
        'indemnitor-application': generateIndemnitorApplication,
        'immigration-bond-agreement': generateImmigrationBondAgreement
      };
      generator = defaultGenerators[formType];
    }
    
    if (!generator && formType !== 'all') {
      return res.status(400).json({ error: 'Invalid form type' });
    }
    
    if (formType === 'all') {
      const forms = generateAllForms(data, signatures);
      return res.json(forms);
    }
    
    const html = generator(data, signatures);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
    
  } catch (error) {
    next(error);
  }
});

/**
 * Generate all forms combined into a single printable HTML document
 */
function generateCombinedForms(data, signatures, templates = null) {
  // Use provided templates or default
  const genPreApp = templates?.generatePreApplication || generatePreApplication;
  const genRef = templates?.generateReferenceForm || generateReferenceForm;
  const genWaiver = templates?.generateImmigrationWaiver || generateImmigrationWaiver;
  const genIndem = templates?.generateIndemnitorApplication || generateIndemnitorApplication;
  const genBond = templates?.generateImmigrationBondAgreement || generateImmigrationBondAgreement;
  
  const preApp = genPreApp(data, signatures);
  const refForm = genRef(data, signatures);
  const waiver = genWaiver(data, signatures);
  const indemnitor = genIndem(data, signatures);
  const bondAgreement = genBond(data, signatures);
  
  // Extract body content from each form and combine
  const extractBody = (html) => {
    const match = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    return match ? match[1] : '';
  };
  
  const primaryColor = data.company?.primaryColor || '#f7941d';
  
  const combinedStyles = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 11px; line-height: 1.3; color: #000; background: #fff; }
    .page { width: 8.5in; min-height: 11in; padding: 0.5in; margin: 0 auto; background: #fff; page-break-after: always; position: relative; }
    .page:last-child { page-break-after: avoid; }
    @media print {
      body { background: #fff; }
      .page { margin: 0; padding: 0.4in; box-shadow: none; }
      .no-print { display: none !important; }
    }
    @media screen {
      body { background: #f0f0f0; padding: 20px; }
      .page { box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px; }
    }
    .print-header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: ${primaryColor};
      color: white;
      padding: 15px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 1000;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    }
    .print-header h1 { font-size: 18px; }
    .print-button {
      background: white;
      color: ${primaryColor};
      border: none;
      padding: 10px 20px;
      font-size: 14px;
      font-weight: bold;
      border-radius: 6px;
      cursor: pointer;
    }
    .print-button:hover { background: #f0f0f0; }
    .content-wrapper { margin-top: 70px; }
  `;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Bail Bond Forms - ${data.defendant?.lastName || 'Application'}</title>
  <style>${combinedStyles}</style>
</head>
<body>
  <div class="print-header no-print">
    <h1>📄 ${data.company?.name || 'Bail Bond'} Forms - ${data.defendant?.firstName || ''} ${data.defendant?.lastName || ''}</h1>
    <button class="print-button" onclick="window.print()">
      🖨️ Print / Save as PDF
    </button>
  </div>
  
  <div class="content-wrapper">
    ${extractBody(preApp)}
    ${extractBody(refForm)}
    ${extractBody(waiver)}
    ${extractBody(indemnitor)}
    ${extractBody(bondAgreement)}
  </div>
  
  <script>
    // Auto-trigger print dialog if ?print=true in URL
    if (window.location.search.includes('print=true')) {
      window.onload = () => setTimeout(() => window.print(), 500);
    }
  </script>
</body>
</html>
`;
}

export default router;
