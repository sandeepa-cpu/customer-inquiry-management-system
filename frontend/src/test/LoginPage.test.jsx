import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { ApiError, listInquiries, login, logout, me } from './mocks.js';
import { mockUnauthenticated, renderApp, staffUser } from './helpers.jsx';

vi.mock('../api.js', () => import('./mocks.js'));

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUnauthenticated();
    logout.mockResolvedValue(null);
    listInquiries.mockResolvedValue({ inquiries: [] });
  });

  test('rejects empty credentials without calling the API', async () => {
    const user = userEvent.setup();
    renderApp('/login');

    await screen.findByRole('heading', { name: 'Staff sign in' });
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Enter your email and password.');
    expect(login).not.toHaveBeenCalled();
  });

  test('rejects an invalid email without calling the API', async () => {
    const user = userEvent.setup();
    renderApp('/login');

    await screen.findByLabelText('Email');
    await user.type(screen.getByLabelText('Email'), 'not-an-email');
    await user.type(screen.getByLabelText('Password'), 'secret');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Enter a valid email address.');
    expect(login).not.toHaveBeenCalled();
  });

  test('shows an error for incorrect credentials', async () => {
    const user = userEvent.setup();
    login.mockRejectedValue(new ApiError(401, 'Invalid email or password.'));
    renderApp('/login');

    await screen.findByLabelText('Email');
    await user.type(screen.getByLabelText('Email'), 'staff@example.com');
    await user.type(screen.getByLabelText('Password'), 'wrong-password');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password.');
    expect(login).toHaveBeenCalledWith('staff@example.com', 'wrong-password');
  });

  test('shows a network error when the login request fails', async () => {
    const user = userEvent.setup();
    login.mockRejectedValue(new ApiError(0, 'Unable to reach the server.'));
    renderApp('/login');

    await screen.findByLabelText('Email');
    await user.type(screen.getByLabelText('Email'), 'staff@example.com');
    await user.type(screen.getByLabelText('Password'), 'secret');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to reach the server.');
  });

  test('signs in and opens the dashboard', async () => {
    const user = userEvent.setup();
    login.mockResolvedValue({ user: staffUser });
    me.mockRejectedValueOnce(new ApiError(401, 'Unauthorized'));
    renderApp('/login');

    await screen.findByLabelText('Email');
    await user.type(screen.getByLabelText('Email'), 'staff@example.com');
    await user.type(screen.getByLabelText('Password'), 'secret');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(login).toHaveBeenCalled();
    });
    expect(await screen.findByRole('heading', { name: 'Inquiries' })).toBeInTheDocument();
  });
});
