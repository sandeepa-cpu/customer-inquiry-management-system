import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { ApiError, listInquiries, logout } from './mocks.js';
import { mockAuthenticated, renderApp, sampleInquiry } from './helpers.jsx';

vi.mock('../api.js', () => import('./mocks.js'));

const recheck = sampleInquiry();
const other = sampleInquiry({
  id: 'inq-2',
  customerName: 'Other Cafe',
  customerContact: 'other@example.com',
  subject: 'Billing question',
  status: 'IN_PROGRESS',
});

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthenticated();
    logout.mockResolvedValue(null);
  });

  test('shows a loading state then the empty list', async () => {
    let resolveList;
    listInquiries.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveList = resolve;
        }),
    );
    renderApp('/');

    await screen.findByRole('heading', { name: 'Inquiries' });
    expect(screen.getByText('Loading inquiries…')).toBeInTheDocument();
    resolveList({ inquiries: [] });
    expect(await screen.findByText('No inquiries yet.')).toBeInTheDocument();
  });

  test('searches by customer name or subject', async () => {
    const user = userEvent.setup();
    listInquiries.mockImplementation(async ({ q, status } = {}) => {
      let inquiries = [recheck, other];
      if (q) {
        const needle = q.toLowerCase();
        inquiries = inquiries.filter(
          (item) =>
            item.customerName.toLowerCase().includes(needle) || item.subject.toLowerCase().includes(needle),
        );
      }
      if (status) {
        inquiries = inquiries.filter((item) => item.status === status);
      }
      return { inquiries };
    });
    renderApp('/');

    expect((await screen.findAllByText(recheck.customerName)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(other.customerName).length).toBeGreaterThan(0);

    await user.type(screen.getByLabelText('Search'), 'Recheck');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    await waitFor(() => {
      expect(listInquiries).toHaveBeenCalledWith({ q: 'Recheck', status: undefined });
    });
    expect((await screen.findAllByText(recheck.customerName)).length).toBeGreaterThan(0);
    expect(screen.queryAllByText(other.customerName)).toHaveLength(0);
  });

  test('combines search and status filtering', async () => {
    const user = userEvent.setup();
    listInquiries.mockImplementation(async ({ q, status } = {}) => {
      let inquiries = [recheck, other];
      if (q) {
        const needle = q.toLowerCase();
        inquiries = inquiries.filter(
          (item) =>
            item.customerName.toLowerCase().includes(needle) || item.subject.toLowerCase().includes(needle),
        );
      }
      if (status) {
        inquiries = inquiries.filter((item) => item.status === status);
      }
      return { inquiries };
    });
    renderApp('/');

    await screen.findAllByText(recheck.customerName);
    await user.type(screen.getByLabelText('Search'), 'Recheck');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    await user.selectOptions(screen.getByLabelText('Status'), 'IN_PROGRESS');

    expect(await screen.findByText('No inquiries match this search and filter.')).toBeInTheDocument();
    await waitFor(() => {
      expect(listInquiries).toHaveBeenCalledWith({ q: 'Recheck', status: 'IN_PROGRESS' });
    });
  });

  test('shows useful feedback when the list request fails', async () => {
    listInquiries.mockRejectedValue(new ApiError(0, 'Unable to reach the server.'));
    renderApp('/');

    const alert = await screen.findByRole('alert');
    expect(within(alert).getByText('Unable to reach the server.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });
});
