import { z } from 'zod';

const INQUIRY_STATUSES = ['NEW', 'IN_PROGRESS', 'RESOLVED'];

const requiredText = (max) => z.string().trim().min(1).max(max);

export const createInquirySchema = z
  .object({
    customerName: requiredText(200),
    customerContact: requiredText(200),
    subject: requiredText(200),
    description: requiredText(5000),
  })
  .strict();

export const updateInquiryStatusSchema = z
  .object({
    status: z.enum(INQUIRY_STATUSES),
  })
  .strict();

export const inquiryIdSchema = z.uuid();

export const listInquiriesQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  status: z.enum(INQUIRY_STATUSES).optional(),
});
