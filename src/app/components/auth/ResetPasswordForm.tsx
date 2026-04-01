import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Zap } from 'lucide-react';
import { apiService } from '../../services/apiService';

export const ResetPasswordForm: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingToken, setIsCheckingToken] = useState(true);
  const [tokenEmail, setTokenEmail] = useState('');
  const [tokenInvalid, setTokenInvalid] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!token) {
        setError('Reset token is missing.');
        setTokenInvalid(true);
        setIsCheckingToken(false);
        return;
      }

      try {
        const response = await apiService.validateResetPasswordToken(token);
        if (!cancelled) {
          setTokenEmail(response.data?.email || '');
          setTokenInvalid(false);
        }
      } catch (err) {
        console.error('Reset token validation failed:', err);
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Reset token is invalid or expired.');
          setTokenInvalid(true);
        }
      } finally {
        if (!cancelled) {
          setIsCheckingToken(false);
        }
      }
    };

    void run();
    return () => { cancelled = true; };
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError('Reset token is missing.');
      return;
    }

    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation must match.');
      return;
    }

    setIsLoading(true);
    try {
      await apiService.resetPasswordWithToken(token, newPassword);
      setSuccess('Password reset successful. You can now sign in.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Reset password failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#060c18] p-4 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#06b6d4]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="size-12 rounded-2xl bg-gradient-to-br from-[#06b6d4] to-[#0891b2] flex items-center justify-center shadow-xl shadow-[#06b6d4]/20">
            <Zap className="size-6 text-white" />
          </div>
          <div>
            <h1 className="text-[#e2e8f0] text-2xl tracking-wide">Anaphor</h1>
            <p className="text-[#475569] text-xs">Create a new password</p>
          </div>
        </div>

        <div className="bg-[#0d1a2e] rounded-2xl border border-[#1e3248] p-8 shadow-2xl">
          <h2 className="text-[#e2e8f0] text-center mb-1">Reset your password</h2>
          <p className="text-center text-[#475569] text-sm mb-6">
            {tokenEmail ? `Updating password for ${tokenEmail}` : 'Choose a new password for your account'}
          </p>

          {isCheckingToken ? (
            <div className="text-center text-[#94a3b8] py-8">Validating reset link...</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="newPassword" className="text-[#64748b] uppercase text-xs font-semibold tracking-wider">
                  New Password
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-[#060c18] border border-[#1e3248] text-[#e2e8f0] mt-1.5 focus-visible:ring-[#06b6d4]/50 focus-visible:border-[#06b6d4]/50 placeholder:text-[#475569]"
                  placeholder="At least 6 characters"
                  disabled={tokenInvalid}
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-[#64748b] uppercase text-xs font-semibold tracking-wider">
                  Confirm New Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-[#060c18] border border-[#1e3248] text-[#e2e8f0] mt-1.5 focus-visible:ring-[#06b6d4]/50 focus-visible:border-[#06b6d4]/50 placeholder:text-[#475569]"
                  placeholder="Repeat new password"
                  disabled={tokenInvalid}
                />
              </div>

              {error && (
                <div role="alert" className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div role="status" className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2 space-y-2">
                  <p className="text-emerald-400 text-sm">{success}</p>
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="text-sm text-[#67e8f9] hover:underline"
                  >
                    Return to sign in
                  </button>
                </div>
              )}

                <Button
                type="submit"
                disabled={isLoading || tokenInvalid}
                className="w-full bg-[#06b6d4] hover:bg-[#0891b2] text-white border-none shadow-lg shadow-[#06b6d4]/20 transition-all mt-2"
              >
                {isLoading ? 'Resetting password...' : 'Reset Password'}
              </Button>

              <p className="text-sm text-[#475569] text-center">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-[#06b6d4] hover:text-[#67e8f9] hover:underline transition-colors"
                >
                  Back to sign in
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
