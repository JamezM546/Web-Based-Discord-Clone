import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Zap } from 'lucide-react';

export const RegisterForm: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { register } = useApp();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username || !email || !password) {
      setError('Please fill in all fields');
      return;
    }
    try {
      await register(username, email, password);
      navigate('/channels');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#060c18] p-4 relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#06b6d4]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="size-12 rounded-2xl bg-gradient-to-br from-[#06b6d4] to-[#0891b2] flex items-center justify-center shadow-xl shadow-[#06b6d4]/20">
            <Zap className="size-6 text-white" />
          </div>
          <div>
            <h1 className="text-[#e2e8f0] text-2xl tracking-wide">Anaphor</h1>
            <p className="text-[#475569] text-xs">Your collaborative space</p>
          </div>
        </div>

        <div className="bg-[#0d1a2e] rounded-2xl border border-[#1e3248] p-8 shadow-2xl">
          <h2 className="text-[#e2e8f0] text-center mb-1">Create your account</h2>
          <p className="text-center text-[#475569] text-sm mb-6">Join Anaphor and start collaborating</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="username" className="text-[#64748b] uppercase text-xs font-semibold tracking-wider">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-[#060c18] border border-[#1e3248] text-[#e2e8f0] mt-1.5 focus-visible:ring-[#06b6d4]/50 focus-visible:border-[#06b6d4]/50 placeholder:text-[#475569]"
                placeholder="YourUsername"
              />
            </div>

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

            <div>
              <Label htmlFor="password" className="text-[#64748b] uppercase text-xs font-semibold tracking-wider">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-[#060c18] border border-[#1e3248] text-[#e2e8f0] mt-1.5 focus-visible:ring-[#06b6d4]/50 focus-visible:border-[#06b6d4]/50 placeholder:text-[#475569]"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div
                role="alert"
                aria-live="assertive"
                className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
              >
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full bg-[#06b6d4] hover:bg-[#0891b2] text-white border-none shadow-lg shadow-[#06b6d4]/20 transition-all mt-2">
              Create Account
            </Button>

            <p className="text-sm text-[#475569] text-center">
              Already on Anaphor?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-[#06b6d4] hover:text-[#67e8f9] hover:underline transition-colors"
              >
                Sign in
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};