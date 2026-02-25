import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { MessageSquare } from 'lucide-react';

export const RegisterForm: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { register } = useApp();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !email || !password) {
      setError('Please fill in all fields');
      return;
    }

    const success = register(username, email, password);
    if (success) {
      navigate('/channels');
    } else {
      setError('Email already exists');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#313338] p-4">
      <div className="w-full max-w-md bg-[#2b2d31] rounded-lg p-8 shadow-xl">
        <div className="flex items-center justify-center mb-8">
          <MessageSquare className="size-12 text-[#5865f2]" />
        </div>
        <h1 className="text-center mb-2 text-white">Create an account</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="username" className="text-[#b5bac1] uppercase text-xs font-semibold">
              Username
            </Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-[#1e1f22] border-none text-white mt-2"
              placeholder="YourUsername"
            />
          </div>

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
            Register
          </Button>

          <p className="text-sm text-[#b5bac1]">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-[#00a8fc] hover:underline"
            >
              Log In
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};
