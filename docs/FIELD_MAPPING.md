# Bail Bond Forms - Complete Field Mapping

## Overview
This document maps all fields from the source PDF/DOCX forms to the web application data model.

---

## Form 1: PRE-APPLICATION (1 page)

### Header
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Agent | text | No | Internal use - pre-filled by company |
| Office | text | No | Internal use - pre-filled by company |

### Co-Signer Information Section
| Field | Type | Required | Validation | DB Field |
|-------|------|----------|------------|----------|
| Name | text | Yes | Min 2 chars | indemnitor.fullName |
| Relation to Def. | text | Yes | | indemnitor.relationshipToDefendant |
| Home Phone | phone | No | Format: (XXX) XXX-XXXX | indemnitor.homePhone |
| Cell | phone | Yes | Format: (XXX) XXX-XXXX | indemnitor.cellPhone |
| Cell Phone Carrier | text | No | | indemnitor.cellCarrier |
| Work | phone | No | Format: (XXX) XXX-XXXX | indemnitor.workPhone |
| Email address | email | Yes | Valid email | indemnitor.email |
| D.O.B. | date | Yes | Must be 18+ | indemnitor.dob |
| Driver License or /I.D.# | text | Yes | | indemnitor.driversLicense |
| State Issued | select | Yes | US State dropdown | indemnitor.dlState |
| Current Address | text | Yes | | indemnitor.address |
| City | text | Yes | | indemnitor.city |
| State | select | Yes | | indemnitor.state |
| Zip | text | Yes | 5 or 9 digit | indemnitor.zip |
| How Long | text | No | Duration at address | indemnitor.addressDuration |
| Employer | text | No | | indemnitor.employer |
| Occupation | text | No | | indemnitor.occupation |
| How Long (employment) | text | No | | indemnitor.employmentDuration |
| Employer Address | text | No | | indemnitor.employerAddress |
| City, State Zip | text | No | | indemnitor.employerCityStateZip |
| Monthly Income | currency | No | | indemnitor.monthlyIncome |
| Personal Reference | text | No | | indemnitor.personalReference |
| Phone (reference) | phone | No | | indemnitor.personalReferencePhone |
| Address (reference) | text | No | | indemnitor.personalReferenceAddress |
| Vehicle Make | text | No | | indemnitor.vehicleMake |
| Vehicle Model | text | No | | indemnitor.vehicleModel |
| Vehicle Insurance Carrier | text | No | | indemnitor.vehicleInsurance |

### Defendant Information Section
| Field | Type | Required | Validation | DB Field |
|-------|------|----------|------------|----------|
| Name | text | Yes | Min 2 chars | defendant.fullName |
| AKA | text | No | Aliases | defendant.aka |
| Home Phone | phone | No | | defendant.homePhone |
| Cell/Pager | phone | No | | defendant.cellPhone |
| Work | phone | No | | defendant.workPhone |
| D.O.B. | date | Yes | | defendant.dob |
| S.S.# | ssn | No | Format: XXX-XX-XXXX | defendant.ssn |
| Driver License or I.D.# | text | No | | defendant.driversLicense |
| State Issued | select | No | | defendant.dlState |
| Address | text | Yes | | defendant.address |
| City | text | Yes | | defendant.city |
| Zip | text | Yes | | defendant.zip |
| How Long | text | No | | defendant.addressDuration |
| Employer | text | No | | defendant.employer |
| Occupation | text | No | | defendant.occupation |
| How Long (employment) | text | No | | defendant.employmentDuration |
| Employer Address | text | No | | defendant.employerAddress |
| City, State, Zip | text | No | | defendant.employerCityStateZip |
| Monthly Income | currency | No | | defendant.monthlyIncome |
| Personal Reference | text | No | | defendant.personalReference |
| Phone (reference) | phone | No | | defendant.personalReferencePhone |
| Address (reference) | text | No | | defendant.personalReferenceAddress |
| Date Arrested | date | No | | defendant.arrestDate |
| Co-Defendants | text | No | | defendant.coDefendants |
| Where Arrested | text | No | | defendant.arrestLocation |
| Arresting Agency | text | No | | defendant.arrestingAgency |
| Vehicle Make | text | No | | defendant.vehicleMake |
| Vehicle Model | text | No | | defendant.vehicleModel |
| Vehicle Insurance Carrier | text | No | | defendant.vehicleInsurance |
| Currently On | checkbox | No | Probation/Parole/None | defendant.supervisionStatus |
| Probation or Parole Officer | text | No | | defendant.supervisionOfficer |
| Phone (officer) | phone | No | | defendant.supervisionOfficerPhone |

### Signatures Section
| Field | Type | Required |
|-------|------|----------|
| Co-Signer's Signature | signature | Yes |
| Co-Signer Date | date | Auto |
| Defendant's Signature | signature | Yes |
| Defendant Date | date | Auto |

### Internal Use Only (For A BETTER Reps Only)
| Field | Type | Notes |
|-------|------|-------|
| Approved By | text | Agent fills |
| Quote(s): $ | currency | Agent fills |
| Approval Date | date | Agent fills |
| Quoted by | text | Agent fills |
| Additional Requirements | text | Agent fills |

---

## Form 2: BAIL BOND APPLICATION - INDEMNITOR (3 pages)

### Page 1: Defendant Info Section
| Field | Type | Required | DB Field |
|-------|------|----------|----------|
| Defendant Name | text | Yes | defendant.fullName |
| Birth Date | date | Yes | defendant.dob |
| Charges | text | Yes | bond.charges |
| Appearance Date | date | No | bond.appearanceDate |
| Case Number | text | No | bond.caseNumber |
| Court Name | text | No | bond.courtName |
| Jail Location | text | No | defendant.jailLocation |
| County | text | No | defendant.jailCounty |
| Booking Number | text | No | defendant.bookingNumber |

### Page 1: Indemnitor Information Section
| Field | Type | Required | DB Field |
|-------|------|----------|----------|
| Indemnitor Name | text | Yes | indemnitor.fullName |
| My friends / family know me as | text | No | indemnitor.nickname |
| Home Phone Number | phone | No | indemnitor.homePhone |
| Cell Phone Number | phone | Yes | indemnitor.cellPhone |
| Work Phone Number | phone | No | indemnitor.workPhone |
| Relationship to Defendant | text | Yes | indemnitor.relationshipToDefendant |
| Email | email | Yes | indemnitor.email |
| Current Full Address, City, State and Zip | text | Yes | indemnitor.fullAddress |
| Own/Rent | radio | Yes | indemnitor.ownershipStatus |
| From (date) | date | No | indemnitor.addressFromDate |
| To (date) | date | No | indemnitor.addressToDate |
| Landlord Name (if applicable) | text | No | indemnitor.landlordName |
| Landlord Phone Number | phone | No | indemnitor.landlordPhone |
| Former Full Address, City, State and Zip | text | No | indemnitor.formerAddress |
| Former Own/Rent | radio | No | indemnitor.formerOwnershipStatus |
| Former From (date) | date | No | indemnitor.formerAddressFromDate |
| Former To (date) | date | No | indemnitor.formerAddressToDate |
| Former Landlord Name | text | No | indemnitor.formerLandlordName |
| Former Landlord Phone Number | phone | No | indemnitor.formerLandlordPhone |
| Gender (M/F) | radio | Yes | indemnitor.gender |
| Birth Date | date | Yes | indemnitor.dob |
| Birth Place | text | No | indemnitor.birthPlace |
| Social Security Number | ssn | Yes | indemnitor.ssn |
| Driver's License / ID Number | text | Yes | indemnitor.driversLicense |
| State Issued | select | Yes | indemnitor.dlState |
| U.S. citizen? | radio | Yes | indemnitor.usCitizen |
| Alien Number | text | Conditional | indemnitor.alienNumber |
| How long in US? | text | Conditional | indemnitor.yearsInUS |
| Additional Notes | textarea | No | indemnitor.notes |

### Page 1: Employment Section
| Field | Type | Required | DB Field |
|-------|------|----------|----------|
| Employer | text | No | indemnitor.employer |
| Position | text | No | indemnitor.position |
| How Long | text | No | indemnitor.employmentDuration |
| Supervisor's Name | phone | No | indemnitor.supervisorName |
| Phone Number | phone | No | indemnitor.employerPhone |
| Union | text | No | indemnitor.union |
| Local Number | text | No | indemnitor.unionLocalNumber |
| Military Branch | text | No | indemnitor.militaryBranch |
| Active (Yes/No) | radio | No | indemnitor.militaryActive |
| Discharge Date | date | No | indemnitor.militaryDischargeDate |

### Page 1: Social Section
| Field | Type | Required | DB Field |
|-------|------|----------|----------|
| Facebook Username | text | No | indemnitor.facebookUsername |
| Facebook Password | password | No | indemnitor.facebookPassword |
| Twitter Username | text | No | indemnitor.twitterUsername |
| Twitter Password | password | No | indemnitor.twitterPassword |
| LinkedIn Username | text | No | indemnitor.linkedinUsername |
| LinkedIn Password | password | No | indemnitor.linkedinPassword |
| Other Account | text | No | indemnitor.otherSocialAccount |
| Other Username | text | No | indemnitor.otherSocialUsername |
| Other Password | password | No | indemnitor.otherSocialPassword |

### Page 2: Financial Section
| Field | Type | Required | DB Field |
|-------|------|----------|----------|
| Cash on hand ($) | currency | No | indemnitor.cashOnHand |
| Cash in bank ($) | currency | No | indemnitor.cashInBank |
| Monthly Salary or Wages ($) | currency | No | indemnitor.monthlySalary |
| Real Estate Value($) | currency | No | indemnitor.realEstateValue |
| Real Estate Mortgage ($) | currency | No | indemnitor.realEstateMortgage |
| Title Name | text | No | indemnitor.realEstateTitleName |

### Page 2: Vehicle Section
| Field | Type | Required | DB Field |
|-------|------|----------|----------|
| Year | text | No | indemnitor.vehicleYear |
| Make | text | No | indemnitor.vehicleMake |
| Model | text | No | indemnitor.vehicleModel |
| Color | text | No | indemnitor.vehicleColor |
| Plate Number | text | No | indemnitor.vehiclePlate |
| State | select | No | indemnitor.vehicleState |
| Financing company | text | No | indemnitor.vehicleFinanceCompany |
| Balance owed | currency | No | indemnitor.vehicleBalanceOwed |

### Page 2: Marital Status Section
| Field | Type | Required | DB Field |
|-------|------|----------|----------|
| Marital Status | radio | Yes | Single/Married/Cohabitating/Separated/Divorced/Widowed |
| Significant Other Name | text | Conditional | indemnitor.spouseName |
| Significant Other Email | email | No | indemnitor.spouseEmail |
| Significant Other DOB | date | No | indemnitor.spouseDob |
| Significant Other Full Address | text | No | indemnitor.spouseAddress |
| Years together | text | No | indemnitor.yearsTogether |
| Significant Other Phone Number | phone | No | indemnitor.spousePhone |
| Significant Other Mother Name | text | No | indemnitor.spouseMotherName |
| Significant Other Mother DOB | date | No | indemnitor.spouseMotherDob |
| Significant Other Mother Phone | phone | No | indemnitor.spouseMotherPhone |
| Significant Other Father Name | text | No | indemnitor.spouseFatherName |
| Significant Other Father DOB | date | No | indemnitor.spouseFatherDob |
| Significant Other Father Phone | phone | No | indemnitor.spouseFatherPhone |
| Former Significant Other Name | text | No | indemnitor.formerSpouseName |
| Former Significant Other Email | email | No | indemnitor.formerSpouseEmail |
| Former Significant Other DOB | date | No | indemnitor.formerSpouseDob |
| Former Significant Other Address | text | No | indemnitor.formerSpouseAddress |
| Years together (former) | text | No | indemnitor.formerYearsTogether |
| Former Significant Other Phone | phone | No | indemnitor.formerSpousePhone |

### Page 2: References Section (3 references)
| Field | Type | Required | DB Field |
|-------|------|----------|----------|
| Reference Name | text | Yes | references[n].name |
| Reference DOB | date | No | references[n].dob |
| Relationship to Indemnitor | text | Yes | references[n].relationship |
| Full Address, City, State and Zip | text | No | references[n].fullAddress |
| Cell Phone Number | phone | Yes | references[n].cellPhone |
| Work Phone Number | phone | No | references[n].workPhone |

### Page 2: Authorized Signatures Section
| Field | Type | Required |
|-------|------|----------|
| Signed, sealed and delivered this (date) | date | Yes |
| Indemnitor Signature | signature | Yes |
| Indemnitor Print Name | text | Yes |
| Driver's License Number | text | Yes (repeat) |
| Social Security Number | ssn | Yes (repeat) |
| Birth Date | date | Yes (repeat) |

### Page 3: Fraud Warnings
No input fields - just display text for various state fraud warnings.

---

## Form 3: IMMIGRATION BOND AGREEMENT (2 pages)

### Agreement Details Section
| Field | Type | Required | DB Field |
|-------|------|----------|----------|
| Alien Name | text | Yes | defendant.fullName |
| Alien Address | text | Yes | defendant.fullAddress |
| Alien Number | text | Yes | defendant.alienNumber |
| Power Number | text | No | bond.powerNumber |
| Total Bond Amount $ | currency | Yes | bond.amount |
| Total Premium $ | currency | Yes | bond.premium |
| Indemnitor Name | text | Yes | indemnitor.fullName |
| Indemnitor Address | text | Yes | indemnitor.fullAddress |

### Signature Section
| Field | Type | Required |
|-------|------|----------|
| Signed, sealed and delivered this (date) | date | Yes |
| Indemnitor Signature | signature | Yes |
| Print Name | text | Yes |

### Page 2: Terms and Conditions
No input fields - display only (sections 5-13)

---

## Form 4: IMMIGRATION WAIVER (1 page)

### English Section
| Field | Type | Required | DB Field |
|-------|------|----------|----------|
| Co-signer name | text | Yes | indemnitor.fullName |
| Person in custody (defendant) | text | Yes | defendant.fullName |
| Co-signer Signature | signature | Yes | |
| Date | date | Auto | |
| SUBSCRIBED day | text | No | Notary fills |
| SUBSCRIBED month/year | text | No | Notary fills |

### Spanish Section (Duplicate fields)
| Field | Type | Required |
|-------|------|----------|
| Persona responsable | text | Yes (copy from English) |
| Persona en carcel | text | Yes (copy from English) |
| Persona Responsable Signature | signature | Yes |
| Fecha | date | Auto |

---

## Form 5: REFERENCE FORM (Word Doc)

### Header
| Field | Type | Required | DB Field |
|-------|------|----------|----------|
| Applicant | text | Yes | indemnitor.fullName |
| Defendant | text | Yes | defendant.fullName |
| Office | text | No | Pre-filled |
| Bond Amt | currency | No | bond.amount |
| Bonding Agent | text | No | agent.name |

### References (5 entries)
| Field | Type | Required | DB Field |
|-------|------|----------|----------|
| Name | text | Yes | references[n].name |
| Relationship | text | Yes | references[n].relationship |
| Phone | phone | Yes | references[n].phone |
| Address | text | No | references[n].address |
| City/State | text | No | references[n].cityState |
| Zip | text | No | references[n].zip |
| Verifier | text | No | Internal use |
| Notes | text | No | Internal use |

### Certification
| Field | Type | Required |
|-------|------|----------|
| Applicant's Signature | signature | Yes |
| Date | date | Auto |
| Verified By | text | No (internal) |
| Verification Date | date | No (internal) |

---

## Consolidated Data Model

### Defendant Object
```json
{
  "fullName": "string",
  "firstName": "string",
  "lastName": "string",
  "aka": "string",
  "dob": "date",
  "ssn": "string",
  "gender": "M|F",
  "driversLicense": "string",
  "dlState": "string",
  "address": "string",
  "city": "string",
  "state": "string",
  "zip": "string",
  "fullAddress": "string",
  "addressDuration": "string",
  "homePhone": "string",
  "cellPhone": "string",
  "workPhone": "string",
  "email": "string",
  "employer": "string",
  "occupation": "string",
  "employmentDuration": "string",
  "employerAddress": "string",
  "employerCityStateZip": "string",
  "monthlyIncome": "number",
  "personalReference": "string",
  "personalReferencePhone": "string",
  "personalReferenceAddress": "string",
  "vehicleMake": "string",
  "vehicleModel": "string",
  "vehicleInsurance": "string",
  "arrestDate": "date",
  "arrestLocation": "string",
  "arrestingAgency": "string",
  "coDefendants": "string",
  "jailLocation": "string",
  "jailCounty": "string",
  "bookingNumber": "string",
  "supervisionStatus": "Probation|Parole|None",
  "supervisionOfficer": "string",
  "supervisionOfficerPhone": "string",
  "alienNumber": "string",
  "usCitizen": "boolean"
}
```

### Indemnitor Object
```json
{
  "fullName": "string",
  "firstName": "string",
  "lastName": "string",
  "nickname": "string",
  "relationshipToDefendant": "string",
  "dob": "date",
  "ssn": "string",
  "gender": "M|F",
  "birthPlace": "string",
  "driversLicense": "string",
  "dlState": "string",
  "usCitizen": "boolean",
  "alienNumber": "string",
  "yearsInUS": "string",
  "address": "string",
  "city": "string",
  "state": "string",
  "zip": "string",
  "fullAddress": "string",
  "addressDuration": "string",
  "addressFromDate": "date",
  "addressToDate": "date",
  "ownershipStatus": "Own|Rent",
  "landlordName": "string",
  "landlordPhone": "string",
  "formerAddress": "string",
  "formerOwnershipStatus": "Own|Rent",
  "formerAddressFromDate": "date",
  "formerAddressToDate": "date",
  "formerLandlordName": "string",
  "formerLandlordPhone": "string",
  "homePhone": "string",
  "cellPhone": "string",
  "workPhone": "string",
  "cellCarrier": "string",
  "email": "string",
  "employer": "string",
  "position": "string",
  "occupation": "string",
  "employmentDuration": "string",
  "employerAddress": "string",
  "employerCityStateZip": "string",
  "employerPhone": "string",
  "supervisorName": "string",
  "monthlyIncome": "number",
  "monthlySalary": "number",
  "union": "string",
  "unionLocalNumber": "string",
  "militaryBranch": "string",
  "militaryActive": "boolean",
  "militaryDischargeDate": "date",
  "maritalStatus": "Single|Married|Cohabitating|Separated|Divorced|Widowed",
  "spouseName": "string",
  "spouseEmail": "string",
  "spouseDob": "date",
  "spouseAddress": "string",
  "spousePhone": "string",
  "yearsTogether": "string",
  "cashOnHand": "number",
  "cashInBank": "number",
  "realEstateValue": "number",
  "realEstateMortgage": "number",
  "realEstateTitleName": "string",
  "vehicleYear": "string",
  "vehicleMake": "string",
  "vehicleModel": "string",
  "vehicleColor": "string",
  "vehiclePlate": "string",
  "vehicleState": "string",
  "vehicleFinanceCompany": "string",
  "vehicleBalanceOwed": "number",
  "vehicleInsurance": "string",
  "personalReference": "string",
  "personalReferencePhone": "string",
  "personalReferenceAddress": "string",
  "socialMedia": {
    "facebook": { "username": "string", "password": "string" },
    "twitter": { "username": "string", "password": "string" },
    "linkedin": { "username": "string", "password": "string" },
    "other": { "platform": "string", "username": "string", "password": "string" }
  },
  "notes": "string"
}
```

### Reference Object
```json
{
  "name": "string",
  "relationship": "string",
  "phone": "string",
  "workPhone": "string",
  "address": "string",
  "city": "string",
  "state": "string",
  "zip": "string",
  "fullAddress": "string",
  "dob": "date"
}
```

### Bond Object
```json
{
  "amount": "number",
  "premium": "number",
  "powerNumber": "string",
  "charges": "string",
  "caseNumber": "string",
  "courtName": "string",
  "appearanceDate": "date"
}
```

### Signatures Object
```json
{
  "defendantSignature": "base64 PNG",
  "defendantSignedAt": "datetime",
  "indemnitorSignature": "base64 PNG",
  "indemnitorSignedAt": "datetime",
  "waiverSignature": "base64 PNG",
  "waiverSignedAt": "datetime"
}
```

---

## Form Wizard Steps

### Step 1: Basic Information
- Defendant name, DOB, contact info
- Indemnitor name, DOB, contact info, relationship

### Step 2: Defendant Details
- Full defendant info (address, employment, arrest details)

### Step 3: Indemnitor Details
- Full indemnitor info (address, employment, financial)

### Step 4: References
- 3-5 references with contact information

### Step 5: Review & Agreement
- Display Immigration Bond Agreement terms
- Checkbox: "I have read and agree to the terms"

### Step 6: Signatures
- E-signature capture for all required signatures
- Immigration Waiver acknowledgment

### Step 7: Confirmation
- Summary of submission
- Download PDFs button
- "Your agent will contact you shortly"
