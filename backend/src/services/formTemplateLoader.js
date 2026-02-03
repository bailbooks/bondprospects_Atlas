/**
 * Form Template Loader Service
 * 
 * Loads the correct form templates for each company.
 * Templates can be stored in:
 * 1. Database (FormTemplate model) - preferred for production
 * 2. File system (formTemplates_{slug}.js) - for development/migration
 * 3. Default templates - fallback if no custom templates exist
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Default template generators (fallback)
import * as defaultTemplates from './formTemplates.js';

// Cache for loaded templates
const templateCache = new Map();

/**
 * Get form templates for a company
 * @param {string} companyId - Company ID
 * @returns {Object} Template generators for all form types
 */
export async function getCompanyTemplates(companyId) {
  // Check cache first
  if (templateCache.has(companyId)) {
    return templateCache.get(companyId);
  }
  
  try {
    // Try to load from database
    const dbTemplates = await prisma.formTemplate.findMany({
      where: { companyId, isActive: true }
    });
    
    if (dbTemplates.length > 0) {
      const templates = buildTemplatesFromDb(dbTemplates);
      templateCache.set(companyId, templates);
      return templates;
    }
    
    // Fall back to default templates
    templateCache.set(companyId, defaultTemplates);
    return defaultTemplates;
    
  } catch (error) {
    console.error('Error loading templates for company:', companyId, error);
    return defaultTemplates;
  }
}

/**
 * Build template functions from database records
 */
function buildTemplatesFromDb(dbTemplates) {
  const templates = {};
  
  for (const template of dbTemplates) {
    templates[`generate${capitalize(template.formType)}`] = (data, signatures) => {
      return renderTemplate(template.htmlTemplate, data, signatures);
    };
  }
  
  // Fill in any missing form types with defaults
  const formTypes = ['preApplication', 'referenceForm', 'immigrationWaiver', 'indemnitorApplication', 'immigrationBondAgreement'];
  
  for (const formType of formTypes) {
    const funcName = `generate${capitalize(formType)}`;
    if (!templates[funcName] && defaultTemplates[funcName]) {
      templates[funcName] = defaultTemplates[funcName];
    }
  }
  
  return templates;
}

/**
 * Render a template with data
 * Replaces {{variable}} placeholders with actual values
 */
function renderTemplate(htmlTemplate, data, signatures) {
  const { defendant = {}, indemnitor = {}, references = [], bond = {}, company = {} } = data;
  
  let html = htmlTemplate;
  
  // Replace defendant placeholders
  html = html.replace(/\{\{defendant\.(\w+)\}\}/g, (match, key) => {
    return escapeHtml(defendant[key] || '');
  });
  
  // Replace indemnitor placeholders
  html = html.replace(/\{\{indemnitor\.(\w+)\}\}/g, (match, key) => {
    return escapeHtml(indemnitor[key] || '');
  });
  
  // Replace bond placeholders
  html = html.replace(/\{\{bond\.(\w+)\}\}/g, (match, key) => {
    return escapeHtml(bond[key] || '');
  });
  
  // Replace company placeholders
  html = html.replace(/\{\{company\.(\w+)\}\}/g, (match, key) => {
    return escapeHtml(company[key] || '');
  });
  
  // Replace date placeholders
  html = html.replace(/\{\{currentDate\}\}/g, formatDate(new Date()));
  
  // Replace signature placeholders
  html = html.replace(/\{\{signature\.(\w+)\}\}/g, (match, key) => {
    const sig = signatures[key];
    return sig ? `<img src="${sig}" alt="Signature" style="max-height: 38px;" />` : '';
  });
  
  // Replace reference placeholders (special handling for arrays)
  for (let i = 0; i < 5; i++) {
    const ref = references[i] || {};
    html = html.replace(new RegExp(`\\{\\{reference${i}\\.(\w+)\\}\\}`, 'g'), (match, key) => {
      return escapeHtml(ref[key] || '');
    });
  }
  
  return html;
}

/**
 * Save form templates for a company
 */
export async function saveCompanyTemplates(companyId, templates) {
  const results = [];
  
  for (const template of templates) {
    const result = await prisma.formTemplate.upsert({
      where: {
        companyId_formType: {
          companyId,
          formType: template.formType
        }
      },
      update: {
        name: template.name,
        htmlTemplate: template.htmlTemplate,
        requiredSignatures: template.requiredSignatures,
        isActive: template.isActive ?? true
      },
      create: {
        companyId,
        formType: template.formType,
        name: template.name,
        htmlTemplate: template.htmlTemplate,
        requiredSignatures: template.requiredSignatures,
        isActive: template.isActive ?? true
      }
    });
    results.push(result);
  }
  
  // Clear cache for this company
  templateCache.delete(companyId);
  
  return results;
}

/**
 * Get form template info for a company (without full HTML)
 */
export async function getCompanyTemplateInfo(companyId) {
  const templates = await prisma.formTemplate.findMany({
    where: { companyId },
    select: {
      id: true,
      formType: true,
      name: true,
      requiredSignatures: true,
      isActive: true,
      createdAt: true,
      updatedAt: true
    }
  });
  
  // If no custom templates, return info about defaults
  if (templates.length === 0) {
    return [
      { formType: 'preApplication', name: 'Pre-Application', isDefault: true },
      { formType: 'referenceForm', name: 'Reference Form', isDefault: true },
      { formType: 'immigrationWaiver', name: 'Immigration Waiver', isDefault: true },
      { formType: 'indemnitorApplication', name: 'Indemnitor Application', isDefault: true },
      { formType: 'immigrationBondAgreement', name: 'Immigration Bond Agreement', isDefault: true }
    ];
  }
  
  return templates;
}

/**
 * Delete form templates for a company
 */
export async function deleteCompanyTemplates(companyId, formTypes = null) {
  const where = { companyId };
  
  if (formTypes && formTypes.length > 0) {
    where.formType = { in: formTypes };
  }
  
  await prisma.formTemplate.deleteMany({ where });
  
  // Clear cache
  templateCache.delete(companyId);
}

/**
 * Clear template cache (useful after updates)
 */
export function clearTemplateCache(companyId = null) {
  if (companyId) {
    templateCache.delete(companyId);
  } else {
    templateCache.clear();
  }
}

// Helper functions
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}/${d.getFullYear()}`;
}

export default {
  getCompanyTemplates,
  saveCompanyTemplates,
  getCompanyTemplateInfo,
  deleteCompanyTemplates,
  clearTemplateCache
};
