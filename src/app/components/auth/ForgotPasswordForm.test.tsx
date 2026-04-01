import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { vi, afterEach, describe, expect, test } from 'vitest';
import { ForgotPasswordForm } from './ForgotPasswordForm';

const mockFetchResponse = (body: unknown, ok = true) =>
  Promise.resolve({
    ok,
    json: async () => body,
  } as Response);

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ForgotPasswordForm', () => {
  test('submits an email and shows the generated reset link path for manual testing', async () => {
    const fetchMock = vi.fn().mockImplementation(() =>
      mockFetchResponse({
        success: true,
        message: 'If an account exists for that email, a reset link has been generated.',
        data: {
          resetUrl: 'http://localhost:5173/reset-password?token=test-token',
        },
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/forgot-password']}>
        <Routes>
          <Route path="/forgot-password" element={<ForgotPasswordForm />} />
          <Route path="/reset-password" element={<div>Reset Route</div>} />
        </Routes>
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText(/email/i), 'nafisa@example.com');
    await user.click(screen.getByRole('button', { name: /generate reset link/i }));

    expect(await screen.findByText(/if an account exists for that email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue to reset password/i })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3001/api/auth/forgot-password',
      expect.objectContaining({
        method: 'POST',
      })
    );
  });

  test('shows a local validation error when email is missing', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ForgotPasswordForm />
      </MemoryRouter>
    );

    await user.click(screen.getByRole('button', { name: /generate reset link/i }));

    expect(screen.getByText(/please enter your email/i)).toBeInTheDocument();
  });
});
