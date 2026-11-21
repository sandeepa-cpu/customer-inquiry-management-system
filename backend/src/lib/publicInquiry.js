import { publicUser } from './publicUser.js';

export function publicInquiry(inquiry) {
  return {
    id: inquiry.id,
    customerName: inquiry.customerName,
    customerContact: inquiry.customerContact,
    subject: inquiry.subject,
    description: inquiry.description,
    status: inquiry.status,
    createdById: inquiry.createdById,
    createdBy: publicUser(inquiry.createdBy),
    createdAt: inquiry.createdAt,
    updatedAt: inquiry.updatedAt,
  };
}
