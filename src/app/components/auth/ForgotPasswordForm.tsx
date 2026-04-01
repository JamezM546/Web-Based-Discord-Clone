import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Zap } from 'lucide-react';
import { apiService } from '../../services/apiService';

export const ForgotPasswordForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resetUrl, setResetUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setResetUrl('');

    if (!email) {
      setError('Please enter your email.');
      return;
    }

    setIsLoading(true);
    try {
      const data = await apiService.forgotPassword(email);
      setSuccess('If an account exists for that email, a reset link has been generated.');
      setResetUrl(data.resetUrl || '');
    } catch (err) {
      console.error('Forgot password failed:', err);
      setError('Unable to process that request right now.');
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
            <p className="text-[#475569] text-xs">Password recovery</p>
          </div>
        </div>

        <div className="bg-[#0d1a2e] rounded-2xl border border-[#1e3248] p-8 shadow-2xl">
          <h2 className="text-[#e2e8f0] text-center mb-1">Forgot your password?</h2>
          <p className="text-center text-[#475569] text-sm mb-6">
            Enter your account email to generate a reset link.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-[#64748b] uppercase text-xs font-semibold tracking-wider">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-[#060c18] border border-[#1e3248] text-[#e2e8f0] mt-1.5 focus-visible:ring-[#06b6d4]/50 focus-visible:border-[#06b6d4]/50 placeholder:text-[#475569]"
                placeholder="you@example.com"
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
                {resetUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      const parsed = new URL(resetUrl);
                      navigate(`${parsed.pathname}${parsed.search}`);
                    }}
                    className="text-sm text-[#67e8f9] hover:underline"
                  >
                    Continue to reset password
                  </button>
                )}
              </div>
            )}

            <Button type="submit" disabled={isLoading} className="w-full bg-[#06b6d4] hover:bg-[#0891b2] text-white border-none shadow-lg shadow-[#06b6d4]/20 transition-all mt-2">
              {isLoading ? 'Generating link...' : 'Generate Reset Link'}
            </Button>

            <p className="text-sm text-[#475569] text-center">
              Remembered it?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-[#06b6d4] hover:text-[#67e8f9] hover:underline transition-colors"
              >
                Back to sign in
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};
