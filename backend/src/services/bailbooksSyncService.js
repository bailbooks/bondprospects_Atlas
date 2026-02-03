/**
 * Bailbooks Sync Service
 * Pulls agents, facilities, and courts from Bailbooks API
 * Called nightly or on-demand when agent opens the wizard
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Bailbooks API base URL (will be configured per environment)
const BAILBOOKS_API_URL = process.env.BAILBOOKS_API_URL || 'https://app.bailbooks.com/api';

/**
 * Sync data from Bailbooks for a specific company
 * @param {string} companyId - BondProspects company ID
 * @returns {Object} Sync results
 */
export async function syncCompanyFromBailbooks(companyId) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  if (!company || !company.bailbooksCompanyId) {
    throw new Error('Company not found or not linked to Bailbooks');
  }

  if (!company.apiKey) {
    throw new Error('Company does not have an API key configured');
  }

  try {
    // Call Bailbooks sync endpoint
    const response = await fetch(
      `${BAILBOOKS_API_URL}/bondprospects/sync/${company.bailbooksCompanyId}`,
      {
        headers: {
          'X-API-Key': company.apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Bailbooks API error: ${response.status}`);
    }

    const data = await response.json();

    // Sync agents
    if (data.agents && data.agents.length > 0) {
      await syncAgents(companyId, data.agents);
    }

    // Sync facilities
    if (data.facilities && data.facilities.length > 0) {
      await syncFacilities(companyId, data.facilities);
    }

    // Sync courts
    if (data.courts && data.courts.length > 0) {
      await syncCourts(companyId, data.courts);
    }

    // Update last synced timestamp
    await prisma.company.update({
      where: { id: companyId },
      data: { lastSyncedAt: new Date() },
    });

    return {
      success: true,
      agentCount: data.agents?.length || 0,
      facilityCount: data.facilities?.length || 0,
      courtCount: data.courts?.length || 0,
      syncedAt: new Date(),
    };

  } catch (error) {
    console.error('Bailbooks sync error:', error);
    throw error;
  }
}

/**
 * Sync agents from Bailbooks
 */
async function syncAgents(companyId, agents) {
  for (const agent of agents) {
    await prisma.syncedAgent.upsert({
      where: {
        companyId_bailbooksAgentId: {
          companyId,
          bailbooksAgentId: agent.agentId,
        },
      },
      update: {
        name: agent.name,
        isActive: agent.active !== false,
        updatedAt: new Date(),
      },
      create: {
        companyId,
        bailbooksAgentId: agent.agentId,
        name: agent.name,
        isActive: agent.active !== false,
      },
    });
  }

  // Mark agents not in the list as inactive
  const activeIds = agents.map(a => a.agentId);
  await prisma.syncedAgent.updateMany({
    where: {
      companyId,
      bailbooksAgentId: { notIn: activeIds },
    },
    data: { isActive: false },
  });
}

/**
 * Sync facilities from Bailbooks
 */
async function syncFacilities(companyId, facilities) {
  for (const facility of facilities) {
    await prisma.syncedFacility.upsert({
      where: {
        companyId_bailbooksFacilityId: {
          companyId,
          bailbooksFacilityId: facility.facilityId,
        },
      },
      update: {
        name: facility.name || facility.facilityName,
        isActive: true,
        updatedAt: new Date(),
      },
      create: {
        companyId,
        bailbooksFacilityId: facility.facilityId,
        name: facility.name || facility.facilityName,
        facilityType: facility.facilityType || 'jail',
        isActive: true,
      },
    });
  }
}

/**
 * Sync courts from Bailbooks
 */
async function syncCourts(companyId, courts) {
  for (const court of courts) {
    await prisma.syncedCourt.upsert({
      where: {
        companyId_bailbooksCourtId: {
          companyId,
          bailbooksCourtId: court.courtId,
        },
      },
      update: {
        name: court.name || court.courtName,
        isActive: true,
        updatedAt: new Date(),
      },
      create: {
        companyId,
        bailbooksCourtId: court.courtId,
        name: court.name || court.courtName,
        isActive: true,
      },
    });
  }
}

/**
 * Sync all companies that have Bailbooks integration
 * Called by nightly cron job
 */
export async function syncAllCompanies() {
  const companies = await prisma.company.findMany({
    where: {
      bailbooksCompanyId: { not: null },
      apiKey: { not: null },
      isActive: true,
    },
  });

  const results = [];

  for (const company of companies) {
    try {
      const result = await syncCompanyFromBailbooks(company.id);
      results.push({ companyId: company.id, ...result });
    } catch (error) {
      results.push({
        companyId: company.id,
        success: false,
        error: error.message,
      });
    }
  }

  return results;
}

/**
 * Send completed submission to Bailbooks
 * Called when co-signer completes the e-sign forms
 */
export async function sendSubmissionToBailbooks(intakeId) {
  const intake = await prisma.intake.findUnique({
    where: { id: intakeId },
    include: { company: true },
  });

  if (!intake) {
    throw new Error('Intake not found');
  }

  if (!intake.company.bailbooksCompanyId) {
    console.log('Company not linked to Bailbooks, skipping sync');
    return { success: false, reason: 'not_linked' };
  }

  try {
    const payload = {
      intakeId: intake.id,
      linkCode: intake.linkCode,
      companyId: intake.company.bailbooksCompanyId,
      submittedAt: intake.submittedAt,
      defendant: intake.defendantData,
      indemnitor: intake.indemnitorData,
      references: intake.referencesData,
      bonds: intake.bondsData || [intake.bondData],
      signatures: intake.signatures ? Object.keys(intake.signatures) : [],
      pdfs: {
        preApplication: `${process.env.BASE_URL}/api/intake/${intake.linkCode}/pdf/preApplication`,
        indemnitorApp: `${process.env.BASE_URL}/api/intake/${intake.linkCode}/pdf/indemnitorApp`,
        bondAgreement: `${process.env.BASE_URL}/api/intake/${intake.linkCode}/pdf/bondAgreement`,
        immigrationWaiver: `${process.env.BASE_URL}/api/intake/${intake.linkCode}/pdf/immigrationWaiver`,
        referenceForm: `${process.env.BASE_URL}/api/intake/${intake.linkCode}/pdf/referenceForm`,
      },
    };

    const response = await fetch(
      `${BAILBOOKS_API_URL}/bondprospects/submission`,
      {
        method: 'POST',
        headers: {
          'X-API-Key': intake.company.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Bailbooks API error: ${response.status} - ${error}`);
    }

    const result = await response.json();

    // Update intake with Bailbooks IDs
    await prisma.intake.update({
      where: { id: intakeId },
      data: {
        bailbooksSynced: true,
        bailbooksSyncedAt: new Date(),
        bailbooksCustomerId: result.customerId,
      },
    });

    return {
      success: true,
      customerId: result.customerId,
      prospectId: result.prospectId,
    };

  } catch (error) {
    console.error('Bailbooks submission error:', error);
    
    // Log the failure but don't throw - submission already completed
    await prisma.auditLog.create({
      data: {
        intakeId,
        action: 'bailbooks_sync_failed',
        details: { error: error.message },
      },
    });

    return { success: false, error: error.message };
  }
}
