/*
=============================================================================
BondProspects ↔ Bailbooks API Integration
=============================================================================
This document describes the API endpoints that need to be created in Bailbooks
for BondProspects to sync data and send completed submissions.

Author: Gary Cass
Date: 2026-02-02
For: Sheeraz/Ahsan to implement in Bailbooks
=============================================================================
*/

-- ============================================================================
-- OVERVIEW
-- ============================================================================
/*
BondProspects needs to:
1. PULL data FROM Bailbooks (agents, facilities, courts) - nightly sync
2. PUSH data TO Bailbooks (completed e-sign submissions) - real-time

Authentication:
- Each Bailbooks company has an API key stored in BondProspects
- API key is passed in header: X-API-Key: {key}
- Or in query string: ?apiKey={key}
*/

-- ============================================================================
-- API ENDPOINTS BAILBOOKS NEEDS TO EXPOSE
-- ============================================================================

/*
===============================================================================
ENDPOINT 1: GET /api/bondprospects/sync/{companyId}
===============================================================================
Purpose: BondProspects calls this to get agents, facilities, courts for dropdowns
Called: Nightly by BondProspects sync job, or on-demand when agent opens wizard

Request:
  GET https://app.bailbooks.com/api/bondprospects/sync/4228
  Headers:
    X-API-Key: bp_live_abc123xyz

Response (200 OK):
{
  "success": true,
  "company": {
    "companyId": 4228,
    "name": "A Better Bail Bonds",
    "address": "123 Main St",
    "city": "Denver",
    "state": "CO",
    "zip": "80202",
    "phone": "(303) 555-1234",
    "email": "info@abetterbailbonds.com"
  },
  "agents": [
    { "agentId": 101, "name": "John Smith", "email": "john@abetterbailbonds.com", "active": true },
    { "agentId": 102, "name": "Jane Doe", "email": "jane@abetterbailbonds.com", "active": true }
  ],
  "facilities": [
    { "facilityId": 501, "name": "Adams County Detention", "city": "Brighton", "state": "CO" },
    { "facilityId": 502, "name": "Denver County Jail", "city": "Denver", "state": "CO" }
  ],
  "courts": [
    { "courtId": 601, "name": "Adams County Court", "city": "Brighton", "state": "CO" },
    { "courtId": 602, "name": "Denver County Court", "city": "Denver", "state": "CO" }
  ],
  "syncedAt": "2026-02-02T15:30:00Z"
}

SQL to call:
  EXEC dbo.usp_BondProspects_GetSyncData @CompanyID = 4228
*/


/*
===============================================================================
ENDPOINT 2: POST /api/bondprospects/submission
===============================================================================
Purpose: BondProspects calls this when a co-signer completes the e-sign forms
Called: Real-time, immediately after successful submission

Request:
  POST https://app.bailbooks.com/api/bondprospects/submission
  Headers:
    X-API-Key: bp_live_abc123xyz
    Content-Type: application/json

  Body:
{
  "intakeId": "cml5d451i000ao5g186h1bvuv",
  "linkCode": "ABC123XY",
  "companyId": 4228,
  "submittedAt": "2026-02-02T16:45:00Z",
  
  "defendant": {
    "firstName": "Daniel",
    "lastName": "Garcia",
    "dob": "1985-03-15",
    "ssn": "123-45-6789",
    "address": "456 Oak Ave",
    "city": "Denver",
    "state": "CO",
    "zip": "80203",
    "homePhone": "(303) 555-2345",
    "cellPhone": "(303) 555-3456",
    "email": "daniel.garcia@email.com",
    "employer": "ABC Construction",
    "occupation": "Foreman",
    "jailLocation": "Adams County Detention",
    "bookingNumber": "2026-12345",
    "arrestDate": "2026-01-30",
    "charges": "FTA, Child Abuse"
  },
  
  "indemnitor": {
    "firstName": "Sarah",
    "lastName": "Smith",
    "dob": "1988-07-22",
    "ssn": "987-65-4321",
    "relationship": "Spouse",
    "address": "456 Oak Ave",
    "city": "Denver",
    "state": "CO",
    "zip": "80203",
    "homePhone": "(303) 555-2345",
    "cellPhone": "(303) 555-4567",
    "email": "sarah.smith@email.com",
    "employer": "City Hospital",
    "position": "Nurse",
    "driversLicense": "123456789",
    "dlState": "CO"
  },
  
  "references": [
    {
      "name": "Bob Johnson",
      "relationship": "Father",
      "phone": "(303) 555-5678",
      "address": "789 Pine St, Denver, CO 80204"
    },
    {
      "name": "Mary Johnson", 
      "relationship": "Mother",
      "phone": "(303) 555-6789",
      "address": "789 Pine St, Denver, CO 80204"
    }
  ],
  
  "bonds": [
    {
      "amount": 12000.00,
      "premium": 1200.00,
      "bondDate": "2026-02-02",
      "postingFacility": "Adams County Detention",
      "returnCourt": "Boulder County Court",
      "caseNumber": "26CR5467",
      "charges": "FTA, Child Abuse",
      "agentName": "Chris"
    },
    {
      "amount": 500.00,
      "premium": 75.00,
      "bondDate": "2026-02-02",
      "postingFacility": "Adams County Detention",
      "returnCourt": "Adams County Court",
      "caseNumber": "NA",
      "charges": "Speeding no license",
      "agentName": "Chris"
    }
  ],
  
  "signatures": {
    "preApplication_coSigner": true,
    "referenceForm_applicant": true,
    "immigrationWaiver_coSigner": true,
    "indemnitorApplication_indemnitor": true,
    "immigrationBondAgreement_indemnitor": true
  },
  
  "pdfs": {
    "preApplication": "https://bondprospects.com/api/intake/ABC123XY/pdf/preApplication",
    "indemnitorApp": "https://bondprospects.com/api/intake/ABC123XY/pdf/indemnitorApp",
    "bondAgreement": "https://bondprospects.com/api/intake/ABC123XY/pdf/bondAgreement",
    "immigrationWaiver": "https://bondprospects.com/api/intake/ABC123XY/pdf/immigrationWaiver",
    "referenceForm": "https://bondprospects.com/api/intake/ABC123XY/pdf/referenceForm"
  }
}

Response (201 Created):
{
  "success": true,
  "customerId": 8890202,
  "prospectId": 12345,
  "message": "Submission received and prospect created"
}

SQL to call:
  EXEC dbo.usp_BondProspects_CreateProspect 
    @CompanyID = 4228,
    @BondProspectsIntakeID = 'cml5d451i000ao5g186h1bvuv',
    @DefendantFirstName = 'Daniel',
    @DefendantLastName = 'Garcia',
    -- ... etc
*/


/*
===============================================================================
ENDPOINT 3: GET /api/bondprospects/submission/{intakeId}/status
===============================================================================
Purpose: BondProspects can check if a submission was successfully processed
Called: Optional, for verification/retry logic

Request:
  GET https://app.bailbooks.com/api/bondprospects/submission/cml5d451i000ao5g186h1bvuv/status
  Headers:
    X-API-Key: bp_live_abc123xyz

Response (200 OK):
{
  "success": true,
  "intakeId": "cml5d451i000ao5g186h1bvuv",
  "status": "processed",
  "customerId": 8890202,
  "prospectId": 12345,
  "processedAt": "2026-02-02T16:45:05Z"
}
*/


-- ============================================================================
-- EXAMPLE C# CONTROLLER (for Sheeraz)
-- ============================================================================
/*
[ApiController]
[Route("api/bondprospects")]
public class BondProspectsController : ControllerBase
{
    private readonly IConfiguration _config;
    private readonly IDbConnection _db;
    
    [HttpGet("sync/{companyId}")]
    public async Task<IActionResult> GetSyncData(int companyId)
    {
        // Validate API key from header
        var apiKey = Request.Headers["X-API-Key"].FirstOrDefault();
        if (!ValidateApiKey(apiKey, companyId))
            return Unauthorized();
        
        // Call stored procedure
        var result = await _db.QueryMultipleAsync(
            "usp_BondProspects_GetSyncData",
            new { CompanyID = companyId },
            commandType: CommandType.StoredProcedure
        );
        
        var company = await result.ReadFirstOrDefaultAsync<CompanyDto>();
        var agents = await result.ReadAsync<AgentDto>();
        var facilities = await result.ReadAsync<FacilityDto>();
        var courts = await result.ReadAsync<CourtDto>();
        
        return Ok(new {
            success = true,
            company,
            agents,
            facilities,
            courts,
            syncedAt = DateTime.UtcNow
        });
    }
    
    [HttpPost("submission")]
    public async Task<IActionResult> ReceiveSubmission([FromBody] SubmissionDto submission)
    {
        // Validate API key
        var apiKey = Request.Headers["X-API-Key"].FirstOrDefault();
        if (!ValidateApiKey(apiKey, submission.CompanyId))
            return Unauthorized();
        
        // Call stored procedure to create prospect
        var result = await _db.QueryFirstOrDefaultAsync<CreateProspectResult>(
            "usp_BondProspects_CreateProspect",
            new {
                CompanyID = submission.CompanyId,
                BondProspectsIntakeID = submission.IntakeId,
                DefendantFirstName = submission.Defendant.FirstName,
                DefendantLastName = submission.Defendant.LastName,
                // ... map all other fields
            },
            commandType: CommandType.StoredProcedure
        );
        
        return Created("", new {
            success = true,
            customerId = result.CustomerID,
            prospectId = result.ProspectID,
            message = "Submission received and prospect created"
        });
    }
}
*/


-- ============================================================================
-- API KEY MANAGEMENT
-- ============================================================================
/*
For now, we can use CompanyID as the API key for simplicity.
Later, we should create a proper API keys table:

CREATE TABLE BondProspectsApiKeys (
    ApiKeyID INT IDENTITY(1,1) PRIMARY KEY,
    CompanyID INT NOT NULL FOREIGN KEY REFERENCES Companies(CompanyID),
    ApiKey NVARCHAR(100) NOT NULL UNIQUE,
    CreatedDate DATETIME2 DEFAULT GETDATE(),
    LastUsedDate DATETIME2 NULL,
    IsActive BIT DEFAULT 1,
    
    INDEX IX_ApiKey (ApiKey)
);

-- Generate API key for a company
INSERT INTO BondProspectsApiKeys (CompanyID, ApiKey)
VALUES (4228, 'bp_live_' + CONVERT(VARCHAR(32), NEWID()));
*/

PRINT 'API documentation complete. Share with Sheeraz/Ahsan for implementation.';
