import { Router } from 'express';
import prisma from '../db.js';
import { publicInquiry } from '../lib/publicInquiry.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import {
  createInquirySchema,
  inquiryIdSchema,
  listInquiriesQuerySchema,
  updateInquiryStatusSchema,
} from '../validation/inquiries.js';

const router = Router();

const inquiryInclude = { createdBy: true };

function parseInquiryId(id) {
  return inquiryIdSchema.safeParse(id);
}

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const parsed = createInquirySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed' });
      return;
    }

    const inquiry = await prisma.inquiry.create({
      data: {
        customerName: parsed.data.customerName,
        customerContact: parsed.data.customerContact,
        subject: parsed.data.subject,
        description: parsed.data.description,
        status: 'NEW',
        createdById: req.session.userId,
      },
      include: inquiryInclude,
    });

    res.status(201).json({ inquiry: publicInquiry(inquiry) });
  }),
);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const rawQ = typeof req.query.q === 'string' && req.query.q.trim() === '' ? undefined : req.query.q;
    const parsed = listInquiriesQuerySchema.safeParse({
      q: rawQ,
      status: req.query.status,
    });

    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed' });
      return;
    }

    const where = {};
    if (parsed.data.status) {
      where.status = parsed.data.status;
    }
    if (parsed.data.q) {
      where.OR = [
        { customerName: { contains: parsed.data.q, mode: 'insensitive' } },
        { subject: { contains: parsed.data.q, mode: 'insensitive' } },
      ];
    }

    const inquiries = await prisma.inquiry.findMany({
      where,
      include: inquiryInclude,
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ inquiries: inquiries.map(publicInquiry) });
  }),
);

router.patch(
  '/:id/status',
  asyncHandler(async (req, res) => {
    const idParsed = parseInquiryId(req.params.id);
    if (!idParsed.success) {
      res.status(400).json({ error: 'Validation failed' });
      return;
    }

    const bodyParsed = updateInquiryStatusSchema.safeParse(req.body);
    if (!bodyParsed.success) {
      res.status(400).json({ error: 'Validation failed' });
      return;
    }

    try {
      const inquiry = await prisma.inquiry.update({
        where: { id: idParsed.data },
        data: { status: bodyParsed.data.status },
        include: inquiryInclude,
      });
      res.status(200).json({ inquiry: publicInquiry(inquiry) });
    } catch (err) {
      if (err?.code === 'P2025') {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      throw err;
    }
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const idParsed = parseInquiryId(req.params.id);
    if (!idParsed.success) {
      res.status(400).json({ error: 'Validation failed' });
      return;
    }

    const inquiry = await prisma.inquiry.findUnique({
      where: { id: idParsed.data },
      include: inquiryInclude,
    });

    if (!inquiry) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    res.status(200).json({ inquiry: publicInquiry(inquiry) });
  }),
);

export default router;
