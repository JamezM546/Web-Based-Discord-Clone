import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { MessageSquare } from 'lucide-react';

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useApp();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    const success = login(email, password);
    if (success) {
      navigate('/channels');
    } else {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#313338] p-4">
      <div className="w-full max-w-md bg-[#2b2d31] rounded-lg p-8 shadow-xl">
        <div className="flex items-center justify-center mb-8">
          <MessageSquare className="size-12 text-[#5865f2]" />
        </div>
        <h1 className="text-center mb-2 text-white">Welcome back!</h1>
        <p className="text-center text-[#b5bac1] mb-6">We're so excited to see you again!</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-[#b5bac1] uppercase text-xs font-semibold">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-[#1e1f22] border-none text-white mt-2"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-[#b5bac1] uppercase text-xs font-semibold">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-[#1e1f22] border-none text-white mt-2"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <Button type="submit" className="w-full bg-[#5865f2] hover:bg-[#4752c4] text-white">
            Log In
          </Button>

          <p className="text-sm text-[#b5bac1]">
            Need an account?{' '}
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="text-[#00a8fc] hover:underline"
            >
              Register
            </button>
          </p>

          <div className="mt-4 p-3 bg-[#1e1f22] rounded text-xs text-[#b5bac1]">
            <p className="font-semibold mb-2">Demo accounts:</p>
            <p>nafisa@example.com</p>
            <p>ashraf@example.com</p>
            <p>james@example.com</p>
            <p className="mt-2 text-[#87898c]">Password: any password</p>
          </div>
        </form>
      </div>
    </div>
  );
};
