import { prisma } from '../db';
import * as Sentry from '@sentry/node';

/**
 * Logs a critical system action to the database.
 * If the database logging fails, it will send the failure to Sentry.
 */
export const auditLog = async (
  companyId: number,
  userId: number | null,
  action: string,
  ipAddress?: string,
  details?: object | string
) => {
  try {
    let detailsString = '';
    if (typeof details === 'object') {
      detailsString = JSON.stringify(details);
    } else if (typeof details === 'string') {
      detailsString = details;
    }

    await prisma.auditLog.create({
      data: {
        companyId,
        userId,
        action,
        ipAddress: ipAddress || null,
        details: detailsString || null,
      },
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
    Sentry.captureException(error);
  }
};
