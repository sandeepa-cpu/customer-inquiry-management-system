import { vi } from 'vitest';

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export const setUnauthorizedHandler = vi.fn();
export const login = vi.fn();
export const logout = vi.fn();
export const me = vi.fn();
export const getHealth = vi.fn();
export const listInquiries = vi.fn();
export const createInquiry = vi.fn();
export const getInquiry = vi.fn();
export const updateInquiryStatus = vi.fn();
