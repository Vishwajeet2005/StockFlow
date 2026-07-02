import cron from 'node-cron';
import nodemailer from 'nodemailer';
import { prisma } from '../db';
import * as Sentry from '@sentry/node';

// Fallback test account details using Ethereal Email (for development)
// In production, configure SMTP via environment variables
let transporter: nodemailer.Transporter | null = null;

async function initTransporter() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    console.log('No SMTP credentials found in env. Generating Ethereal test account...');
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log(`Ethereal Test Email Server configured. User: ${testAccount.user}`);
  }
}

export async function processLowStockAlerts() {
  try {
    if (!transporter) await initTransporter();
    
    // Find all companies that have a notification email set
    const companies = await prisma.company.findMany({
      where: {
        notificationEmail: { not: null }
      }
    });

    for (const company of companies) {
      if (!company.notificationEmail) continue;

      // Find products in this company that are below or equal to their minStockLevel
      const lowStockProducts: any[] = await prisma.$queryRaw`
        SELECT product_code, name, quantity, min_stock_level 
        FROM products 
        WHERE company_id = ${company.id} AND quantity <= min_stock_level
      `;

      if (lowStockProducts.length === 0) continue;

      // Compile email
      let htmlRows = lowStockProducts.map(p => 
        `<tr>
          <td style="padding:8px; border:1px solid #ddd;">${p.product_code}</td>
          <td style="padding:8px; border:1px solid #ddd;">${p.name}</td>
          <td style="padding:8px; border:1px solid #ddd; color:red; font-weight:bold;">${p.quantity}</td>
          <td style="padding:8px; border:1px solid #ddd;">${p.min_stock_level}</td>
        </tr>`
      ).join('');

      const htmlContent = `
        <div style="font-family: sans-serif; color: #333;">
          <h2>Low Stock Alert</h2>
          <p>Hello ${company.name} Admin,</p>
          <p>The following products in your workspace have fallen below their designated minimum stock thresholds:</p>
          <table style="border-collapse: collapse; width: 100%; text-align: left; margin-top: 15px;">
            <thead>
              <tr>
                <th style="padding:8px; border:1px solid #ddd; background-color:#f4f4f5;">Product Code</th>
                <th style="padding:8px; border:1px solid #ddd; background-color:#f4f4f5;">Product Name</th>
                <th style="padding:8px; border:1px solid #ddd; background-color:#f4f4f5;">Current Qty</th>
                <th style="padding:8px; border:1px solid #ddd; background-color:#f4f4f5;">Threshold</th>
              </tr>
            </thead>
            <tbody>
              ${htmlRows}
            </tbody>
          </table>
          <p style="margin-top:20px; font-size: 12px; color: #666;">This is an automated message from StockFlow. You can update your notification preferences in the Workspace Settings.</p>
        </div>
      `;

      const info = await transporter!.sendMail({
        from: '"StockFlow Alerts" <alerts@stockflow.com>',
        to: company.notificationEmail,
        subject: `[StockFlow] Low Stock Alert - ${lowStockProducts.length} items`,
        html: htmlContent,
      });

      console.log(`Alert email sent to ${company.notificationEmail}. Message ID: ${info.messageId}`);
      
      // If using Ethereal, log the preview URL
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`Preview URL: ${previewUrl}`);
      }
    }
  } catch (error) {
    console.error('Failed to process low stock alerts:', error);
    Sentry.captureException(error);
  }
}

// Start the cron job
export function initAlertScheduler() {
  // Run daily at 08:00 AM
  cron.schedule('0 8 * * *', () => {
    console.log('Running scheduled low stock alerts check...');
    processLowStockAlerts();
  });
  console.log('Email alert scheduler initialized.');
}
