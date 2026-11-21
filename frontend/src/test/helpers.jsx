import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App.jsx';
import { AuthProvider } from '../auth/AuthProvider.jsx';
import { ApiError, me } from './mocks.js';

export const staffUser = {
  id: 'user-1',
  name: 'CIMS Demo Staff',
  email: 'staff@example.com',
};

export function sampleInquiry(overrides = {}) {
  return {
    id: 'inq-1',
    customerName: 'CIMS-5D Assessment Recheck Customer',
    customerContact: 'cims-5d-recheck@example.com',
    subject: 'CIMS-5D Assessment Recheck Inquiry',
    description: 'Assessment-only recheck inquiry for Phase 5D verification.',
    status: 'NEW',
    createdById: staffUser.id,
    createdBy: staffUser,
    createdAt: '2026-11-21T10:28:25.000Z',
    updatedAt: '2026-11-21T10:28:25.000Z',
    ...overrides,
  };
}

export function mockUnauthenticated() {
  me.mockRejectedValue(new ApiError(401, 'Unauthorized'));
}

export function mockAuthenticated(user = staffUser) {
  me.mockResolvedValue({ user });
}

export function renderApp(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  );
}
