import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { ApiError, createInquiry, getInquiry, logout } from './mocks.js';
import { mockAuthenticated, renderApp, sampleInquiry } from './helpers.jsx';

vi.mock('../api.js', () => import('./mocks.js'));

describe('Create inquiry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthenticated();
    logout.mockResolvedValue(null);
  });

  test('rejects empty and whitespace-only fields', async () => {
    const user = userEvent.setup();
    renderApp('/inquiries/new');

    await screen.findByRole('heading', { name: 'Create inquiry' });
    await user.click(screen.getByRole('button', { name: 'Create inquiry' }));

    expect(await screen.findAllByText('This field is required.')).toHaveLength(4);
    expect(createInquiry).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText('Customer name'), '   ');
    await user.type(screen.getByLabelText('Customer contact'), '   ');
    await user.type(screen.getByLabelText('Subject'), '   ');
    await user.type(screen.getByLabelText('Description'), '   ');
    await user.click(screen.getByRole('button', { name: 'Create inquiry' }));

    expect(screen.getAllByText('This field is required.')).toHaveLength(4);
    expect(createInquiry).not.toHaveBeenCalled();
  });

  test('creates an inquiry with only the four permitted fields and opens details', async () => {
    const user = userEvent.setup();
    const created = sampleInquiry({
      id: 'created-1',
      customerName: 'Ada Customer',
      customerContact: 'ada@example.com',
      subject: 'Follow-up',
      description: 'Please call back.',
    });
    createInquiry.mockResolvedValue({ inquiry: created });
    getInquiry.mockResolvedValue({ inquiry: created });
    renderApp('/inquiries/new');

    await screen.findByLabelText('Customer name');
    await user.type(screen.getByLabelText('Customer name'), '  Ada Customer  ');
    await user.type(screen.getByLabelText('Customer contact'), 'ada@example.com');
    await user.type(screen.getByLabelText('Subject'), 'Follow-up');
    await user.type(screen.getByLabelText('Description'), 'Please call back.');
    await user.click(screen.getByRole('button', { name: 'Create inquiry' }));

    await waitFor(() => {
      expect(createInquiry).toHaveBeenCalledWith({
        customerName: 'Ada Customer',
        customerContact: 'ada@example.com',
        subject: 'Follow-up',
        description: 'Please call back.',
      });
    });
    expect(Object.keys(createInquiry.mock.calls[0][0])).toEqual([
      'customerName',
      'customerContact',
      'subject',
      'description',
    ]);
    expect(await screen.findByRole('heading', { name: 'Inquiry details' })).toBeInTheDocument();
    expect(screen.getByText('Ada Customer')).toBeInTheDocument();
  });

  test('shows backend validation errors', async () => {
    const user = userEvent.setup();
    createInquiry.mockRejectedValue(new ApiError(400, 'Please check your details and try again.'));
    renderApp('/inquiries/new');

    await screen.findByLabelText('Customer name');
    await user.type(screen.getByLabelText('Customer name'), 'Ada Customer');
    await user.type(screen.getByLabelText('Customer contact'), 'ada@example.com');
    await user.type(screen.getByLabelText('Subject'), 'Follow-up');
    await user.type(screen.getByLabelText('Description'), 'Please call back.');
    await user.click(screen.getByRole('button', { name: 'Create inquiry' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Please check your details and try again.');
  });
});
