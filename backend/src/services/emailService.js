import { Resend } from 'resend';

// Only initialize Resend if API key is present
const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

/**
 * Send completion email to bail bond agent with attached PDFs
 */
export async function sendCompletionEmail({ to, company, defendantName, indemnitorName, pdfs }) {
  if (!resend) {
    console.warn('RESEND_API_KEY not configured, skipping email');
    return { success: false, reason: 'Email not configured' };
  }
  
  // Convert PDFs to attachments
  const attachments = [];
  
  const pdfNames = {
    preApplication: 'Pre-Application',
    indemnitorApp: 'Indemnitor Application',
    bondAgreement: 'Bond Agreement',
    immigrationWaiver: 'Immigration Waiver',
    referenceForm: 'Reference Form'
  };
  
  for (const [key, base64Data] of Object.entries(pdfs)) {
    if (base64Data) {
      attachments.push({
        filename: `${defendantName.replace(/\s+/g, '_')}_${pdfNames[key] || key}.pdf`,
        content: base64Data // Resend accepts base64
      });
    }
  }
  
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a365d;">New Bail Bond Application Submitted</h2>
      
      <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Defendant:</strong> ${defendantName}</p>
        <p><strong>Indemnitor/Co-Signer:</strong> ${indemnitorName}</p>
        <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
      </div>
      
      <p>The completed forms are attached to this email:</p>
      <ul>
        ${attachments.map(a => `<li>${a.filename}</li>`).join('')}
      </ul>
      
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
      
      <p style="color: #718096; font-size: 12px;">
        This is an automated message from the Bail Forms App.
        The applicant submitted these forms electronically.
      </p>
    </div>
  `;
  
  try {
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Bail Forms <forms@yourdomain.com>',
      to: [to],
      subject: `New Application: ${defendantName} - Submitted by ${indemnitorName}`,
      html: emailHtml,
      attachments
    });
    
    console.log('Email sent successfully:', result.id);
    return { success: true, emailId: result.id };
    
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

/**
 * Send intake link to customer
 */
export async function sendIntakeLinkEmail({ to, formUrl, companyName, agentName, expiresAt }) {
  if (!resend) {
    console.warn('RESEND_API_KEY not configured, skipping email');
    return { success: false, reason: 'Email not configured' };
  }
  
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a365d;">Bail Bond Application</h2>
      
      <p>Hello,</p>
      
      <p>${agentName || 'Your bail bond agent'} from <strong>${companyName}</strong> has sent you 
      a link to complete your bail bond application forms online.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${formUrl}" 
           style="background: #3182ce; color: white; padding: 15px 30px; 
                  text-decoration: none; border-radius: 8px; font-weight: bold;">
          Complete Your Application
        </a>
      </div>
      
      <p>Or copy this link: <a href="${formUrl}">${formUrl}</a></p>
      
      <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; color: #92400e;">
          <strong>⚠️ This link expires:</strong> ${new Date(expiresAt).toLocaleDateString()}
        </p>
      </div>
      
      <p>What to expect:</p>
      <ul>
        <li>Fill out information about yourself and the defendant</li>
        <li>Provide references</li>
        <li>Sign the forms electronically</li>
        <li>Takes approximately 15-20 minutes</li>
      </ul>
      
      <p>If you have questions, contact ${companyName}.</p>
      
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
      
      <p style="color: #718096; font-size: 12px;">
        This email was sent by ${companyName} via the Bail Forms App.
      </p>
    </div>
  `;
  
  try {
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Bail Forms <forms@yourdomain.com>',
      to: [to],
      subject: `Complete Your Bail Bond Application - ${companyName}`,
      html: emailHtml
    });
    
    console.log('Intake link email sent:', result.id);
    return { success: true, emailId: result.id };
    
  } catch (error) {
    console.error('Failed to send intake link email:', error);
    throw error;
  }
}
