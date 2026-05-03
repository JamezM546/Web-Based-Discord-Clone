import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { Button } from '../components/ui/button';
import { useApp } from '../context/AppContext';

const InviteJoinPage: React.FC = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    resolveInviteCode,
    joinInviteByCode,
    currentUser,
    servers,
    setSelectedServer,
    logout,
  } = useApp();

  const [inviteInfo, setInviteInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const autoJoinAttempted = useRef(false);

  const invitedServerId = inviteInfo?.server?.id;
  const memberServer = useMemo(() => {
    if (!currentUser || !invitedServerId) return null;

    return (
      servers.find(
        (server) =>
          server.id === invitedServerId &&
          Array.isArray(server.members) &&
          server.members.includes(currentUser.id)
      ) || null
    );
  }, [currentUser, invitedServerId, servers]);

  useEffect(() => {
    if (!code) return;

    let cancelled = false;

    const loadInvite = async () => {
      setLoading(true);
      try {
        const data = await resolveInviteCode(code);
        if (!cancelled) {
          setInviteInfo(data);
        }
      } catch (err: any) {
        if (!cancelled) {
          setMessage(err?.message || 'Failed to resolve invite');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadInvite();

    return () => {
      cancelled = true;
    };
  }, [code, resolveInviteCode]);

  const handleJoin = async () => {
    if (!code) return;

    if (!currentUser) {
      navigate(`/login?redirect=/invite/${code}`, { state: { autoJoin: true } });
      return;
    }

    if (memberServer) {
      setSelectedServer(memberServer);
      navigate('/channels');
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const result = await joinInviteByCode(code);
      const joinedServer = result?.server;

      if (joinedServer?.id) {
        const selectedServer =
          servers.find((server) => server.id === joinedServer.id) || {
            id: joinedServer.id,
            name: joinedServer.name,
            icon: joinedServer.icon || '📁',
            ownerId: joinedServer.owner_id || '',
            members: joinedServer.members || [],
          };
        setSelectedServer(selectedServer);
      }

      setMessage(result?.alreadyMember ? 'You are already a member of this server.' : 'Joined successfully. Opening server...');
      window.setTimeout(() => navigate('/channels'), 700);
    } catch (err: any) {
      setMessage(err?.message || 'Failed to join server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!(location.state as any)?.autoJoin || !currentUser || !code || autoJoinAttempted.current) {
      return;
    }

    autoJoinAttempted.current = true;
    void handleJoin();
  }, [code, currentUser, location.state, memberServer]);

  const handleUseDifferentAccount = () => {
    logout();
    navigate(`/login?redirect=/invite/${code}`, { state: { autoJoin: true } });
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
              {currentUser && (
                <div className="text-xs text-[#94a3b8]">
                  Signed in as <span className="text-[#e2e8f0]">{currentUser.displayName || currentUser.username}</span>
                </div>
              )}

              <div className="flex gap-2 flex-wrap">
                <Button onClick={handleJoin} className="bg-[#06b6d4] hover:bg-[#0891b2]">
                  {currentUser ? (memberServer ? 'Open Server' : 'Join Server') : 'Log in to Join'}
                </Button>
                {currentUser && (
                  <Button
                    variant="ghost"
                    onClick={handleUseDifferentAccount}
                    className="text-[#94a3b8]"
                  >
                    Use Different Account
                  </Button>
                )}
                <Button variant="ghost" onClick={() => navigate('/')} className="text-[#94a3b8]">
                  Cancel
                </Button>
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
