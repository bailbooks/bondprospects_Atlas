import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * Generate all PDFs for a completed intake
 */
export async function generateAllPdfs(data) {
  const { company, defendantData, indemnitorData, referencesData, bondData, signatures } = data;
  
  // Normalize signatures to support both old and new formats
  const normalizedSignatures = normalizeSignatures(signatures);
  
  const results = {};
  
  try {
    // Generate each form
    results.preApplication = await generatePreApplication(company, defendantData, indemnitorData, normalizedSignatures);
    results.indemnitorApp = await generateIndemnitorApplication(company, defendantData, indemnitorData, referencesData, normalizedSignatures);
    results.bondAgreement = await generateBondAgreement(company, defendantData, indemnitorData, bondData, normalizedSignatures);
    results.immigrationWaiver = await generateImmigrationWaiver(company, defendantData, indemnitorData, normalizedSignatures);
    results.referenceForm = await generateReferenceForm(company, defendantData, indemnitorData, referencesData, bondData, normalizedSignatures);
    
    console.log('Generated PDFs:', Object.keys(results));
    return results;
    
  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  }
}

/**
 * Normalize signatures to support both old and new formats
 */
function normalizeSignatures(signatures = {}) {
  return {
    indemnitor: signatures.indemnitorApplication_indemnitor || 
                signatures.immigrationBondAgreement_indemnitor || 
                signatures.preApplication_coSigner ||
                signatures.indemnitor,
    defendant: signatures.preApplication_defendant || 
               signatures.defendant,
    waiver: signatures.immigrationWaiver_coSigner || 
            signatures.waiver ||
            signatures.preApplication_coSigner ||
            signatures.indemnitor,
    applicant: signatures.referenceForm_applicant ||
               signatures.preApplication_coSigner ||
               signatures.indemnitor,
    ...signatures
  };
}

/**
 * Format date for display
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return String(dateStr);
  return date.toLocaleDateString('en-US', { 
    month: '2-digit', 
    day: '2-digit', 
    year: 'numeric' 
  });
}

/**
 * Format phone number
 */
function formatPhone(phone) {
  if (!phone) return '';
  const cleaned = String(phone).replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0,3)}) ${cleaned.slice(3,6)}-${cleaned.slice(6)}`;
  }
  return String(phone);
}

/**
 * Format currency
 */
function formatCurrency(amount) {
  if (!amount) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

/**
 * Safe string helper
 */
function safe(value, defaultVal = '') {
  if (value === null || value === undefined) return defaultVal;
  return String(value);
}

/**
 * Draw a section header with background
 */
function drawSectionHeader(page, text, y, font, fontBold, width) {
  page.drawRectangle({
    x: 40,
    y: y - 5,
    width: width - 80,
    height: 20,
    color: rgb(0.9, 0.9, 0.9),
  });
  
  page.drawText(text, {
    x: 50,
    y: y,
    size: 11,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  
  return y - 25;
}

/**
 * Draw a labeled field
 */
function drawField(page, label, value, x, y, font, fontBold, labelWidth = 100) {
  page.drawText(label + ':', {
    x: x,
    y: y,
    size: 9,
    font: fontBold,
    color: rgb(0.3, 0.3, 0.3),
  });
  
  page.drawText(safe(value), {
    x: x + labelWidth,
    y: y,
    size: 10,
    font: font,
    color: rgb(0, 0, 0),
  });
}

/**
 * Draw a horizontal line
 */
function drawLine(page, y, width) {
  page.drawLine({
    start: { x: 40, y: y },
    end: { x: width - 40, y: y },
    thickness: 0.5,
    color: rgb(0.7, 0.7, 0.7),
  });
}

/**
 * Embed signature image
 */
async function embedSignature(pdfDoc, page, signatureBase64, x, y, maxWidth = 150, maxHeight = 40) {
  if (!signatureBase64 || !signatureBase64.startsWith('data:image')) return;
  
  try {
    const base64Data = signatureBase64.replace(/^data:image\/\w+;base64,/, '');
    const signatureBytes = Buffer.from(base64Data, 'base64');
    const signatureImage = await pdfDoc.embedPng(signatureBytes);
    
    const scale = Math.min(
      maxWidth / signatureImage.width,
      maxHeight / signatureImage.height
    );
    
    page.drawImage(signatureImage, {
      x,
      y,
      width: signatureImage.width * scale,
      height: signatureImage.height * scale,
    });
  } catch (error) {
    console.error('Error embedding signature:', error.message);
  }
}

// ============================================================================
// PRE-APPLICATION FORM
// ============================================================================
async function generatePreApplication(company, defendant, indemnitor, signatures) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  const page = pdfDoc.addPage([612, 792]);
  const { width, height } = page.getSize();
  let y = height - 50;
  
  // Title
  page.drawText('PRE-APPLICATION', {
    x: width / 2 - 60,
    y: y,
    size: 16,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  y -= 15;
  
  page.drawText(safe(company?.name, 'Bail Bonds Company'), {
    x: width / 2 - 80,
    y: y,
    size: 12,
    font: font,
    color: rgb(0.3, 0.3, 0.3),
  });
  y -= 30;
  
  drawLine(page, y, width);
  y -= 20;
  
  const col1 = 50;
  const col2 = 320;
  
  // CO-SIGNER SECTION
  y = drawSectionHeader(page, 'CO-SIGNER / INDEMNITOR INFORMATION', y, font, fontBold, width);
  
  drawField(page, 'Full Name', `${safe(indemnitor?.firstName)} ${safe(indemnitor?.lastName)}`, col1, y, font, fontBold);
  drawField(page, 'Relationship', safe(indemnitor?.relationshipToDefendant), col2, y, font, fontBold);
  y -= 18;
  
  drawField(page, 'Date of Birth', formatDate(indemnitor?.dob), col1, y, font, fontBold);
  drawField(page, 'SSN', indemnitor?.ssn ? `XXX-XX-${safe(indemnitor?.ssn).slice(-4)}` : '', col2, y, font, fontBold);
  y -= 18;
  
  drawField(page, 'Home Phone', formatPhone(indemnitor?.homePhone), col1, y, font, fontBold);
  drawField(page, 'Cell Phone', formatPhone(indemnitor?.cellPhone), col2, y, font, fontBold);
  y -= 18;
  
  drawField(page, 'Work Phone', formatPhone(indemnitor?.workPhone), col1, y, font, fontBold);
  drawField(page, 'Email', safe(indemnitor?.email), col2, y, font, fontBold);
  y -= 18;
  
  drawField(page, 'Address', safe(indemnitor?.address), col1, y, font, fontBold, 60);
  y -= 18;
  
  drawField(page, 'City/State/Zip', `${safe(indemnitor?.city)}, ${safe(indemnitor?.state)} ${safe(indemnitor?.zip)}`, col1, y, font, fontBold);
  y -= 18;
  
  drawField(page, "Driver's License", safe(indemnitor?.driversLicense), col1, y, font, fontBold);
  drawField(page, 'DL State', safe(indemnitor?.dlState), col2, y, font, fontBold);
  y -= 18;
  
  drawField(page, 'Employer', safe(indemnitor?.employer), col1, y, font, fontBold);
  drawField(page, 'Position', safe(indemnitor?.position), col2, y, font, fontBold);
  y -= 30;
  
  drawLine(page, y, width);
  y -= 20;
  
  // DEFENDANT SECTION
  y = drawSectionHeader(page, 'DEFENDANT INFORMATION', y, font, fontBold, width);
  
  drawField(page, 'Full Name', `${safe(defendant?.firstName)} ${safe(defendant?.lastName)}`, col1, y, font, fontBold);
  drawField(page, 'AKA/Alias', safe(defendant?.aka), col2, y, font, fontBold);
  y -= 18;
  
  drawField(page, 'Date of Birth', formatDate(defendant?.dob), col1, y, font, fontBold);
  drawField(page, 'SSN', defendant?.ssn ? `XXX-XX-${safe(defendant?.ssn).slice(-4)}` : '', col2, y, font, fontBold);
  y -= 18;
  
  drawField(page, 'Home Phone', formatPhone(defendant?.homePhone), col1, y, font, fontBold);
  drawField(page, 'Cell Phone', formatPhone(defendant?.cellPhone), col2, y, font, fontBold);
  y -= 18;
  
  drawField(page, 'Address', safe(defendant?.address), col1, y, font, fontBold, 60);
  y -= 18;
  
  drawField(page, 'City/State/Zip', `${safe(defendant?.city)}, ${safe(defendant?.state)} ${safe(defendant?.zip)}`, col1, y, font, fontBold);
  y -= 18;
  
  drawField(page, 'Employer', safe(defendant?.employer), col1, y, font, fontBold);
  drawField(page, 'Occupation', safe(defendant?.occupation), col2, y, font, fontBold);
  y -= 30;
  
  drawLine(page, y, width);
  y -= 20;
  
  // CASE INFORMATION
  y = drawSectionHeader(page, 'CASE INFORMATION', y, font, fontBold, width);
  
  drawField(page, 'Charges', safe(defendant?.charges), col1, y, font, fontBold);
  y -= 18;
  
  drawField(page, 'Case Number', safe(defendant?.caseNumber), col1, y, font, fontBold);
  drawField(page, 'Court', safe(defendant?.courtName), col2, y, font, fontBold);
  y -= 18;
  
  drawField(page, 'Jail Location', safe(defendant?.jailLocation), col1, y, font, fontBold);
  drawField(page, 'Booking #', safe(defendant?.bookingNumber), col2, y, font, fontBold);
  y -= 18;
  
  drawField(page, 'Arrest Date', formatDate(defendant?.arrestDate), col1, y, font, fontBold);
  drawField(page, 'Court Date', formatDate(defendant?.appearanceDate), col2, y, font, fontBold);
  y -= 40;
  
  drawLine(page, y, width);
  y -= 20;
  
  // SIGNATURES
  y = drawSectionHeader(page, 'SIGNATURES', y, font, fontBold, width);
  
  page.drawText('Co-Signer/Indemnitor Signature:', { x: col1, y: y, size: 9, font: fontBold, color: rgb(0.3, 0.3, 0.3) });
  drawLine(page, y - 5, 280);
  await embedSignature(pdfDoc, page, signatures.indemnitor, col1 + 10, y - 40, 150, 35);
  
  page.drawText('Date: ' + formatDate(new Date()), { x: 300, y: y, size: 9, font: font, color: rgb(0, 0, 0) });
  y -= 60;
  
  page.drawText('Defendant Signature (if available):', { x: col1, y: y, size: 9, font: fontBold, color: rgb(0.3, 0.3, 0.3) });
  drawLine(page, y - 5, 280);
  await embedSignature(pdfDoc, page, signatures.defendant, col1 + 10, y - 40, 150, 35);
  
  page.drawText('Date: ' + formatDate(new Date()), { x: 300, y: y, size: 9, font: font, color: rgb(0, 0, 0) });
  
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes).toString('base64');
}

// ============================================================================
// INDEMNITOR APPLICATION (3 pages)
// ============================================================================
async function generateIndemnitorApplication(company, defendant, indemnitor, references, signatures) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // PAGE 1
  const page1 = pdfDoc.addPage([612, 792]);
  const { width, height } = page1.getSize();
  let y = height - 50;
  
  page1.drawText('BAIL BOND APPLICATION - INDEMNITOR', {
    x: width / 2 - 120,
    y: y,
    size: 16,
    font: fontBold,
  });
  y -= 15;
  
  page1.drawText(safe(company?.name, 'Bail Bonds Company'), {
    x: width / 2 - 80,
    y: y,
    size: 12,
    font: font,
    color: rgb(0.3, 0.3, 0.3),
  });
  y -= 30;
  
  drawLine(page1, y, width);
  y -= 20;
  
  const col1 = 50;
  const col2 = 320;
  
  y = drawSectionHeader(page1, 'DEFENDANT INFORMATION', y, font, fontBold, width);
  
  drawField(page1, 'Defendant Name', `${safe(defendant?.firstName)} ${safe(defendant?.lastName)}`, col1, y, font, fontBold);
  drawField(page1, 'DOB', formatDate(defendant?.dob), col2, y, font, fontBold, 40);
  y -= 18;
  
  drawField(page1, 'Charges', safe(defendant?.charges), col1, y, font, fontBold);
  y -= 18;
  
  drawField(page1, 'Case Number', safe(defendant?.caseNumber), col1, y, font, fontBold);
  drawField(page1, 'Court', safe(defendant?.courtName), col2, y, font, fontBold, 40);
  y -= 18;
  
  drawField(page1, 'Jail/Facility', safe(defendant?.jailLocation), col1, y, font, fontBold);
  drawField(page1, 'Booking #', safe(defendant?.bookingNumber), col2, y, font, fontBold, 60);
  y -= 18;
  
  drawField(page1, 'Court Date', formatDate(defendant?.appearanceDate), col1, y, font, fontBold);
  y -= 30;
  
  drawLine(page1, y, width);
  y -= 20;
  
  y = drawSectionHeader(page1, 'INDEMNITOR INFORMATION', y, font, fontBold, width);
  
  drawField(page1, 'Full Name', `${safe(indemnitor?.firstName)} ${safe(indemnitor?.lastName)}`, col1, y, font, fontBold);
  drawField(page1, 'Nickname', safe(indemnitor?.nickname), col2, y, font, fontBold, 60);
  y -= 18;
  
  drawField(page1, 'Relationship', safe(indemnitor?.relationshipToDefendant), col1, y, font, fontBold);
  drawField(page1, 'DOB', formatDate(indemnitor?.dob), col2, y, font, fontBold, 40);
  y -= 18;
  
  drawField(page1, 'SSN', indemnitor?.ssn ? `XXX-XX-${safe(indemnitor?.ssn).slice(-4)}` : '', col1, y, font, fontBold);
  drawField(page1, 'Gender', safe(indemnitor?.gender) === 'M' ? 'Male' : safe(indemnitor?.gender) === 'F' ? 'Female' : '', col2, y, font, fontBold, 50);
  y -= 18;
  
  drawField(page1, 'Home Phone', formatPhone(indemnitor?.homePhone), col1, y, font, fontBold);
  drawField(page1, 'Cell Phone', formatPhone(indemnitor?.cellPhone), col2, y, font, fontBold, 70);
  y -= 18;
  
  drawField(page1, 'Work Phone', formatPhone(indemnitor?.workPhone), col1, y, font, fontBold);
  drawField(page1, 'Email', safe(indemnitor?.email), col2, y, font, fontBold, 40);
  y -= 18;
  
  drawField(page1, 'Address', safe(indemnitor?.address), col1, y, font, fontBold, 55);
  y -= 18;
  
  drawField(page1, 'City/State/Zip', `${safe(indemnitor?.city)}, ${safe(indemnitor?.state)} ${safe(indemnitor?.zip)}`, col1, y, font, fontBold);
  y -= 18;
  
  drawField(page1, "Driver's License", safe(indemnitor?.driversLicense), col1, y, font, fontBold);
  drawField(page1, 'State', safe(indemnitor?.dlState), col2, y, font, fontBold, 40);
  y -= 18;
  
  drawField(page1, 'US Citizen', indemnitor?.usCitizen === true ? 'Yes' : indemnitor?.usCitizen === false ? 'No' : '', col1, y, font, fontBold);
  drawField(page1, 'Marital Status', safe(indemnitor?.maritalStatus), col2, y, font, fontBold, 80);
  y -= 30;
  
  drawLine(page1, y, width);
  y -= 20;
  
  y = drawSectionHeader(page1, 'EMPLOYMENT INFORMATION', y, font, fontBold, width);
  
  drawField(page1, 'Employer', safe(indemnitor?.employer), col1, y, font, fontBold);
  drawField(page1, 'Position', safe(indemnitor?.position), col2, y, font, fontBold, 55);
  y -= 18;
  
  drawField(page1, 'Employer Phone', formatPhone(indemnitor?.employerPhone), col1, y, font, fontBold);
  drawField(page1, 'Monthly Income', formatCurrency(indemnitor?.monthlyIncome), col2, y, font, fontBold, 90);
  y -= 18;
  
  drawField(page1, 'Own/Rent', safe(indemnitor?.ownershipStatus), col1, y, font, fontBold);
  
  // PAGE 2 - References
  const page2 = pdfDoc.addPage([612, 792]);
  y = height - 50;
  
  page2.drawText('BAIL BOND APPLICATION - INDEMNITOR (Page 2)', {
    x: width / 2 - 140,
    y: y,
    size: 14,
    font: fontBold,
  });
  y -= 30;
  
  drawLine(page2, y, width);
  y -= 20;
  
  y = drawSectionHeader(page2, 'PERSONAL REFERENCES', y, font, fontBold, width);
  
  if (references && references.length > 0) {
    references.forEach((ref, i) => {
      page2.drawText(`Reference ${i + 1}:`, { x: col1, y: y, size: 10, font: fontBold, color: rgb(0, 0, 0) });
      y -= 18;
      
      drawField(page2, 'Name', safe(ref?.name), col1 + 20, y, font, fontBold, 40);
      drawField(page2, 'Relationship', safe(ref?.relationship), col2, y, font, fontBold, 80);
      y -= 18;
      
      drawField(page2, 'Phone', formatPhone(ref?.phone), col1 + 20, y, font, fontBold, 40);
      drawField(page2, 'Work Phone', formatPhone(ref?.workPhone), col2, y, font, fontBold, 80);
      y -= 18;
      
      const addr = ref?.fullAddress || `${safe(ref?.address)} ${safe(ref?.city)}, ${safe(ref?.state)} ${safe(ref?.zip)}`.trim();
      drawField(page2, 'Address', addr, col1 + 20, y, font, fontBold, 50);
      y -= 25;
      
      drawLine(page2, y, width);
      y -= 15;
    });
  }
  
  y -= 20;
  y = drawSectionHeader(page2, 'INDEMNITOR SIGNATURE', y, font, fontBold, width);
  
  page2.drawText('I certify that all information provided is true and correct.', {
    x: col1,
    y: y,
    size: 9,
    font: font,
    color: rgb(0.3, 0.3, 0.3),
  });
  y -= 20;
  
  page2.drawText('Signature:', { x: col1, y: y, size: 9, font: fontBold, color: rgb(0.3, 0.3, 0.3) });
  drawLine(page2, y - 5, 280);
  await embedSignature(pdfDoc, page2, signatures.indemnitor, col1 + 60, y - 40, 180, 40);
  
  page2.drawText('Date: ' + formatDate(new Date()), { x: 320, y: y, size: 9, font: font });
  y -= 60;
  
  page2.drawText('Printed Name: ' + `${safe(indemnitor?.firstName)} ${safe(indemnitor?.lastName)}`, {
    x: col1,
    y: y,
    size: 10,
    font: font,
  });
  
  // PAGE 3 - Terms
  const page3 = pdfDoc.addPage([612, 792]);
  y = height - 50;
  
  page3.drawText('INDEMNITY AGREEMENT - TERMS AND CONDITIONS', {
    x: width / 2 - 150,
    y: y,
    size: 14,
    font: fontBold,
  });
  y -= 30;
  
  drawLine(page3, y, width);
  y -= 20;
  
  const terms = [
    '1. PREMIUM: The premium charged for the bail bond is fully earned upon execution of the bond',
    '   and is NOT refundable under any circumstances.',
    '',
    '2. INDEMNIFICATION: The undersigned agrees to indemnify and hold harmless the Surety from',
    '   all claims, demands, liabilities, costs, charges, legal fees and expenses of whatever kind.',
    '',
    '3. COLLATERAL: Any collateral deposited shall be held as security and may be applied to any',
    '   losses or expenses incurred by the Surety.',
    '',
    '4. DEFENDANT APPEARANCE: The undersigned guarantees that the defendant will appear at all',
    '   court proceedings until the case is fully disposed.',
    '',
    '5. BREACH: If the defendant fails to appear, the undersigned shall be liable for:',
    '   - The full amount of the bail bond',
    '   - All costs of apprehension and return of the defendant',
    '   - Attorney fees and court costs',
    '   - Any other expenses incurred by the Surety',
    '',
    '6. SURRENDER: The Surety reserves the right to surrender the defendant to custody at any time.',
    '',
    '7. CHANGES: Any change of address or contact information must be reported immediately.',
  ];
  
  terms.forEach(line => {
    page3.drawText(line, { x: col1, y: y, size: 9, font: font, color: rgb(0, 0, 0) });
    y -= 14;
  });
  
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes).toString('base64');
}

// ============================================================================
// IMMIGRATION BOND AGREEMENT
// ============================================================================
async function generateBondAgreement(company, defendant, indemnitor, bond, signatures) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  const page = pdfDoc.addPage([612, 792]);
  const { width, height } = page.getSize();
  let y = height - 50;
  
  page.drawText('IMMIGRATION BOND AGREEMENT', {
    x: width / 2 - 100,
    y: y,
    size: 16,
    font: fontBold,
  });
  y -= 15;
  
  page.drawText(safe(company?.name, 'Bail Bonds Company'), {
    x: width / 2 - 80,
    y: y,
    size: 12,
    font: font,
    color: rgb(0.3, 0.3, 0.3),
  });
  y -= 30;
  
  drawLine(page, y, width);
  y -= 20;
  
  const col1 = 50;
  const col2 = 320;
  
  y = drawSectionHeader(page, 'AGREEMENT DETAILS', y, font, fontBold, width);
  
  drawField(page, 'Defendant/Alien', `${safe(defendant?.firstName)} ${safe(defendant?.lastName)}`, col1, y, font, fontBold);
  y -= 18;
  
  drawField(page, 'Alien Number', safe(defendant?.alienNumber), col1, y, font, fontBold);
  drawField(page, 'DOB', formatDate(defendant?.dob), col2, y, font, fontBold, 40);
  y -= 18;
  
  drawField(page, 'Defendant Address', `${safe(defendant?.address)}, ${safe(defendant?.city)}, ${safe(defendant?.state)} ${safe(defendant?.zip)}`, col1, y, font, fontBold, 110);
  y -= 30;
  
  drawLine(page, y, width);
  y -= 20;
  
  y = drawSectionHeader(page, 'INDEMNITOR INFORMATION', y, font, fontBold, width);
  
  drawField(page, 'Indemnitor Name', `${safe(indemnitor?.firstName)} ${safe(indemnitor?.lastName)}`, col1, y, font, fontBold);
  y -= 18;
  
  drawField(page, 'Indemnitor Address', `${safe(indemnitor?.address)}, ${safe(indemnitor?.city)}, ${safe(indemnitor?.state)} ${safe(indemnitor?.zip)}`, col1, y, font, fontBold, 110);
  y -= 18;
  
  drawField(page, 'Phone', formatPhone(indemnitor?.cellPhone || indemnitor?.homePhone), col1, y, font, fontBold);
  drawField(page, 'Email', safe(indemnitor?.email), col2, y, font, fontBold, 40);
  y -= 30;
  
  drawLine(page, y, width);
  y -= 20;
  
  y = drawSectionHeader(page, 'BOND DETAILS', y, font, fontBold, width);
  
  drawField(page, 'Bond Amount', formatCurrency(bond?.amount), col1, y, font, fontBold);
  drawField(page, 'Premium', formatCurrency(bond?.premium), col2, y, font, fontBold, 60);
  y -= 18;
  
  drawField(page, 'Power Number', safe(bond?.powerNumber), col1, y, font, fontBold);
  y -= 40;
  
  drawLine(page, y, width);
  y -= 20;
  
  page.drawText('TERMS: The premium is fully earned and NON-REFUNDABLE. The undersigned agrees', {
    x: col1, y: y, size: 9, font: font,
  });
  y -= 14;
  page.drawText('to indemnify the Surety for any and all losses arising from this bond.', {
    x: col1, y: y, size: 9, font: font,
  });
  y -= 30;
  
  y = drawSectionHeader(page, 'INDEMNITOR SIGNATURE', y, font, fontBold, width);
  
  page.drawText('Signature:', { x: col1, y: y, size: 9, font: fontBold, color: rgb(0.3, 0.3, 0.3) });
  drawLine(page, y - 5, 280);
  await embedSignature(pdfDoc, page, signatures.indemnitor, col1 + 60, y - 40, 180, 40);
  
  page.drawText('Date: ' + formatDate(new Date()), { x: 320, y: y, size: 9, font: font });
  y -= 60;
  
  page.drawText('Printed Name: ' + `${safe(indemnitor?.firstName)} ${safe(indemnitor?.lastName)}`, {
    x: col1, y: y, size: 10, font: font,
  });
  
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes).toString('base64');
}

// ============================================================================
// IMMIGRATION WAIVER
// ============================================================================
async function generateImmigrationWaiver(company, defendant, indemnitor, signatures) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  const page = pdfDoc.addPage([612, 792]);
  const { width, height } = page.getSize();
  let y = height - 50;
  
  page.drawText('IMMIGRATION WAIVER', {
    x: width / 2 - 70,
    y: y,
    size: 16,
    font: fontBold,
  });
  y -= 15;
  
  page.drawText(safe(company?.name, 'Bail Bonds Company'), {
    x: width / 2 - 80,
    y: y,
    size: 12,
    font: font,
    color: rgb(0.3, 0.3, 0.3),
  });
  y -= 30;
  
  drawLine(page, y, width);
  y -= 30;
  
  const col1 = 50;
  const indemnitorName = `${safe(indemnitor?.firstName)} ${safe(indemnitor?.lastName)}`;
  const defendantName = `${safe(defendant?.firstName)} ${safe(defendant?.lastName)}`;
  
  page.drawText('CITIZENSHIP WAIVER STATEMENT', {
    x: col1,
    y: y,
    size: 12,
    font: fontBold,
  });
  y -= 25;
  
  const englishText = [
    `I, ${indemnitorName}, the undersigned co-signer/indemnitor, do hereby represent and warrant`,
    `that ${defendantName}, the defendant, IS A CITIZEN OF THE UNITED STATES.`,
    '',
    'I understand that if the defendant is NOT a U.S. citizen, the following applies:',
    '',
    '   * The bond premium is fully earned and NON-REFUNDABLE',
    '   * Any collateral posted may be forfeited',
    '   * I may be liable for the full bond amount plus expenses',
    '   * Immigration bonds have additional requirements and conditions',
    '',
    'I have made this representation knowingly and voluntarily, and I understand',
    'the consequences if this representation is false.',
  ];
  
  englishText.forEach(line => {
    page.drawText(line, { x: col1, y: y, size: 10, font: font });
    y -= 16;
  });
  
  y -= 20;
  
  page.drawText('Co-Signer Signature:', { x: col1, y: y, size: 9, font: fontBold, color: rgb(0.3, 0.3, 0.3) });
  drawLine(page, y - 5, 280);
  await embedSignature(pdfDoc, page, signatures.waiver || signatures.indemnitor, col1 + 10, y - 45, 180, 40);
  
  page.drawText('Date: ' + formatDate(new Date()), { x: 320, y: y, size: 9, font: font });
  y -= 60;
  
  page.drawText('Printed Name: ' + indemnitorName, { x: col1, y: y, size: 10, font: font });
  y -= 40;
  
  drawLine(page, y, width);
  y -= 30;
  
  page.drawText('DECLARACION DE EXENCION DE CIUDADANIA (Spanish)', {
    x: col1,
    y: y,
    size: 12,
    font: fontBold,
  });
  y -= 25;
  
  const spanishText = [
    `Yo, ${indemnitorName}, el co-firmante/indemnizador abajo firmante, por la presente`,
    `declaro y garantizo que ${defendantName}, el acusado, ES CIUDADANO DE LOS`,
    'ESTADOS UNIDOS.',
    '',
    'Entiendo que si el acusado NO es ciudadano estadounidense, se aplica lo siguiente:',
    '',
    '   * La prima del bono esta totalmente devengada y NO ES REEMBOLSABLE',
    '   * Cualquier garantia depositada puede ser confiscada',
  ];
  
  spanishText.forEach(line => {
    page.drawText(line, { x: col1, y: y, size: 10, font: font });
    y -= 16;
  });
  
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes).toString('base64');
}

// ============================================================================
// REFERENCE FORM
// ============================================================================
async function generateReferenceForm(company, defendant, indemnitor, references, bond, signatures) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  const page = pdfDoc.addPage([612, 792]);
  const { width, height } = page.getSize();
  let y = height - 50;
  
  page.drawText('PERSONAL REFERENCE FORM', {
    x: width / 2 - 90,
    y: y,
    size: 16,
    font: fontBold,
  });
  y -= 15;
  
  page.drawText(safe(company?.name, 'Bail Bonds Company'), {
    x: width / 2 - 80,
    y: y,
    size: 12,
    font: font,
    color: rgb(0.3, 0.3, 0.3),
  });
  y -= 30;
  
  drawLine(page, y, width);
  y -= 20;
  
  const col1 = 50;
  const col2 = 320;
  
  y = drawSectionHeader(page, 'APPLICANT INFORMATION', y, font, fontBold, width);
  
  drawField(page, 'Applicant Name', `${safe(indemnitor?.firstName)} ${safe(indemnitor?.lastName)}`, col1, y, font, fontBold);
  y -= 18;
  
  drawField(page, 'Defendant Name', `${safe(defendant?.firstName)} ${safe(defendant?.lastName)}`, col1, y, font, fontBold);
  y -= 18;
  
  drawField(page, 'Bond Amount', formatCurrency(bond?.amount), col1, y, font, fontBold);
  y -= 30;
  
  drawLine(page, y, width);
  y -= 20;
  
  y = drawSectionHeader(page, 'PERSONAL REFERENCES', y, font, fontBold, width);
  
  page.drawText('The following persons can verify my identity and character:', {
    x: col1, y: y, size: 9, font: font, color: rgb(0.3, 0.3, 0.3),
  });
  y -= 20;
  
  if (references && references.length > 0) {
    references.forEach((ref, i) => {
      page.drawRectangle({
        x: col1 - 5,
        y: y - 5,
        width: width - 90,
        height: 18,
        color: rgb(0.95, 0.95, 0.95),
      });
      page.drawText(`Reference ${i + 1}`, { x: col1, y: y, size: 10, font: fontBold });
      y -= 22;
      
      drawField(page, 'Name', safe(ref?.name), col1 + 10, y, font, fontBold, 40);
      drawField(page, 'Relationship', safe(ref?.relationship), col2, y, font, fontBold, 80);
      y -= 18;
      
      drawField(page, 'Phone', formatPhone(ref?.phone), col1 + 10, y, font, fontBold, 40);
      drawField(page, 'Work Phone', formatPhone(ref?.workPhone), col2, y, font, fontBold, 80);
      y -= 18;
      
      const addr = ref?.fullAddress || `${safe(ref?.address)} ${safe(ref?.city)}, ${safe(ref?.state)} ${safe(ref?.zip)}`.trim();
      if (addr.trim()) {
        drawField(page, 'Address', addr, col1 + 10, y, font, fontBold, 50);
        y -= 18;
      }
      
      y -= 15;
    });
  } else {
    page.drawText('No references provided', { x: col1, y: y, size: 10, font: font, color: rgb(0.5, 0.5, 0.5) });
    y -= 20;
  }
  
  y -= 20;
  drawLine(page, y, width);
  y -= 20;
  
  y = drawSectionHeader(page, 'APPLICANT SIGNATURE', y, font, fontBold, width);
  
  page.drawText('I certify that the above references are accurate and may be contacted.', {
    x: col1, y: y, size: 9, font: font, color: rgb(0.3, 0.3, 0.3),
  });
  y -= 25;
  
  page.drawText('Signature:', { x: col1, y: y, size: 9, font: fontBold, color: rgb(0.3, 0.3, 0.3) });
  drawLine(page, y - 5, 280);
  await embedSignature(pdfDoc, page, signatures.applicant || signatures.indemnitor, col1 + 60, y - 45, 180, 40);
  
  page.drawText('Date: ' + formatDate(new Date()), { x: 320, y: y, size: 9, font: font });
  y -= 60;
  
  page.drawText('Printed Name: ' + `${safe(indemnitor?.firstName)} ${safe(indemnitor?.lastName)}`, {
    x: col1, y: y, size: 10, font: font,
  });
  
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes).toString('base64');
}
