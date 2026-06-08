const nodemailer = require('nodemailer');

/**
 * Send an email using Nodemailer SMTP with automatic fallback to Resend HTTP API.
 * 
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.html - Email HTML content
 * @returns {Promise<boolean>}
 */
const sendEmail = async ({ to, subject, html }) => {
  const fromEmail = process.env.SMTP_FROM || 'JK Home Care <onboarding@resend.dev>';

  // 1. Try sending via Nodemailer SMTP first
  try {
    console.log(`✉️ [Mail Gateway] Attempting SMTP email send to ${to}...`);
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.resend.com',
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: parseInt(process.env.SMTP_PORT || '465') === 465,
      auth: {
        user: process.env.SMTP_USER || 'resend',
        pass: process.env.SMTP_PASS
      },
      connectionTimeout: 5000, // 5s timeout to avoid blocking on Render
      greetingTimeout: 5000,
      socketTimeout: 5000
    });
    
    const info = await transporter.sendMail({
      from: fromEmail,
      to,
      subject,
      html
    });
    console.log(`✉️ Email sent successfully to ${to} via SMTP. MessageId: ${info.messageId}`);
    return true;
  } catch (smtpError) {
    console.warn(`⚠️ [Mail Gateway Warning] SMTP send failed: ${smtpError.message}. Trying Resend REST API fallback...`);
    
    // 2. Fallback to Resend REST API (HTTPS port 443 - never blocked by Render)
    const apiKey = process.env.RESEND_API_KEY || process.env.SMTP_PASS;
    if (!apiKey) {
      console.error('💥 [Mail Gateway Failure] No RESEND_API_KEY or SMTP_PASS found for API fallback.');
      return false;
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [to],
          subject,
          html
        })
      });
      
      const data = await response.json();
      if (response.ok) {
        console.log(`✉️ Email sent successfully to ${to} via Resend REST API fallback. ID: ${data.id}`);
        return true;
      } else {
        console.error('💥 [Mail Gateway Failure] Resend API fallback failed:', data.message || data);
        return false;
      }
    } catch (apiError) {
      console.error('💥 [Mail Gateway Failure] Exception during Resend API fallback:', apiError.message);
      return false;
    }
  }
};

module.exports = { sendEmail };
