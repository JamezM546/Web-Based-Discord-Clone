import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { vi, afterEach, describe, expect, test } from 'vitest';
import { ResetPasswordForm } from './ResetPasswordForm';

const mockFetchResponse = (body: unknown, ok = true) =>
  Promise.resolve({
    ok,
    json: async () => body,
  } as Response);

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ResetPasswordForm', () => {
  test('validates the token on load and resets the password', async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() =>
        mockFetchResponse({
          success: true,
          data: { email: 'nafisa@example.com' },
        })
      )
      .mockImplementationOnce(() =>
        mockFetchResponse({
          success: true,
          data: {
            user: { id: '1' },
          },
        })
      );
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/reset-password?token=valid-reset-token-1234567890']}>
        <Routes>
          <Route path="/reset-password" element={<ResetPasswordForm />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText(/updating password for nafisa@example.com/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/^new password$/i), 'newpass123');
    await user.type(screen.getByLabelText(/confirm new password/i), 'newpass123');
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    expect(await screen.findByText(/password reset successful/i)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://localhost:3001/api/auth/reset-password/validate?token=valid-reset-token-1234567890',
      expect.any(Object)
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://localhost:3001/api/auth/reset-password',
      expect.objectContaining({ method: 'POST' })
    );
  });

  test('shows an invalid token error from the validation request', async () => {
    const fetchMock = vi.fn().mockImplementation(() =>
      mockFetchResponse({
        success: false,
        message: 'Reset token is invalid or expired',
      }, false)
    );
    vi.stubGlobal('fetch', fetchMock);

    render(
      <MemoryRouter initialEntries={['/reset-password?token=expired-reset-token-1234567890']}>
        <Routes>
          <Route path="/reset-password" element={<ResetPasswordForm />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText(/reset token is invalid or expired/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset password/i })).toBeDisabled();
  });
});
