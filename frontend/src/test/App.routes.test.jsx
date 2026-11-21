import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { listInquiries, logout } from './mocks.js';
import { mockAuthenticated, mockUnauthenticated, renderApp } from './helpers.jsx';

vi.mock('../api.js', () => import('./mocks.js'));

describe('Protected routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    logout.mockResolvedValue(null);
    listInquiries.mockResolvedValue({ inquiries: [] });
  });

  test('unauthenticated visitors are sent to sign in from the dashboard', async () => {
    mockUnauthenticated();
    renderApp('/');

    expect(await screen.findByRole('heading', { name: 'Staff sign in' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Inquiries' })).not.toBeInTheDocument();
  });

  test('unauthenticated visitors cannot open create or details URLs', async () => {
    mockUnauthenticated();
    renderApp('/inquiries/new');

    expect(await screen.findByRole('heading', { name: 'Staff sign in' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Create inquiry' })).not.toBeInTheDocument();
  });

  test('unauthenticated visitors cannot open inquiry details', async () => {
    mockUnauthenticated();
    renderApp('/inquiries/inq-1');

    expect(await screen.findByRole('heading', { name: 'Staff sign in' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Inquiry details' })).not.toBeInTheDocument();
  });

  test('authenticated staff can open the dashboard', async () => {
    mockAuthenticated();
    renderApp('/');

    expect(await screen.findByRole('heading', { name: 'Inquiries' })).toBeInTheDocument();
  });
});
