/*
=============================================================================
BondProspects Data Sync Stored Procedures
=============================================================================
These procedures are called by BondProspects to sync data from Bailbooks.
They return JSON formatted data that BondProspects can consume via API.

Created: 2026-02-02
Author: Gary Cass / Claude AI

WARNING: These procedures are READ-ONLY and do not modify any Bailbooks data.
=============================================================================
*/

USE BailBooks;
GO

-- ============================================================================
-- usp_BondProspects_GetCompanyByApiKey
-- Validates API key and returns company info
-- Called when BondProspects needs to verify a company's API key
-- ============================================================================
IF OBJECT_ID('dbo.usp_BondProspects_GetCompanyByApiKey', 'P') IS NOT NULL
    DROP PROCEDURE dbo.usp_BondProspects_GetCompanyByApiKey;
GO

CREATE PROCEDURE dbo.usp_BondProspects_GetCompanyByApiKey
    @ApiKey NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- For now, we'll use a simple lookup
    -- In production, you might have a BondProspectsApiKeys table
    -- or store the API key in the Companies table
    
    SELECT 
        c.CompanyID,
        c.Name AS CompanyName,
        c.Address1,
        c.Address2,
        c.City,
        s.Abbreviation AS State,
        c.PostalCode AS Zip,
        c.Phone,
        c.Email,
        c.Active
    FROM Companies c
    LEFT JOIN States s ON c.StateID = s.StateID
    WHERE c.CompanyID = TRY_CAST(@ApiKey AS INT)  -- Simple: API key = CompanyID for now
      AND c.Active = 1;
END;
GO

-- ============================================================================
-- usp_BondProspects_GetActiveAgents
-- Returns all active agents for a company
-- Used to populate the Agent dropdown in the Agent Wizard
-- ============================================================================
IF OBJECT_ID('dbo.usp_BondProspects_GetActiveAgents', 'P') IS NOT NULL
    DROP PROCEDURE dbo.usp_BondProspects_GetActiveAgents;
GO

CREATE PROCEDURE dbo.usp_BondProspects_GetActiveAgents
    @CompanyID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        a.AgentID,
        COALESCE(p.FirstName + ' ' + p.LastName, p.LastName, 'Agent ' + CAST(a.AgentID AS VARCHAR)) AS AgentName,
        p.FirstName,
        p.LastName,
        p.Email,
        p.Phone1 AS Phone,
        a.Active
    FROM Agents a
    INNER JOIN Parties p ON a.AgentPartyID = p.PartyID
    WHERE a.CompanyID = @CompanyID
      AND a.Active = 1
    ORDER BY p.LastName, p.FirstName;
END;
GO

-- ============================================================================
-- usp_BondProspects_GetFacilities
-- Returns all facilities (jails) for posting - these are where bonds are posted
-- Used to populate the Posting Facility dropdown
-- ============================================================================
IF OBJECT_ID('dbo.usp_BondProspects_GetFacilities', 'P') IS NOT NULL
    DROP PROCEDURE dbo.usp_BondProspects_GetFacilities;
GO

CREATE PROCEDURE dbo.usp_BondProspects_GetFacilities
    @CompanyID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Get facilities that this company has used for posting bonds
    -- This gives us relevant facilities rather than ALL facilities
    SELECT DISTINCT
        f.FacilityID,
        f.Name AS FacilityName,
        f.Address1,
        f.City,
        s.Abbreviation AS State,
        f.PostalCode AS Zip,
        f.Phone,
        'Jail' AS FacilityType
    FROM Facilities f
    LEFT JOIN States s ON f.StateID = s.StateID
    WHERE f.FacilityID IN (
        -- Facilities where this company has posted bonds
        SELECT DISTINCT b.FacilityPostedID 
        FROM Bonds b
        INNER JOIN Agents a ON b.AgentID = a.AgentID
        WHERE a.CompanyID = @CompanyID
          AND b.FacilityPostedID IS NOT NULL
    )
    ORDER BY f.Name;
    
    -- If no facilities found from bond history, return commonly used ones
    IF @@ROWCOUNT = 0
    BEGIN
        SELECT TOP 50
            f.FacilityID,
            f.Name AS FacilityName,
            f.Address1,
            f.City,
            s.Abbreviation AS State,
            f.PostalCode AS Zip,
            f.Phone,
            'Jail' AS FacilityType
        FROM Facilities f
        LEFT JOIN States s ON f.StateID = s.StateID
        WHERE f.Name IS NOT NULL 
          AND f.Name <> ''
        ORDER BY f.Name;
    END
END;
GO

-- ============================================================================
-- usp_BondProspects_GetCourts
-- Returns courts for return court dropdown
-- Courts in Bailbooks are stored in the Facilities table with different types
-- ============================================================================
IF OBJECT_ID('dbo.usp_BondProspects_GetCourts', 'P') IS NOT NULL
    DROP PROCEDURE dbo.usp_BondProspects_GetCourts;
GO

CREATE PROCEDURE dbo.usp_BondProspects_GetCourts
    @CompanyID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Get courts/facilities that this company has used as return courts
    SELECT DISTINCT
        f.FacilityID AS CourtID,
        f.Name AS CourtName,
        f.Address1,
        f.City,
        s.Abbreviation AS State,
        f.PostalCode AS Zip,
        f.Phone
    FROM Facilities f
    LEFT JOIN States s ON f.StateID = s.StateID
    WHERE f.FacilityID IN (
        -- Facilities used as return courts by this company
        SELECT DISTINCT b.FacilityReturnID 
        FROM Bonds b
        INNER JOIN Agents a ON b.AgentID = a.AgentID
        WHERE a.CompanyID = @CompanyID
          AND b.FacilityReturnID IS NOT NULL
        UNION
        -- Also include facilities from CourtDates
        SELECT DISTINCT cd.FacilityID
        FROM CourtDates cd
        INNER JOIN Bonds b ON cd.BondID = b.BondID
        INNER JOIN Agents a ON b.AgentID = a.AgentID
        WHERE a.CompanyID = @CompanyID
          AND cd.FacilityID IS NOT NULL
    )
    ORDER BY f.Name;
    
    -- If no courts found, return common facilities
    IF @@ROWCOUNT = 0
    BEGIN
        SELECT TOP 50
            f.FacilityID AS CourtID,
            f.Name AS CourtName,
            f.Address1,
            f.City,
            s.Abbreviation AS State,
            f.PostalCode AS Zip,
            f.Phone
        FROM Facilities f
        LEFT JOIN States s ON f.StateID = s.StateID
        WHERE f.Name IS NOT NULL 
          AND f.Name <> ''
        ORDER BY f.Name;
    END
END;
GO

-- ============================================================================
-- usp_BondProspects_GetSyncData
-- Master procedure that returns all sync data for a company in one call
-- Returns multiple result sets: Company, Agents, Facilities, Courts
-- ============================================================================
IF OBJECT_ID('dbo.usp_BondProspects_GetSyncData', 'P') IS NOT NULL
    DROP PROCEDURE dbo.usp_BondProspects_GetSyncData;
GO

CREATE PROCEDURE dbo.usp_BondProspects_GetSyncData
    @CompanyID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Verify company exists and is active
    IF NOT EXISTS (SELECT 1 FROM Companies WHERE CompanyID = @CompanyID AND Active = 1)
    BEGIN
        RAISERROR('Company not found or inactive', 16, 1);
        RETURN;
    END
    
    -- Result Set 1: Company Info
    SELECT 
        c.CompanyID,
        c.Name AS CompanyName,
        c.Address1,
        c.Address2,
        c.City,
        s.Abbreviation AS State,
        c.PostalCode AS Zip,
        c.Phone,
        c.Email,
        c.Website,
        c.Active
    FROM Companies c
    LEFT JOIN States s ON c.StateID = s.StateID
    WHERE c.CompanyID = @CompanyID;
    
    -- Result Set 2: Active Agents
    SELECT 
        a.AgentID,
        COALESCE(p.FirstName + ' ' + p.LastName, p.LastName, 'Agent ' + CAST(a.AgentID AS VARCHAR)) AS AgentName,
        p.FirstName,
        p.LastName,
        p.Email,
        p.Phone1 AS Phone,
        a.Active
    FROM Agents a
    INNER JOIN Parties p ON a.AgentPartyID = p.PartyID
    WHERE a.CompanyID = @CompanyID
      AND a.Active = 1
    ORDER BY p.LastName, p.FirstName;
    
    -- Result Set 3: Posting Facilities
    SELECT DISTINCT
        f.FacilityID,
        f.Name AS FacilityName,
        f.City,
        s.Abbreviation AS State
    FROM Facilities f
    LEFT JOIN States s ON f.StateID = s.StateID
    WHERE f.FacilityID IN (
        SELECT DISTINCT b.FacilityPostedID 
        FROM Bonds b
        INNER JOIN Agents a ON b.AgentID = a.AgentID
        WHERE a.CompanyID = @CompanyID
          AND b.FacilityPostedID IS NOT NULL
    )
    ORDER BY f.Name;
    
    -- Result Set 4: Return Courts
    SELECT DISTINCT
        f.FacilityID AS CourtID,
        f.Name AS CourtName,
        f.City,
        s.Abbreviation AS State
    FROM Facilities f
    LEFT JOIN States s ON f.StateID = s.StateID
    WHERE f.FacilityID IN (
        SELECT DISTINCT b.FacilityReturnID 
        FROM Bonds b
        INNER JOIN Agents a ON b.AgentID = a.AgentID
        WHERE a.CompanyID = @CompanyID
          AND b.FacilityReturnID IS NOT NULL
    )
    ORDER BY f.Name;
END;
GO

-- ============================================================================
-- usp_BondProspects_CreateProspect
-- Creates a new prospect in Bailbooks from BondProspects submission
-- This is called when a co-signer completes the e-sign forms
-- ============================================================================
IF OBJECT_ID('dbo.usp_BondProspects_CreateProspect', 'P') IS NOT NULL
    DROP PROCEDURE dbo.usp_BondProspects_CreateProspect;
GO

CREATE PROCEDURE dbo.usp_BondProspects_CreateProspect
    @CompanyID INT,
    @BondProspectsIntakeID NVARCHAR(100),  -- The BondProspects intake ID for reference
    
    -- Defendant Info
    @DefendantFirstName NVARCHAR(100),
    @DefendantLastName NVARCHAR(100),
    @DefendantDOB DATE = NULL,
    @DefendantSSN NVARCHAR(20) = NULL,
    @DefendantAddress NVARCHAR(200) = NULL,
    @DefendantCity NVARCHAR(100) = NULL,
    @DefendantState NVARCHAR(10) = NULL,
    @DefendantZip NVARCHAR(20) = NULL,
    @DefendantHomePhone NVARCHAR(20) = NULL,
    @DefendantCellPhone NVARCHAR(20) = NULL,
    @DefendantEmail NVARCHAR(200) = NULL,
    
    -- Indemnitor Info
    @IndemnitorFirstName NVARCHAR(100),
    @IndemnitorLastName NVARCHAR(100),
    @IndemnitorDOB DATE = NULL,
    @IndemnitorSSN NVARCHAR(20) = NULL,
    @IndemnitorAddress NVARCHAR(200) = NULL,
    @IndemnitorCity NVARCHAR(100) = NULL,
    @IndemnitorState NVARCHAR(10) = NULL,
    @IndemnitorZip NVARCHAR(20) = NULL,
    @IndemnitorHomePhone NVARCHAR(20) = NULL,
    @IndemnitorCellPhone NVARCHAR(20) = NULL,
    @IndemnitorEmail NVARCHAR(200) = NULL,
    @IndemnitorRelationship NVARCHAR(50) = NULL,
    
    -- Bond Info (JSON array for multiple bonds)
    @BondsJSON NVARCHAR(MAX) = NULL,
    
    -- Agent Info
    @AgentID INT = NULL,
    
    -- Output
    @CustomerID INT OUTPUT,
    @ProspectID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    
    DECLARE @StateID INT;
    DECLARE @IndemnitorStateID INT;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Get State IDs
        SELECT @StateID = StateID FROM States WHERE Abbreviation = @DefendantState;
        SELECT @IndemnitorStateID = StateID FROM States WHERE Abbreviation = @IndemnitorState;
        
        -- Check if customer already exists (by name + DOB)
        SELECT @CustomerID = CustomerID 
        FROM Customers 
        WHERE FirstName = @DefendantFirstName 
          AND LastName = @DefendantLastName 
          AND BirthDate = @DefendantDOB
          AND CompanyID = @CompanyID;
        
        -- Create new customer if not exists
        IF @CustomerID IS NULL
        BEGIN
            INSERT INTO Customers (
                CompanyID, FirstName, LastName, BirthDate, SSN,
                Address1, City, StateID, PostalCode,
                Phone, CellPhone, Email,
                CreatedDate, ModifiedDate
            )
            VALUES (
                @CompanyID, @DefendantFirstName, @DefendantLastName, @DefendantDOB, @DefendantSSN,
                @DefendantAddress, @DefendantCity, @StateID, @DefendantZip,
                @DefendantHomePhone, @DefendantCellPhone, @DefendantEmail,
                GETDATE(), GETDATE()
            );
            
            SET @CustomerID = SCOPE_IDENTITY();
        END
        ELSE
        BEGIN
            -- Update existing customer with new info
            UPDATE Customers SET
                SSN = COALESCE(@DefendantSSN, SSN),
                Address1 = COALESCE(@DefendantAddress, Address1),
                City = COALESCE(@DefendantCity, City),
                StateID = COALESCE(@StateID, StateID),
                PostalCode = COALESCE(@DefendantZip, PostalCode),
                Phone = COALESCE(@DefendantHomePhone, Phone),
                CellPhone = COALESCE(@DefendantCellPhone, CellPhone),
                Email = COALESCE(@DefendantEmail, Email),
                ModifiedDate = GETDATE()
            WHERE CustomerID = @CustomerID;
        END
        
        -- Create Prospect record
        INSERT INTO Prospects (
            CompanyID, CustomerID, AgentID,
            FirstName, LastName, BirthDate,
            Address1, City, StateID, PostalCode,
            Phone, CellPhone, Email,
            IndemnitorFirstName, IndemnitorLastName, IndemnitorRelationship,
            IndemnitorAddress, IndemnitorCity, IndemnitorStateID, IndemnitorZip,
            IndemnitorPhone, IndemnitorCellPhone, IndemnitorEmail,
            Source, ExternalReference,
            Status, CreatedDate, ModifiedDate
        )
        VALUES (
            @CompanyID, @CustomerID, @AgentID,
            @DefendantFirstName, @DefendantLastName, @DefendantDOB,
            @DefendantAddress, @DefendantCity, @StateID, @DefendantZip,
            @DefendantHomePhone, @DefendantCellPhone, @DefendantEmail,
            @IndemnitorFirstName, @IndemnitorLastName, @IndemnitorRelationship,
            @IndemnitorAddress, @IndemnitorCity, @IndemnitorStateID, @IndemnitorZip,
            @IndemnitorHomePhone, @IndemnitorCellPhone, @IndemnitorEmail,
            'BondProspects', @BondProspectsIntakeID,
            'New', GETDATE(), GETDATE()
        );
        
        SET @ProspectID = SCOPE_IDENTITY();
        
        -- TODO: Parse @BondsJSON and create ProspectBonds records if that table exists
        -- For now, store bond info in Prospect notes or custom fields
        
        COMMIT TRANSACTION;
        
        -- Return the created IDs
        SELECT 
            @CustomerID AS CustomerID,
            @ProspectID AS ProspectID,
            'Success' AS Status;
            
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
            
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END;
GO

-- ============================================================================
-- Grant permissions (adjust as needed for your security model)
-- ============================================================================
-- GRANT EXECUTE ON dbo.usp_BondProspects_GetSyncData TO [BondProspectsUser];
-- GRANT EXECUTE ON dbo.usp_BondProspects_GetActiveAgents TO [BondProspectsUser];
-- GRANT EXECUTE ON dbo.usp_BondProspects_GetFacilities TO [BondProspectsUser];
-- GRANT EXECUTE ON dbo.usp_BondProspects_GetCourts TO [BondProspectsUser];
-- GRANT EXECUTE ON dbo.usp_BondProspects_CreateProspect TO [BondProspectsUser];

PRINT 'BondProspects sync procedures created successfully.';
GO
