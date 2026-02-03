/**
 * Form Templates Service
 * Generates HTML forms that look like the original bail bond documents
 * For: A Better Bail Bonds (pilot company)
 */

// Company info for A Better Bail Bonds
const COMPANY_INFO = {
  name: 'A Better Bail Bond',
  address: '1416 WASHINGTON AVE',
  city: 'HOUSTON',
  state: 'TX',
  zip: '77002',
  phone: '713-635-8400',
  license: '#74504',
  surety: 'Allegheny Casualty Company'
};

/**
 * Format date as MM/DD/YYYY
 */
function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}/${d.getFullYear()}`;
}

/**
 * Format phone number
 */
function formatPhone(phone) {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

/**
 * Common CSS styles for all forms
 */
const commonStyles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  body {
    font-family: Arial, sans-serif;
    font-size: 11px;
    line-height: 1.3;
    color: #000;
    background: #fff;
  }
  .page {
    width: 8.5in;
    min-height: 11in;
    padding: 0.5in;
    margin: 0 auto;
    background: #fff;
    page-break-after: always;
  }
  .page:last-child {
    page-break-after: avoid;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 15px;
    border-bottom: 2px solid #f7941d;
    padding-bottom: 10px;
  }
  .logo-section {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .logo {
    width: 60px;
    height: 60px;
    background: #003366;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    font-size: 10px;
  }
  .company-name {
    font-size: 24px;
    font-weight: bold;
    color: #003366;
    font-style: italic;
  }
  .company-address {
    font-size: 9px;
    color: #666;
  }
  .form-title {
    font-size: 18px;
    font-weight: bold;
    font-style: italic;
    text-align: right;
  }
  .agent-info {
    text-align: right;
    font-size: 11px;
    margin-top: 5px;
  }
  .section {
    margin-bottom: 15px;
  }
  .section-title {
    background: #f7941d;
    color: #000;
    font-weight: bold;
    padding: 3px 8px;
    font-size: 10px;
    margin-bottom: 5px;
  }
  .section-title-blue {
    background: #003366;
    color: #fff;
  }
  .form-row {
    display: flex;
    gap: 10px;
    margin-bottom: 8px;
  }
  .form-field {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  .form-field.small {
    flex: 0.5;
  }
  .form-field.large {
    flex: 2;
  }
  .field-label {
    font-size: 9px;
    color: #333;
    margin-bottom: 2px;
  }
  .field-value {
    border-bottom: 1px solid #000;
    min-height: 18px;
    padding: 2px 4px;
    font-size: 11px;
  }
  .field-value.boxed {
    border: 1px solid #000;
    min-height: 22px;
  }
  .checkbox-row {
    display: flex;
    gap: 15px;
    align-items: center;
  }
  .checkbox-item {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .checkbox {
    width: 12px;
    height: 12px;
    border: 1px solid #000;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
  }
  .checkbox.checked::after {
    content: '✓';
  }
  .signature-section {
    margin-top: 20px;
    padding-top: 15px;
    border-top: 1px solid #ccc;
  }
  .signature-line {
    display: flex;
    align-items: flex-end;
    gap: 20px;
    margin-bottom: 15px;
  }
  .signature-box {
    flex: 1;
  }
  .signature-label {
    font-size: 9px;
    margin-bottom: 3px;
  }
  .signature-field {
    border-bottom: 1px solid #000;
    min-height: 40px;
    position: relative;
  }
  .signature-field img {
    max-height: 38px;
    max-width: 100%;
  }
  .date-field {
    width: 150px;
  }
  .terms {
    font-size: 9px;
    line-height: 1.4;
    margin-top: 10px;
  }
  .terms h4 {
    font-size: 10px;
    margin: 10px 0 5px 0;
  }
  .terms p {
    margin-bottom: 8px;
    text-align: justify;
  }
  .warning-box {
    border: 2px solid #f7941d;
    background: #fff8e1;
    padding: 8px;
    margin-bottom: 15px;
    font-weight: bold;
    text-align: center;
    font-size: 10px;
    color: #c00;
  }
  .footer {
    position: absolute;
    bottom: 0.3in;
    left: 0.5in;
    right: 0.5in;
    font-size: 8px;
    display: flex;
    justify-content: space-between;
    border-top: 1px solid #ccc;
    padding-top: 5px;
  }
  @media print {
    .page {
      margin: 0;
      padding: 0.4in;
    }
  }
`;

/**
 * Generate PRE-APPLICATION form
 */
export function generatePreApplication(data, signatures = {}) {
  const { defendant = {}, indemnitor = {}, bond = {}, company = COMPANY_INFO } = data;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Pre-Application - ${defendant.firstName || ''} ${defendant.lastName || ''}</title>
  <style>${commonStyles}</style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="logo-section">
        <div style="font-size: 28px; font-weight: bold; font-style: italic; color: #003366;">
          <em>A Better Bail Bond & Insurance</em>
        </div>
      </div>
      <div class="form-title">
        PRE - APPLICATION
      </div>
    </div>
    
    <div class="form-row" style="justify-content: space-between; margin-bottom: 20px;">
      <div class="form-field">
        <span class="field-label">Agent</span>
        <div class="field-value">${bond.agentName || ''}</div>
      </div>
      <div class="form-field">
        <span class="field-label">Office</span>
        <div class="field-value">${company.name || ''}</div>
      </div>
    </div>
    
    <h3 style="text-decoration: underline; margin-bottom: 15px;">Co-Signer Information</h3>
    
    <div class="form-row">
      <div class="form-field large">
        <span class="field-label">Name</span>
        <div class="field-value">${indemnitor.firstName || ''} ${indemnitor.lastName || ''}</div>
      </div>
      <div class="form-field">
        <span class="field-label">Relation to Def.</span>
        <div class="field-value">${indemnitor.relationshipToDefendant || ''}</div>
      </div>
    </div>
    
    <div class="form-row">
      <div class="form-field small">
        <span class="field-label">Home Phone</span>
        <div class="field-value">${formatPhone(indemnitor.homePhone) || ''}</div>
      </div>
      <div class="form-field small">
        <span class="field-label">Cell</span>
        <div class="field-value">${formatPhone(indemnitor.cellPhone) || ''}</div>
      </div>
      <div class="form-field">
        <span class="field-label">Cell Phone Carrier</span>
        <div class="field-value">${indemnitor.cellCarrier || ''}</div>
      </div>
    </div>
    
    <div class="form-row">
      <div class="form-field small">
        <span class="field-label">Work</span>
        <div class="field-value">${formatPhone(indemnitor.workPhone) || ''}</div>
      </div>
      <div class="form-field large">
        <span class="field-label">Email address</span>
        <div class="field-value">${indemnitor.email || ''}</div>
      </div>
    </div>
    
    <div class="form-row">
      <div class="form-field small">
        <span class="field-label">D.O.B.</span>
        <div class="field-value">${formatDate(indemnitor.dob) || ''}</div>
      </div>
      <div class="form-field">
        <span class="field-label">Driver License or /I.D.#</span>
        <div class="field-value">${indemnitor.driversLicense || ''}</div>
      </div>
      <div class="form-field small">
        <span class="field-label">State Issued</span>
        <div class="field-value">${indemnitor.dlState || ''}</div>
      </div>
    </div>
    
    <div class="form-row">
      <div class="form-field">
        <span class="field-label">Current Address</span>
        <div class="field-value">${indemnitor.address || ''}</div>
      </div>
      <div class="form-field small">
        <span class="field-label">City</span>
        <div class="field-value">${indemnitor.city || ''}</div>
      </div>
      <div class="form-field small">
        <span class="field-label">State</span>
        <div class="field-value">${indemnitor.state || ''}</div>
      </div>
      <div class="form-field small">
        <span class="field-label">Zip</span>
        <div class="field-value">${indemnitor.zip || ''}</div>
      </div>
      <div class="form-field small">
        <span class="field-label">How Long</span>
        <div class="field-value">${indemnitor.timeAtAddress || ''}</div>
      </div>
    </div>
    
    <div class="form-row">
      <div class="form-field">
        <span class="field-label">Employer</span>
        <div class="field-value">${indemnitor.employer || ''}</div>
      </div>
      <div class="form-field">
        <span class="field-label">Occupation</span>
        <div class="field-value">${indemnitor.occupation || ''}</div>
      </div>
      <div class="form-field small">
        <span class="field-label">How Long</span>
        <div class="field-value">${indemnitor.employmentLength || ''}</div>
      </div>
    </div>
    
    <div class="form-row">
      <div class="form-field">
        <span class="field-label">Employer Address</span>
        <div class="field-value">${indemnitor.employerAddress || ''}</div>
      </div>
      <div class="form-field">
        <span class="field-label">City, State Zip</span>
        <div class="field-value">${indemnitor.employerCity || ''}, ${indemnitor.employerState || ''} ${indemnitor.employerZip || ''}</div>
      </div>
      <div class="form-field">
        <span class="field-label">Monthly Income</span>
        <div class="field-value">${indemnitor.monthlyIncome || ''}</div>
      </div>
    </div>
    
    <div class="form-row">
      <div class="form-field">
        <span class="field-label">Personal Reference</span>
        <div class="field-value">${data.references?.[0]?.name || ''}</div>
      </div>
      <div class="form-field small">
        <span class="field-label">Phone</span>
        <div class="field-value">${formatPhone(data.references?.[0]?.phone) || ''}</div>
      </div>
      <div class="form-field">
        <span class="field-label">Address</span>
        <div class="field-value">${data.references?.[0]?.address || ''}</div>
      </div>
    </div>
    
    <div class="form-row">
      <div class="form-field">
        <span class="field-label">Vehicle Make</span>
        <div class="field-value">${indemnitor.vehicleMake || ''}</div>
      </div>
      <div class="form-field">
        <span class="field-label">Vehicle Model</span>
        <div class="field-value">${indemnitor.vehicleModel || ''}</div>
      </div>
      <div class="form-field">
        <span class="field-label">Vehicle Insurance Carrier</span>
        <div class="field-value">${indemnitor.vehicleInsurance || ''}</div>
      </div>
    </div>
    
    <h3 style="text-decoration: underline; margin: 20px 0 15px 0;">Defendant Information</h3>
    
    <div class="form-row">
      <div class="form-field large">
        <span class="field-label">Name</span>
        <div class="field-value">${defendant.firstName || ''} ${defendant.middleName || ''} ${defendant.lastName || ''}</div>
      </div>
      <div class="form-field">
        <span class="field-label">AKA</span>
        <div class="field-value">${defendant.aka || ''}</div>
      </div>
    </div>
    
    <div class="form-row">
      <div class="form-field small">
        <span class="field-label">Home Phone</span>
        <div class="field-value">${formatPhone(defendant.homePhone) || ''}</div>
      </div>
      <div class="form-field small">
        <span class="field-label">Cell/Pager</span>
        <div class="field-value">${formatPhone(defendant.cellPhone) || ''}</div>
      </div>
      <div class="form-field small">
        <span class="field-label">Work</span>
        <div class="field-value">${formatPhone(defendant.workPhone) || ''}</div>
      </div>
    </div>
    
    <div class="form-row">
      <div class="form-field small">
        <span class="field-label">D.O.B.</span>
        <div class="field-value">${formatDate(defendant.dob) || ''}</div>
      </div>
      <div class="form-field small">
        <span class="field-label">S.S.#</span>
        <div class="field-value">${defendant.ssn || ''}</div>
      </div>
      <div class="form-field">
        <span class="field-label">Driver License or I.D.#</span>
        <div class="field-value">${defendant.driversLicense || ''}</div>
      </div>
      <div class="form-field small">
        <span class="field-label">State Issued</span>
        <div class="field-value">${defendant.dlState || ''}</div>
      </div>
    </div>
    
    <div class="form-row">
      <div class="form-field">
        <span class="field-label">Address</span>
        <div class="field-value">${defendant.address || ''}</div>
      </div>
      <div class="form-field small">
        <span class="field-label">City</span>
        <div class="field-value">${defendant.city || ''}</div>
      </div>
      <div class="form-field small">
        <span class="field-label">Zip</span>
        <div class="field-value">${defendant.zip || ''}</div>
      </div>
      <div class="form-field small">
        <span class="field-label">How Long</span>
        <div class="field-value">${defendant.timeAtAddress || ''}</div>
      </div>
    </div>
    
    <div class="form-row">
      <div class="form-field">
        <span class="field-label">Employer</span>
        <div class="field-value">${defendant.employer || ''}</div>
      </div>
      <div class="form-field">
        <span class="field-label">Occupation</span>
        <div class="field-value">${defendant.occupation || ''}</div>
      </div>
      <div class="form-field small">
        <span class="field-label">How Long</span>
        <div class="field-value">${defendant.employmentLength || ''}</div>
      </div>
    </div>
    
    <div class="form-row">
      <div class="form-field">
        <span class="field-label">Employer Address</span>
        <div class="field-value">${defendant.employerAddress || ''}</div>
      </div>
      <div class="form-field">
        <span class="field-label">City, State, Zip</span>
        <div class="field-value">${defendant.employerCity || ''}, ${defendant.employerState || ''} ${defendant.employerZip || ''}</div>
      </div>
      <div class="form-field">
        <span class="field-label">Monthly Income</span>
        <div class="field-value">${defendant.monthlyIncome || ''}</div>
      </div>
    </div>
    
    <div class="form-row">
      <div class="form-field">
        <span class="field-label">Personal Reference</span>
        <div class="field-value">${data.references?.[1]?.name || ''}</div>
      </div>
      <div class="form-field small">
        <span class="field-label">Phone</span>
        <div class="field-value">${formatPhone(data.references?.[1]?.phone) || ''}</div>
      </div>
      <div class="form-field">
        <span class="field-label">Address</span>
        <div class="field-value">${data.references?.[1]?.address || ''}</div>
      </div>
    </div>
    
    <div class="form-row">
      <div class="form-field small">
        <span class="field-label">Date Arrested</span>
        <div class="field-value">${formatDate(defendant.arrestDate) || ''}</div>
      </div>
      <div class="form-field">
        <span class="field-label">Co-Defendants</span>
        <div class="field-value">${defendant.coDefendants || ''}</div>
      </div>
    </div>
    
    <div class="form-row">
      <div class="form-field">
        <span class="field-label">Where Arrested</span>
        <div class="field-value">${defendant.arrestLocation || ''}</div>
      </div>
      <div class="form-field">
        <span class="field-label">Arresting Agency</span>
        <div class="field-value">${defendant.arrestingAgency || ''}</div>
      </div>
    </div>
    
    <div class="form-row">
      <div class="form-field">
        <span class="field-label">Vehicle Make</span>
        <div class="field-value">${defendant.vehicleMake || ''}</div>
      </div>
      <div class="form-field">
        <span class="field-label">Vehicle Model</span>
        <div class="field-value">${defendant.vehicleModel || ''}</div>
      </div>
      <div class="form-field">
        <span class="field-label">Vehicle Insurance Carrier</span>
        <div class="field-value">${defendant.vehicleInsurance || ''}</div>
      </div>
    </div>
    
    <div class="form-row" style="margin-top: 10px;">
      <span>Currently On:</span>
      <div class="checkbox-item">
        <div class="checkbox ${defendant.onProbation ? 'checked' : ''}"></div>
        <span>Probation</span>
      </div>
      <div class="checkbox-item">
        <div class="checkbox ${defendant.onParole ? 'checked' : ''}"></div>
        <span>Parole</span>
      </div>
      <div class="checkbox-item">
        <div class="checkbox ${!defendant.onProbation && !defendant.onParole ? 'checked' : ''}"></div>
        <span>None</span>
      </div>
    </div>
    
    <div class="form-row">
      <div class="form-field">
        <span class="field-label">Probation or Parole Officer</span>
        <div class="field-value">${defendant.probationOfficer || ''}</div>
      </div>
      <div class="form-field small">
        <span class="field-label">Phone</span>
        <div class="field-value">${formatPhone(defendant.probationOfficerPhone) || ''}</div>
      </div>
    </div>
    
    <p style="font-style: italic; margin: 15px 0; font-size: 10px;">
      I certify that the above information is true & correct. I also authorize the running of records and/or credit reports and full verification of all information given.
    </p>
    
    <div class="signature-section">
      <div class="signature-line">
        <div class="signature-box">
          <div class="signature-label">Co-Signer's Signature</div>
          <div class="signature-field">
            ${signatures.coSigner ? `<img src="${signatures.coSigner}" alt="Co-Signer Signature" />` : ''}
          </div>
        </div>
        <div class="date-field">
          <div class="signature-label">Date</div>
          <div class="field-value">${formatDate(new Date())}</div>
        </div>
      </div>
      
      <div class="signature-line">
        <div class="signature-box">
          <div class="signature-label">Defendant's Signature</div>
          <div class="signature-field">
            ${signatures.defendant ? `<img src="${signatures.defendant}" alt="Defendant Signature" />` : ''}
          </div>
        </div>
        <div class="date-field">
          <div class="signature-label">Date</div>
          <div class="field-value">${formatDate(new Date())}</div>
        </div>
      </div>
    </div>
    
    <div style="border: 1px solid #000; padding: 10px; margin-top: 20px;">
      <strong>For A BETTER Reps Only:</strong>
      <div class="form-row" style="margin-top: 10px;">
        <div class="form-field">
          <span class="field-label">Approved By:</span>
          <div class="field-value"></div>
        </div>
        <div class="form-field">
          <span class="field-label">Quote(s): $</span>
          <div class="field-value">${bond.premium || ''}</div>
        </div>
      </div>
      <div class="form-row">
        <div class="form-field">
          <span class="field-label">Approval Date:</span>
          <div class="field-value"></div>
        </div>
        <div class="form-field">
          <span class="field-label">Quoted by:</span>
          <div class="field-value"></div>
        </div>
      </div>
      <div class="form-field">
        <span class="field-label">Additional Requirements:</span>
        <div class="field-value"></div>
      </div>
    </div>
  </div>
</body>
</html>
`;
}

/**
 * Generate REFERENCE FORM
 */
export function generateReferenceForm(data, signatures = {}) {
  const { defendant = {}, indemnitor = {}, references = [], bond = {}, company = COMPANY_INFO } = data;
  
  // Ensure we have 5 reference slots
  const refs = [...references];
  while (refs.length < 5) {
    refs.push({ name: '', relationship: '', phone: '', address: '', city: '', state: '', zip: '' });
  }
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Reference Form - ${defendant.firstName || ''} ${defendant.lastName || ''}</title>
  <style>${commonStyles}
    .ref-section {
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 1px dashed #ccc;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="form-row" style="margin-bottom: 20px;">
      <div class="form-field">
        <span class="field-label">Applicant</span>
        <div class="field-value">${indemnitor.firstName || ''} ${indemnitor.lastName || ''}</div>
      </div>
      <div class="form-field">
        <span class="field-label">Defendant</span>
        <div class="field-value">${defendant.firstName || ''} ${defendant.lastName || ''}</div>
      </div>
    </div>
    
    <div class="form-row" style="margin-bottom: 20px;">
      <div class="form-field">
        <span class="field-label">Office</span>
        <div class="field-value">${company.name || 'A Better Bail Bond'}</div>
      </div>
      <div class="form-field small">
        <span class="field-label">Bond Amt</span>
        <div class="field-value">$${bond.amount || ''}</div>
      </div>
    </div>
    
    <div class="form-row" style="margin-bottom: 20px;">
      <div class="form-field">
        <span class="field-label">Bonding Agent</span>
        <div class="field-value">${bond.agentName || ''}</div>
      </div>
    </div>
    
    <p style="text-align: center; font-weight: bold; margin: 20px 0;">
      Please Complete All Information Correctly. Please PRINT.
    </p>
    
    ${refs.map((ref, i) => `
    <div class="ref-section">
      <div class="form-row">
        <div class="form-field">
          <span class="field-label">NAME</span>
          <div class="field-value">${ref.name || ''}</div>
        </div>
        <div class="form-field">
          <span class="field-label">RELATIONSHIP</span>
          <div class="field-value">${ref.relationship || ''}</div>
        </div>
        <div class="form-field small">
          <span class="field-label">PHONE</span>
          <div class="field-value">${formatPhone(ref.phone) || ''}</div>
        </div>
      </div>
      <div class="form-row">
        <div class="form-field">
          <span class="field-label">ADDRESS</span>
          <div class="field-value">${ref.address || ''}</div>
        </div>
        <div class="form-field">
          <span class="field-label">CITY/STATE</span>
          <div class="field-value">${ref.city || ''}${ref.state ? ', ' + ref.state : ''}</div>
        </div>
        <div class="form-field small">
          <span class="field-label">ZIP</span>
          <div class="field-value">${ref.zip || ''}</div>
        </div>
      </div>
      <div class="form-row">
        <div class="form-field small">
          <span class="field-label">VERIFIER</span>
          <div class="field-value"></div>
        </div>
        <div class="form-field large">
          <span class="field-label">NOTES</span>
          <div class="field-value"></div>
        </div>
      </div>
    </div>
    `).join('')}
    
    <p style="font-style: italic; margin: 20px 0; font-size: 10px;">
      I certify that all the information I have provided in this document is true and correct.
    </p>
    
    <div class="signature-section">
      <div class="signature-line">
        <div class="signature-box">
          <div class="signature-label">Applicant's Signature</div>
          <div class="signature-field">
            ${signatures.applicant ? `<img src="${signatures.applicant}" alt="Applicant Signature" />` : ''}
          </div>
        </div>
        <div class="date-field">
          <div class="signature-label">Date</div>
          <div class="field-value">${formatDate(new Date())}</div>
        </div>
      </div>
    </div>
    
    <div class="form-row" style="margin-top: 20px;">
      <div class="form-field">
        <span class="field-label">Verified By</span>
        <div class="field-value"></div>
      </div>
      <div class="form-field">
        <span class="field-label">Verification Date</span>
        <div class="field-value"></div>
      </div>
    </div>
    
    <p style="text-align: center; font-weight: bold; margin-top: 30px;">
      THANK YOU IN ADVANCE FOR YOUR COOPERATION!!!!
    </p>
    
    <p style="text-align: right; font-size: 8px; margin-top: 20px;">
      Revised 05/04/2022
    </p>
  </div>
</body>
</html>
`;
}

/**
 * Generate IMMIGRATION WAIVER form
 */
export function generateImmigrationWaiver(data, signatures = {}) {
  const { defendant = {}, indemnitor = {}, company = COMPANY_INFO } = data;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Immigration Waiver - ${defendant.firstName || ''} ${defendant.lastName || ''}</title>
  <style>${commonStyles}
    .waiver-text {
      font-size: 12px;
      line-height: 1.6;
      margin: 40px 0;
    }
    .waiver-text .blank {
      border-bottom: 1px solid #000;
      display: inline-block;
      min-width: 200px;
      margin: 0 5px;
    }
    .spanish-section {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 1px solid #ccc;
    }
  </style>
</head>
<body>
  <div class="page">
    <h1 style="text-align: center; font-size: 24px; margin: 40px 0;">IMMIGRATION WAIVER</h1>
    
    <div class="waiver-text">
      <p>
        I, <span class="blank">${indemnitor.firstName || ''} ${indemnitor.lastName || ''}</span>, hereby state that the defendant, 
        <span class="blank">${defendant.firstName || ''} ${defendant.lastName || ''}</span>,
      </p>
      <p style="margin-left: 20px;">
        (co-signer name) &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; (person in custody)
      </p>
      <p>
        is a citizen of the United States. If it is found that the defendant is not a United States citizen and is held in
        jail for an immigration hold, I agree that I will not be entitled to a refund of the bail bond premium and/or
        collateral.
      </p>
    </div>
    
    <div class="signature-section" style="margin-top: 60px;">
      <div class="signature-line">
        <div class="signature-box">
          <div class="signature-label">Co-signer Signature</div>
          <div class="signature-field">
            ${signatures.coSigner ? `<img src="${signatures.coSigner}" alt="Co-Signer Signature" />` : ''}
          </div>
        </div>
        <div class="date-field">
          <div class="signature-label">Date</div>
          <div class="field-value">${formatDate(new Date())}</div>
        </div>
      </div>
    </div>
    
    <div style="margin-top: 40px;">
      <p>SUBSCRIBED and SWORN TO before me, this ______ day of ______________, 20____.</p>
      <p style="margin-top: 10px;">[Seal]</p>
      
      <div style="margin-top: 40px; text-align: right;">
        <div style="border-top: 1px solid #000; width: 300px; margin-left: auto; padding-top: 5px;">
          NOTARY PUBLIC in and for State of Texas
        </div>
        <div style="border-top: 1px solid #000; width: 300px; margin-left: auto; margin-top: 30px; padding-top: 5px;">
          Printed Name of NOTARY PUBLIC
        </div>
      </div>
    </div>
    
    <div class="spanish-section">
      <div class="waiver-text">
        <p>
          Yo <span class="blank">${indemnitor.firstName || ''} ${indemnitor.lastName || ''}</span> doy mi palabra que 
          <span class="blank">${defendant.firstName || ''} ${defendant.lastName || ''}</span> es nacido en
        </p>
        <p style="margin-left: 20px;">
          (persona responsable) &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; (persona en carcel)
        </p>
        <p>
          Estados Unido. Si es desqubrido que no es nacido en los Estados Unidos y esta en carcel esperando que
          immigracion vaya pur el, yo no garo mi dinero patras.
        </p>
      </div>
      
      <div class="signature-section" style="margin-top: 40px;">
        <div class="signature-line">
          <div class="signature-box">
            <div class="signature-label">Persona Responsable</div>
            <div class="signature-field">
              ${signatures.coSignerSpanish ? `<img src="${signatures.coSignerSpanish}" alt="Persona Responsable" />` : signatures.coSigner ? `<img src="${signatures.coSigner}" alt="Persona Responsable" />` : ''}
            </div>
          </div>
          <div class="date-field">
            <div class="signature-label">Fecha</div>
            <div class="field-value">${formatDate(new Date())}</div>
          </div>
        </div>
      </div>
      
      <div style="margin-top: 40px;">
        <p>SUBSCRIBED and SWORN TO before me, this ______ day of ______________, 20____.</p>
        <p style="margin-top: 10px;">[Seal]</p>
        
        <div style="margin-top: 40px; text-align: right;">
          <div style="border-top: 1px solid #000; width: 300px; margin-left: auto; padding-top: 5px;">
            NOTARY PUBLIC in and for State of Texas
          </div>
          <div style="border-top: 1px solid #000; width: 300px; margin-left: auto; margin-top: 30px; padding-top: 5px;">
            Printed Name of NOTARY PUBLIC
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
`;
}

/**
 * Generate BAIL BOND APPLICATION - INDEMNITOR form (3 pages)
 */
export function generateIndemnitorApplication(data, signatures = {}) {
  const { defendant = {}, indemnitor = {}, references = [], bond = {}, company = COMPANY_INFO } = data;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Bail Bond Application - Indemnitor - ${indemnitor.firstName || ''} ${indemnitor.lastName || ''}</title>
  <style>${commonStyles}</style>
</head>
<body>
  <!-- PAGE 1 -->
  <div class="page">
    <div class="header">
      <div class="logo-section">
        <div class="logo">allegheny</div>
        <div>
          <div class="company-name" style="font-size: 18px;">allegheny</div>
          <div class="company-address">CASUALTY COMPANY</div>
          <div class="company-address">PO Box 5600, Thousand Oaks, CA 91359</div>
          <div class="company-address">800.935.2245 info@aiasurety.com</div>
        </div>
      </div>
      <div>
        <div class="form-title">BAIL BOND APPLICATION - INDEMNITOR</div>
        <div class="agent-info">
          <div style="font-size: 8px;">PRODUCER NAME, ADDRESS, PHONE, EMAIL AND PRODUCER LICENSE NUMBER MUST BE PREPRINTED OR STAMPED HERE.</div>
          <div><strong>${company.name || 'A BETTER BAIL BOND'}</strong></div>
          <div>${company.address || '1416 WASHINGTON AVE'}</div>
          <div>${company.city || 'HOUSTON'} ${company.state || 'TX'} ${company.zip || '77002'}</div>
          <div>${company.license || '#74504'}</div>
        </div>
      </div>
    </div>
    
    <div class="warning-box">
      THIS IS A 3-PAGE, DOUBLE SIDED DOCUMENT<br>
      READ CAREFULLY AND COMPLETE
    </div>
    
    <div class="section">
      <div class="section-title">Defendant Info</div>
      <div class="form-row">
        <div class="form-field large">
          <span class="field-label">Defendant Name</span>
          <div class="field-value boxed">${defendant.firstName || ''} ${defendant.middleName || ''} ${defendant.lastName || ''}</div>
        </div>
        <div class="form-field">
          <span class="field-label">Birth Date</span>
          <div class="field-value boxed">${formatDate(defendant.dob) || ''}</div>
        </div>
      </div>
      <div class="form-row">
        <div class="form-field large">
          <span class="field-label">Charges</span>
          <div class="field-value boxed">${bond.charges || ''}</div>
        </div>
        <div class="form-field">
          <span class="field-label">Appearance Date</span>
          <div class="field-value boxed">${formatDate(bond.courtDate) || ''}</div>
        </div>
      </div>
      <div class="form-row">
        <div class="form-field">
          <span class="field-label">Case Number</span>
          <div class="field-value boxed">${bond.caseNumber || ''}</div>
        </div>
        <div class="form-field">
          <span class="field-label">Court Name</span>
          <div class="field-value boxed">${bond.courtName || ''}</div>
        </div>
      </div>
      <div class="form-row">
        <div class="form-field">
          <span class="field-label">Jail Location</span>
          <div class="field-value boxed">${defendant.jailLocation || ''}</div>
        </div>
        <div class="form-field small">
          <span class="field-label">County</span>
          <div class="field-value boxed">${defendant.county || ''}</div>
        </div>
        <div class="form-field">
          <span class="field-label">Booking Number</span>
          <div class="field-value boxed">${defendant.bookingNumber || ''}</div>
        </div>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">Indemnitor Information</div>
      <div class="form-row">
        <div class="form-field large">
          <span class="field-label">Indemnitor Name</span>
          <div class="field-value boxed">${indemnitor.firstName || ''} ${indemnitor.lastName || ''}</div>
        </div>
        <div class="form-field">
          <span class="field-label">My friends / family know me as</span>
          <div class="field-value boxed">${indemnitor.nickname || ''}</div>
        </div>
      </div>
      <div class="form-row">
        <div class="form-field">
          <span class="field-label">Home Phone Number</span>
          <div class="field-value boxed">${formatPhone(indemnitor.homePhone) || ''}</div>
        </div>
        <div class="form-field">
          <span class="field-label">Cell Phone Number</span>
          <div class="field-value boxed">${formatPhone(indemnitor.cellPhone) || ''}</div>
        </div>
        <div class="form-field">
          <span class="field-label">Work Phone Number</span>
          <div class="field-value boxed">${formatPhone(indemnitor.workPhone) || ''}</div>
        </div>
      </div>
      <div class="form-row">
        <div class="form-field">
          <span class="field-label">Relationship to Defendant</span>
          <div class="field-value boxed">${indemnitor.relationshipToDefendant || ''}</div>
        </div>
        <div class="form-field large">
          <span class="field-label">Email</span>
          <div class="field-value boxed">${indemnitor.email || ''}</div>
        </div>
      </div>
      <div class="form-row">
        <div class="form-field large">
          <span class="field-label">Current Full Address, City, State and Zip</span>
          <div class="field-value boxed">${indemnitor.address || ''}, ${indemnitor.city || ''}, ${indemnitor.state || ''} ${indemnitor.zip || ''}</div>
        </div>
        <div class="checkbox-row">
          <div class="checkbox-item">
            <div class="checkbox ${indemnitor.ownsHome ? 'checked' : ''}"></div>
            <span>Own</span>
          </div>
          <div class="checkbox-item">
            <div class="checkbox ${!indemnitor.ownsHome ? 'checked' : ''}"></div>
            <span>Rent</span>
          </div>
        </div>
      </div>
      <div class="form-row">
        <div class="form-field small">
          <span class="field-label">From</span>
          <div class="field-value boxed">${indemnitor.addressFrom || ''}</div>
        </div>
        <div class="form-field small">
          <span class="field-label">To</span>
          <div class="field-value boxed">${indemnitor.addressTo || ''}</div>
        </div>
        <div class="form-field">
          <span class="field-label">Landlord Name (if applicable)</span>
          <div class="field-value boxed">${indemnitor.landlordName || ''}</div>
        </div>
        <div class="form-field">
          <span class="field-label">Landlord Phone Number</span>
          <div class="field-value boxed">${formatPhone(indemnitor.landlordPhone) || ''}</div>
        </div>
      </div>
      <div class="form-row">
        <div class="form-field large">
          <span class="field-label">Former Full Address, City, State and Zip</span>
          <div class="field-value boxed">${indemnitor.formerAddress || ''}</div>
        </div>
        <div class="checkbox-row">
          <div class="checkbox-item">
            <div class="checkbox"></div>
            <span>Own</span>
          </div>
          <div class="checkbox-item">
            <div class="checkbox"></div>
            <span>Rent</span>
          </div>
        </div>
      </div>
      <div class="form-row">
        <div class="checkbox-row">
          <div class="checkbox-item">
            <div class="checkbox ${indemnitor.gender === 'M' ? 'checked' : ''}"></div>
            <span>M</span>
          </div>
          <div class="checkbox-item">
            <div class="checkbox ${indemnitor.gender === 'F' ? 'checked' : ''}"></div>
            <span>F</span>
          </div>
        </div>
        <div class="form-field">
          <span class="field-label">Birth Date</span>
          <div class="field-value boxed">${formatDate(indemnitor.dob) || ''}</div>
        </div>
        <div class="form-field">
          <span class="field-label">Birth Place</span>
          <div class="field-value boxed">${indemnitor.birthPlace || ''}</div>
        </div>
        <div class="form-field">
          <span class="field-label">Social Security Number</span>
          <div class="field-value boxed">${indemnitor.ssn || ''}</div>
        </div>
      </div>
      <div class="form-row">
        <div class="form-field">
          <span class="field-label">Driver's License / ID Number</span>
          <div class="field-value boxed">${indemnitor.driversLicense || ''}</div>
        </div>
        <div class="form-field small">
          <span class="field-label">State Issued</span>
          <div class="field-value boxed">${indemnitor.dlState || ''}</div>
        </div>
        <div class="checkbox-row">
          <span>U.S. citizen?</span>
          <div class="checkbox-item">
            <div class="checkbox ${indemnitor.usCitizen ? 'checked' : ''}"></div>
            <span>Yes</span>
          </div>
          <div class="checkbox-item">
            <div class="checkbox ${!indemnitor.usCitizen ? 'checked' : ''}"></div>
            <span>No</span>
          </div>
        </div>
        <div class="form-field">
          <span class="field-label">Alien Number</span>
          <div class="field-value boxed">${indemnitor.alienNumber || ''}</div>
        </div>
        <div class="form-field small">
          <span class="field-label">How long in US?</span>
          <div class="field-value boxed">${indemnitor.timeInUS || ''}</div>
        </div>
      </div>
      <div class="form-row">
        <div class="form-field large">
          <span class="field-label">Additional Notes</span>
          <div class="field-value boxed">${indemnitor.notes || ''}</div>
        </div>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">Employment</div>
      <div class="form-row">
        <div class="form-field large">
          <span class="field-label">Employer</span>
          <div class="field-value boxed">${indemnitor.employer || ''}</div>
        </div>
        <div class="form-field">
          <span class="field-label">Position</span>
          <div class="field-value boxed">${indemnitor.occupation || ''}</div>
        </div>
        <div class="form-field small">
          <span class="field-label">How Long</span>
          <div class="field-value boxed">${indemnitor.employmentLength || ''}</div>
        </div>
      </div>
      <div class="form-row">
        <div class="form-field large">
          <span class="field-label">Supervisor's Name</span>
          <div class="field-value boxed">${indemnitor.supervisorName || ''}</div>
        </div>
        <div class="form-field">
          <span class="field-label">Phone Number</span>
          <div class="field-value boxed">${formatPhone(indemnitor.employerPhone) || ''}</div>
        </div>
      </div>
      <div class="form-row">
        <div class="form-field">
          <span class="field-label">Union</span>
          <div class="field-value boxed">${indemnitor.union || ''}</div>
        </div>
        <div class="form-field">
          <span class="field-label">Local Number</span>
          <div class="field-value boxed">${indemnitor.unionLocal || ''}</div>
        </div>
      </div>
      <div class="form-row">
        <div class="form-field">
          <span class="field-label">Military Branch</span>
          <div class="field-value boxed">${indemnitor.militaryBranch || ''}</div>
        </div>
        <div class="checkbox-row">
          <span>Active</span>
          <div class="checkbox-item">
            <div class="checkbox ${indemnitor.militaryActive ? 'checked' : ''}"></div>
            <span>Yes</span>
          </div>
          <div class="checkbox-item">
            <div class="checkbox ${!indemnitor.militaryActive ? 'checked' : ''}"></div>
            <span>No</span>
          </div>
        </div>
        <div class="form-field">
          <span class="field-label">Discharge Date</span>
          <div class="field-value boxed">${formatDate(indemnitor.dischargeDate) || ''}</div>
        </div>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">Social</div>
      <div class="form-row">
        <div class="form-field">
          <span class="field-label">Facebook Username</span>
          <div class="field-value boxed">${indemnitor.facebook || ''}</div>
        </div>
        <div class="form-field">
          <span class="field-label">Twitter Username</span>
          <div class="field-value boxed">${indemnitor.twitter || ''}</div>
        </div>
        <div class="form-field">
          <span class="field-label">Linkedin Username</span>
          <div class="field-value boxed">${indemnitor.linkedin || ''}</div>
        </div>
        <div class="form-field">
          <span class="field-label">Other Account</span>
          <div class="field-value boxed">${indemnitor.otherSocial || ''}</div>
        </div>
        <div class="form-field">
          <span class="field-label">Username</span>
          <div class="field-value boxed">${indemnitor.otherUsername || ''}</div>
        </div>
      </div>
      <div class="form-row">
        <div class="form-field">
          <span class="field-label">Password</span>
          <div class="field-value boxed"></div>
        </div>
        <div class="form-field">
          <span class="field-label">Password</span>
          <div class="field-value boxed"></div>
        </div>
        <div class="form-field">
          <span class="field-label">Password</span>
          <div class="field-value boxed"></div>
        </div>
        <div class="form-field">
          <span class="field-label">Password</span>
          <div class="field-value boxed"></div>
        </div>
      </div>
    </div>
    
    <div class="footer">
      <span>Form# ACC.0302 (11/22)</span>
      <span>Page 1 of 3</span>
    </div>
  </div>
  
  <!-- PAGE 2 -->
  <div class="page">
    <div class="section">
      <div class="section-title">Indemnitor Signatures</div>
      <div class="signature-line" style="margin-top: 30px;">
        <div class="signature-box">
          <div class="signature-label">Indemnitor</div>
          <div class="signature-field">
            ${signatures.indemnitor ? `<img src="${signatures.indemnitor}" alt="Indemnitor Signature" />` : ''}
          </div>
        </div>
      </div>
      <div class="signature-line">
        <div class="signature-box">
          <div class="signature-label">Indemnitor</div>
          <div class="signature-field">
            ${signatures.indemnitor2 ? `<img src="${signatures.indemnitor2}" alt="Indemnitor Signature 2" />` : ''}
          </div>
        </div>
      </div>
      <div class="signature-line">
        <div class="signature-box">
          <div class="signature-label">Indemnitor</div>
          <div class="signature-field">
            ${signatures.indemnitor3 ? `<img src="${signatures.indemnitor3}" alt="Indemnitor Signature 3" />` : ''}
          </div>
        </div>
      </div>
    </div>
    
    <div class="footer">
      <span>Form# ACC.0302 (11/22)</span>
      <span>Page 2 of 3</span>
    </div>
  </div>
  
  <!-- PAGE 3 -->
  <div class="page">
    <div class="terms">
      <p style="text-align: center; font-weight: bold; margin-bottom: 15px;">
        TERMS AND CONDITIONS
      </p>
      <p>
        The undersigned Indemnitor(s) hereby apply to Allegheny Casualty Company ("Surety") for a bail bond 
        in the amount shown above for the release of the Defendant named above. In consideration of the 
        Surety executing said bond, the undersigned agree as follows:
      </p>
      <h4>1. PREMIUM</h4>
      <p>
        The Indemnitor agrees to pay the Surety's licensed bail agent the premium charge for the bond as 
        required by law or by contract, and further agrees to pay said premium for each successive year or 
        fraction thereof that the bond shall remain in force.
      </p>
      <h4>2. INDEMNITY</h4>
      <p>
        The Indemnitor agrees to indemnify and save harmless the Surety from and against any and all claims, 
        demands, liabilities, costs, charges, legal fees, disbursements and expenses of whatever kind or nature 
        which the Surety may at any time sustain or incur and which arise by reason of having executed or 
        procured the execution of said bond.
      </p>
      <h4>3. COLLATERAL SECURITY</h4>
      <p>
        The Indemnitor agrees to deposit with the Surety, immediately upon demand, cash or other security 
        satisfactory to the Surety as collateral to secure the Indemnitor's obligations under this Agreement.
      </p>
      <h4>4. CHANGES</h4>
      <p>
        The Indemnitor agrees to notify the Surety immediately of any change of address of the Defendant 
        or any Indemnitor, or of any other change affecting this Agreement.
      </p>
      <h4>5. SURRENDER</h4>
      <p>
        The Surety reserves the right to surrender the Defendant to custody at any time it deems it necessary 
        to protect itself from loss.
      </p>
    </div>
    
    <div class="signature-section" style="margin-top: 30px;">
      <p style="font-size: 10px; margin-bottom: 15px;">
        I/We have read and understand the foregoing terms and conditions and agree to be bound thereby.
      </p>
      <div class="signature-line">
        <div class="signature-box">
          <div class="signature-label">Indemnitor Signature</div>
          <div class="signature-field">
            ${signatures.indemnitorFinal ? `<img src="${signatures.indemnitorFinal}" alt="Indemnitor Final Signature" />` : signatures.indemnitor ? `<img src="${signatures.indemnitor}" alt="Indemnitor Signature" />` : ''}
          </div>
        </div>
        <div class="date-field">
          <div class="signature-label">Date</div>
          <div class="field-value">${formatDate(new Date())}</div>
        </div>
      </div>
    </div>
    
    <div class="footer">
      <span>Form# ACC.0302 (11/22)</span>
      <span>Page 3 of 3</span>
    </div>
  </div>
</body>
</html>
`;
}

/**
 * Generate IMMIGRATION BOND AGREEMENT form (2 pages)
 */
export function generateImmigrationBondAgreement(data, signatures = {}) {
  const { defendant = {}, indemnitor = {}, bond = {}, company = COMPANY_INFO } = data;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Immigration Bond Agreement - ${indemnitor.firstName || ''} ${indemnitor.lastName || ''}</title>
  <style>${commonStyles}</style>
</head>
<body>
  <!-- PAGE 1 -->
  <div class="page">
    <div class="header">
      <div class="logo-section">
        <div class="logo">allegheny</div>
        <div>
          <div class="company-name" style="font-size: 18px;">allegheny</div>
          <div class="company-address">CASUALTY COMPANY</div>
          <div class="company-address">PO Box 5600, Thousand Oaks, CA 91359</div>
          <div class="company-address">800.935.2245 info@aiasurety.com</div>
        </div>
      </div>
      <div>
        <div class="form-title">IMMIGRATION BOND AGREEMENT ("Agreement")</div>
        <div class="agent-info">
          <div style="font-size: 8px;">AGENT NAME, ADDRESS, PHONE, EMAIL AND LICENSE NUMBER</div>
          <div><strong>${company.name || 'A BETTER BAIL BOND DT'}</strong></div>
          <div>${company.address || '1416 WASHINGTON AVE'}</div>
          <div>${company.city || 'HOUSTON'} ${company.state || 'TX'} ${company.zip || '77002'}</div>
          <div>${company.phone || '713-635-8400'}</div>
        </div>
      </div>
    </div>
    
    <div class="warning-box">
      THIS IS A DOUBLE SIDED DOCUMENT<br>
      READ ALL SIDES CAREFULLY
    </div>
    
    <div class="terms" style="font-size: 10px; margin-bottom: 15px;">
      <p>
        In consideration of Allegheny Casualty Company, a New Jersey corporation, through its duly licensed and appointed
        surety agent identified above (collectively, "Surety"), issuing and posting a Department of Homeland Security, U.S
        Immigration and Customs Enforcement Immigration ("ICE") Bond (ICE Form I-352) ("Bond") on behalf of the following
        detained alien ("Alien"):
      </p>
    </div>
    
    <div class="section">
      <div class="section-title">Agreement Details</div>
      <div class="form-row">
        <div class="form-field large">
          <span class="field-label">Alien Name</span>
          <div class="field-value boxed">${defendant.firstName || ''} ${defendant.lastName || ''}</div>
        </div>
        <div class="form-field large">
          <span class="field-label">Alien Address</span>
          <div class="field-value boxed">${defendant.address || ''}, ${defendant.city || ''}, ${defendant.state || ''} ${defendant.zip || ''}</div>
        </div>
      </div>
      <div class="form-row">
        <div class="form-field">
          <span class="field-label">Alien Number</span>
          <div class="field-value boxed">${defendant.alienNumber || ''}</div>
        </div>
        <div class="form-field">
          <span class="field-label">Power Number</span>
          <div class="field-value boxed">${bond.powerNumber || ''}</div>
        </div>
        <div class="form-field">
          <span class="field-label">Total Bond Amount $</span>
          <div class="field-value boxed">${bond.amount || ''}</div>
        </div>
        <div class="form-field">
          <span class="field-label">Total Premium $</span>
          <div class="field-value boxed">${bond.premium || ''}</div>
        </div>
      </div>
      <div class="form-row">
        <div class="form-field">
          <span class="field-label">Indemnitor Name</span>
          <div class="field-value boxed">${indemnitor.firstName || ''} ${indemnitor.lastName || ''}</div>
        </div>
        <div class="form-field large">
          <span class="field-label">Indemnitor Address</span>
          <div class="field-value boxed">${indemnitor.address || ''}, ${indemnitor.city || ''}, ${indemnitor.state || ''} ${indemnitor.zip || ''}</div>
        </div>
      </div>
    </div>
    
    <p style="font-size: 10px; margin: 15px 0;">
      the undersigned, jointly and severally ("Indemnitor"), agrees to all terms and conditions found on following pages (front
      and back).
    </p>
    
    <div class="section">
      <div class="section-title">Signature</div>
      <p style="margin: 10px 0;">Signed, sealed and delivered this <span style="border-bottom: 1px solid #000; padding: 0 30px;">${formatDate(new Date())}</span>.</p>
      
      <div class="signature-line" style="margin-top: 20px;">
        <div class="signature-box">
          <div class="signature-label">Indemnitor Signature</div>
          <div class="signature-field">
            ${signatures.indemnitor ? `<img src="${signatures.indemnitor}" alt="Indemnitor Signature" />` : ''}
          </div>
        </div>
        <div class="form-field">
          <div class="signature-label">Print Name</div>
          <div class="field-value">${indemnitor.firstName || ''} ${indemnitor.lastName || ''}</div>
        </div>
      </div>
    </div>
    
    <div style="border-top: 2px solid #f7941d; margin-top: 20px; padding-top: 10px;">
      <p style="text-align: center; font-weight: bold; color: #c00; font-size: 10px;">
        READ ALL TERMS AND CONDITIONS ON THE FRONT AND BACK OF EACH PAGE
      </p>
    </div>
    
    <div class="section">
      <div class="section-title section-title-blue">Terms and Conditions</div>
      <div class="terms">
        <h4>1. Application Fee; Bond Premium.</h4>
        <p>
          Upon execution of this Agreement, the Indemnitor shall pay Surety the premium
          as stated below and an application fee of One Hundred Dollars ($100.00), which shall reimburse Surety for the costs
          associated with conducting due diligence upon the Indemnitor and the Alien, including obtaining credit and background
          reports.
        </p>
        <h4>2. Payment Terms/Premium Fully Earned.</h4>
        <p>
          Surety may agree to payment of the premium over time, as more fully
          detailed in the Promissory Note and Installment Plan for Unpaid Premium and Expenses, the terms of which are fully
          incorporated herein by this reference. Premium is fully earned upon posting of the Bond and release of the Alien from
          ICE custody. Surety shall not refund, in whole or in part (pro rata), any premium.
        </p>
        <h4>3. Obligations Continue Until Bond Cancellation.</h4>
        <p>
          All obligations of the Indemnitor under this Agreement, including
          those obligations to pay premium and/or deposit collateral, shall continue until Surety receives written notice from ICE
          that the Bond is cancelled. (ICE Form I-391.)
        </p>
        <p>
          Upon receipt of notice of cancellation of the Bond (ICE Form I-391) from ICE, Surety shall forthwith return to the
          Indemnitor all deposited/pledged collateral, less deductions for unpaid premium, fees, costs, and expenses as provided
          herein. Surety shall provide the Indemnitor with a written itemization of all deductions from such collateral.
        </p>
        <h4>4. Cash Collateral.</h4>
        <p>
          As security for the performance of the obligations under this Agreement and of the Bond, the
          Indemnitor shall deposit with Surety a sum of cash collateral equal to the full-face amount of the Bond.
        </p>
        <p>
          Surety may agree to the deposit of such cash collateral over time as more fully detailed in the Promissory Note for
          Additional Future Collateral Payments, the terms of which are fully incorporated herein by this reference.
        </p>
      </div>
    </div>
    
    <div class="footer">
      <span>Form# ACC.0400 (10/21)</span>
      <span>*08415*</span>
      <span>Page 1 of 2</span>
    </div>
  </div>
  
  <!-- PAGE 2 -->
  <div class="page">
    <div class="terms">
      <h4>5. Pledging of Less than Full Cash Collateral.</h4>
      <p>
        Should the Indemnitor not deposit full cash collateral as security for
        performance of the obligation under this Agreement and of the Bond, the Indemnitor agrees to provide other security
        acceptable to Surety, including liens on real or personal property. The Indemnitor shall pay (or reimburse Surety for) all
        fees and costs associated with the recording of such liens, including the costs of obtaining property valuations, title
        reports and title insurance, if applicable.
      </p>
      
      <h4>6. Bond Breach.</h4>
      <p>
        In the event that ICE declares the Bond breached (ICE Form I-323), upon written demand to the
        Indemnitor by Surety, the Indemnitor shall immediately pay to Surety any and all sums due under this Agreement,
        including unpaid premium and the balance of any cash or other collateral due hereunder.
      </p>
      
      <h4>7. Indemnity.</h4>
      <p>
        The Indemnitor, jointly and severally (together and separately) with any other indemnitor for the Bond,
        agrees to indemnify and hold Surety harmless from and against any and all Bond breach, claims, lawsuits, damages,
        losses, liability, demands, judgments, fees, fines, penalties, interest, premiums, and expenses, (including attorney's fees
        and costs) that Surety shall or may at any time sustain, incur or become liable for, by any reason of or on account of
        Surety executing and posting the Bond.
      </p>
      <p>
        If sufficient cash collateral in the full face amount of the Bond is not held on deposit by Surety, upon receipt of notice of
        breach of the Bond by ICE (Form I-323), the Indemnitor shall immediately upon written demand pay to Surety a cash
        amount equal to the face amount of the Bond, less any cash collateral held by Surety as previously deposited,
        regardless of whether Surety has paid the breach amount to ICE.
      </p>
      <p>
        Surety has the exclusive right to defend any claim upon the Bond, including the right to assert defenses and litigation
        and appeals. The Indemnitor authorizes Surety, in its sole discretion, to do so and shall reimburse Surety upon demand
        for all costs, attorneys fees, and expenses incurred therein.
      </p>
      
      <h4>8. Deed of Trust/Mortgage Pledged as Security.</h4>
      <p>
        Should any Deed of Trust or Mortgage pledged by the Indemnitor as
        security for the performance of this Agreement become the subject of foreclosure or other sale, Surety may declare all
        sums secured by such lien immediately due and payable to Surety under this Agreement.
      </p>
      
      <h4>9. Credit Report Authorized.</h4>
      <p>
        The Indemnitor expressly authorize Surety to conduct and obtain credit reports. Surety
        shall provide a separate authorization form to the Indemnitor for signature.
      </p>
      
      <h4>10. Venue; Jurisdiction; Attorney's Fees and Costs.</h4>
      <p>
        Since the issuance of the bond shall occur in the county and
        state in which the agent shown above is located, any controversy, dispute, action, or claim arising out of this Agreement
        shall be filed in such county and state. The Indemnitor waives any objection to such venue and jurisdiction. In any such
        litigation, the prevailing party shall be entitled to reasonable attorney's fees and costs as the court may set.
      </p>
      
      <h4>11. Assignment; Successors.</h4>
      <p>
        Surety may assign the Agreement to another licensed surety or agent upon notice to the
        Indemnitor. This Agreement is binding on the Indemnitor, all heirs, successors, assigns, executors, and administrators.
      </p>
      
      <h4>12. Delivery of Payments.</h4>
      <p>
        Unless otherwise instructed by Surety, the Indemnitor shall deliver all payments due
        hereunder to:
      </p>
      <p style="margin-left: 20px;">
        Allegheny Casualty Company<br>
        c/o AIA Holdings, Inc.<br>
        PO Box 5600<br>
        Thousand Oaks, CA 91359
      </p>
      
      <h4>13. Entire Agreement.</h4>
      <p>
        This Agreement supersedes all prior and other agreements, oral statements and/or
        representations and contains the entire agreement among the parties with respect to the subject matter hereof and the
        transactions contemplated hereby. Neither party has relied upon any oral statements made by the other in entering into
        this Agreement.
      </p>
    </div>
    
    <div style="margin-top: 20px; text-align: center; font-size: 9px;">
      <p><strong>Terms And Conditions (continued from previous page)</strong></p>
    </div>
    
    <div class="footer">
      <span>Form# ACC.0400 (10/21)</span>
      <span>Page 2 of 2</span>
    </div>
  </div>
</body>
</html>
`;
}

/**
 * Generate all forms as a combined document
 */
export function generateAllForms(data, signatures = {}) {
  return {
    preApplication: generatePreApplication(data, signatures),
    referenceForm: generateReferenceForm(data, signatures),
    immigrationWaiver: generateImmigrationWaiver(data, signatures),
    indemnitorApplication: generateIndemnitorApplication(data, signatures),
    immigrationBondAgreement: generateImmigrationBondAgreement(data, signatures)
  };
}

export default {
  generatePreApplication,
  generateReferenceForm,
  generateImmigrationWaiver,
  generateIndemnitorApplication,
  generateImmigrationBondAgreement,
  generateAllForms
};
