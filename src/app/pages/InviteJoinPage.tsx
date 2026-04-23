import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router';
import { Button } from '../components/ui/button';
import { useApp } from '../context/AppContext';

const InviteJoinPage: React.FC = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { resolveInviteCode, joinInviteByCode, currentUser, servers, setSelectedServer } = useApp();

  const [inviteInfo, setInviteInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;
    (async () => {
      setLoading(true);
      try {
        const data = await resolveInviteCode(code);
        setInviteInfo(data);
        // If logged in and already a member, go to server
        const serverId = data?.server?.id;
        if (currentUser && serverId) {
          const existing = servers.find((s) => s.id === serverId);
          if (existing && existing.members && existing.members.includes(currentUser.id)) {
            setSelectedServer(existing);
            setTimeout(() => navigate('/channels'), 250);
          }
        }
      } catch (err: any) {
        setMessage(err?.message || 'Failed to resolve invite');
      } finally {
        setLoading(false);
      }
    })();
  }, [code]);

  useEffect(() => {
    // If we arrived with autoJoin request and user is logged in, attempt join
    if ((location.state as any)?.autoJoin && currentUser && code) {
      handleJoin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, code, location.state]);

  const handleJoin = async () => {
    if (!code) return;
    if (!currentUser) {
      // redirect to login with redirect back to this invite and flag to auto-join
      navigate(`/login?redirect=/invite/${code}`, { state: { autoJoin: true } });
      return;
    }

    setLoading(true);
    try {
      await joinInviteByCode(code);
      setMessage('Joined successfully — redirecting to servers...');
      setTimeout(() => navigate('/channels'), 1000);
    } catch (err: any) {
      setMessage(err?.message || 'Failed to join server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#060c18] p-4">
      <div className="w-full max-w-lg">
        <div className="bg-[#0d1a2e] rounded-2xl border border-[#1e3248] p-6">
          <h2 className="text-xl text-[#e2e8f0] font-semibold mb-2">Server Invite</h2>
          {loading && <p className="text-[#94a3b8]">Loading...</p>}

          {message && <div className="mb-4 text-sm text-[#f87171]">{message}</div>}

          {inviteInfo ? (
            <div className="space-y-3">
              <div className="text-[#e2e8f0] font-medium">{inviteInfo.server?.name}</div>
              <div className="text-xs text-[#94a3b8]">Invite code: {code}</div>
              <div className="text-sm text-[#64748b]">
                {inviteInfo.invite?.creator?.displayName || inviteInfo.invite?.creator?.username}
                {inviteInfo.invite?.expiresAt ? ` • Expires ${new Date(inviteInfo.invite.expiresAt).toLocaleString()}` : ''}
              </div>

              <div className="flex gap-2">
                <Button onClick={handleJoin} className="bg-[#06b6d4] hover:bg-[#0891b2]">{currentUser ? 'Join Server' : 'Log in to Join'}</Button>
                <Button variant="ghost" onClick={() => navigate('/')} className="text-[#94a3b8]">Cancel</Button>
              </div>
            </div>
          ) : (
            !loading && <div className="text-[#94a3b8]">Invite not found or invalid.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InviteJoinPage;
