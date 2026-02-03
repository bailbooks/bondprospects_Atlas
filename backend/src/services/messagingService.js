/**
 * Messaging Service - Email (Mailgun) and SMS (Twilio)
 */

// Mailgun setup
const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN || 'mail.bondprospects.com';
const MAILGUN_FROM = process.env.MAILGUN_FROM || 'BondProspects <noreply@bondprospects.com>';

// Twilio setup
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

/**
 * Send email via Mailgun
 */
export async function sendEmail({ to, subject, text, html }) {
  if (!MAILGUN_API_KEY) {
    console.warn('Mailgun API key not configured, skipping email');
    return { success: false, error: 'Email not configured' };
  }

  try {
    const formData = new URLSearchParams();
    formData.append('from', MAILGUN_FROM);
    formData.append('to', to);
    formData.append('subject', subject);
    if (text) formData.append('text', text);
    if (html) formData.append('html', html);

    const response = await fetch(`https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`api:${MAILGUN_API_KEY}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Mailgun error:', error);
      return { success: false, error };
    }

    const result = await response.json();
    console.log('Email sent:', result.id);
    return { success: true, messageId: result.id };

  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send SMS via Twilio
 */
export async function sendSMS({ to, body }) {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.warn('Twilio not configured, skipping SMS');
    return { success: false, error: 'SMS not configured' };
  }

  try {
    // Format phone number (ensure it starts with +1 for US)
    let formattedPhone = to.replace(/\D/g, '');
    if (formattedPhone.length === 10) {
      formattedPhone = '+1' + formattedPhone;
    } else if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone;
    }

    const formData = new URLSearchParams();
    formData.append('To', formattedPhone);
    formData.append('From', TWILIO_PHONE_NUMBER);
    formData.append('Body', body);

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('Twilio error:', error);
      return { success: false, error: error.message || 'SMS failed' };
    }

    const result = await response.json();
    console.log('SMS sent:', result.sid);
    return { success: true, messageId: result.sid };

  } catch (error) {
    console.error('SMS send error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send E-Sign Request to co-signer
 */
export async function sendESignRequest({ 
  deliveryMethod, // 'email' or 'sms'
  recipientEmail,
  recipientPhone,
  recipientName,
  defendantName,
  companyName,
  intakeUrl,
}) {
  const linkText = `${recipientName}, please click on the link below to fill out information about yourself for the bond(s) for ${defendantName}.\n\n${intakeUrl}`;

  if (deliveryMethod === 'email') {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">E-Sign Request from ${companyName}</h2>
        <p>Hello ${recipientName},</p>
        <p>Please click the link below to fill out the required information for the bond(s) for <strong>${defendantName}</strong>.</p>
        <p style="margin: 30px 0;">
          <a href="${intakeUrl}" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Complete E-Sign Forms
          </a>
        </p>
        <p>Or copy and paste this link into your browser:</p>
        <p style="color: #666; word-break: break-all;">${intakeUrl}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="color: #888; font-size: 12px;">
          This link was sent by ${companyName}. If you have questions, please contact them directly.
        </p>
      </div>
    `;

    return await sendEmail({
      to: recipientEmail,
      subject: `E-Sign Request: Bond forms for ${defendantName}`,
      text: linkText,
      html,
    });

  } else if (deliveryMethod === 'sms') {
    return await sendSMS({
      to: recipientPhone,
      body: linkText,
    });
  }

  return { success: false, error: 'Invalid delivery method' };
}

/**
 * Send completion notification to agent
 */
export async function sendCompletionNotification({
  agentEmail,
  companyName,
  defendantName,
  coSignerName,
  intakeId,
}) {
  if (!agentEmail) {
    return { success: false, error: 'No agent email provided' };
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #22c55e;">✓ E-Sign Request Completed</h2>
      <p>The e-sign request for <strong>${defendantName}</strong> has been completed.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Defendant:</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>${defendantName}</strong></td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Co-Signer:</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>${coSignerName}</strong></td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Reference:</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>${intakeId}</strong></td>
        </tr>
      </table>
      <p>The signed documents are now available in BondProspects and will sync to Bailbooks shortly.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
      <p style="color: #888; font-size: 12px;">
        This notification was sent by BondProspects for ${companyName}.
      </p>
    </div>
  `;

  return await sendEmail({
    to: agentEmail,
    subject: `E-Sign Completed: ${defendantName}`,
    text: `E-Sign request completed for ${defendantName}. Co-signer: ${coSignerName}. Reference: ${intakeId}`,
    html,
  });
}
