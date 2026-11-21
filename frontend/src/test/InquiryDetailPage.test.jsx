import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { ApiError, getInquiry, logout, updateInquiryStatus } from './mocks.js';
import { mockAuthenticated, renderApp, sampleInquiry } from './helpers.jsx';

vi.mock('../api.js', () => import('./mocks.js'));

describe('Inquiry details', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthenticated();
    logout.mockResolvedValue(null);
  });

  test('loads inquiry details', async () => {
    let resolveInquiry;
    getInquiry.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveInquiry = resolve;
        }),
    );
    renderApp('/inquiries/inq-1');

    await screen.findByRole('heading', { name: 'Inquiry details' });
    expect(screen.getByText('Loading inquiry…')).toBeInTheDocument();
    resolveInquiry({ inquiry: sampleInquiry() });
    expect(await screen.findByText('CIMS-5D Assessment Recheck Customer')).toBeInTheDocument();
    expect(await screen.findByText('cims-5d-recheck@example.com')).toBeInTheDocument();
    expect(screen.getByText('CIMS-5D Assessment Recheck Inquiry')).toBeInTheDocument();
    expect(screen.getByText('CIMS Demo Staff (staff@example.com)')).toBeInTheDocument();
  });

  test('updates status and can reopen a resolved inquiry', async () => {
    const user = userEvent.setup();
    const current = sampleInquiry({ status: 'RESOLVED' });
    getInquiry.mockResolvedValue({ inquiry: current });
    updateInquiryStatus.mockResolvedValue({
      inquiry: sampleInquiry({ status: 'NEW', updatedAt: '2026-11-21T11:00:00.000Z' }),
    });
    renderApp('/inquiries/inq-1');

    await screen.findByText('CIMS-5D Assessment Recheck Customer');
    await user.selectOptions(screen.getByLabelText('Update status'), 'NEW');
    await user.click(screen.getByRole('button', { name: 'Save status' }));

    await waitFor(() => {
      expect(updateInquiryStatus).toHaveBeenCalledWith('inq-1', 'NEW');
    });
    expect(await screen.findByRole('status')).toHaveTextContent('Status updated.');
  });

  test('changes status to in progress', async () => {
    const user = userEvent.setup();
    getInquiry.mockResolvedValue({ inquiry: sampleInquiry() });
    updateInquiryStatus.mockResolvedValue({
      inquiry: sampleInquiry({ status: 'IN_PROGRESS' }),
    });
    renderApp('/inquiries/inq-1');

    await screen.findByLabelText('Update status');
    await user.selectOptions(screen.getByLabelText('Update status'), 'IN_PROGRESS');
    await user.click(screen.getByRole('button', { name: 'Save status' }));

    await waitFor(() => {
      expect(updateInquiryStatus).toHaveBeenCalledWith('inq-1', 'IN_PROGRESS');
    });
  });

  test('shows an error for a missing inquiry', async () => {
    getInquiry.mockRejectedValue(new ApiError(404, 'Inquiry not found.'));
    renderApp('/inquiries/missing-id');

    expect(await screen.findByRole('alert')).toHaveTextContent('Inquiry not found.');
  });

  test('shows an error when a status save fails', async () => {
    const user = userEvent.setup();
    getInquiry.mockResolvedValue({ inquiry: sampleInquiry() });
    updateInquiryStatus.mockRejectedValue(new ApiError(0, 'Unable to reach the server.'));
    renderApp('/inquiries/inq-1');

    await screen.findByLabelText('Update status');
    await user.click(screen.getByRole('button', { name: 'Save status' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to reach the server.');
  });
});
