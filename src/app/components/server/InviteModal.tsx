import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router';

interface InviteModalProps {
  code: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const InviteModal: React.FC<InviteModalProps> = ({ code, open, onOpenChange }) => {
  const { resolveInviteCode, joinInviteByCode, currentUser, servers, setSelectedServer, channels, setSelectedChannel, setSelectedDM } = useApp();
  const navigate = useNavigate();

  const [inviteInfo, setInviteInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !code) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await resolveInviteCode(code);
        if (!mounted) return;
        setInviteInfo(data);

        // If already a member, show a short message then navigate
        const serverId = data?.server?.id;
        if (currentUser && serverId) {
          const existing = servers.find((s) => s.id === serverId);
          if (existing && existing.members && existing.members.includes(currentUser.id)) {
            setMessage('You are already a member — opening server...');
            setSelectedDM(null);
            setSelectedServer(existing);
            try {
              // set first channel for that server if available
              const first = channels.find((c) => c.serverId === existing.id) ?? null;
              if (first) setSelectedChannel(first);
            } catch (_) {}
            // give user a short moment to read message
            setTimeout(() => {
              onOpenChange(false);
              navigate('/channels');
            }, 900);
          }
        }
      } catch (err: any) {
        setMessage(err?.message || 'Failed to resolve invite');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [open, code]);

  const handleJoin = async () => {
    if (!code) return;
    if (!currentUser) {
      navigate(`/login?redirect=/invite/${code}`, { state: { autoJoin: true } });
      onOpenChange(false);
      return;
    }

    setLoading(true);
    try {
      const joined = await joinInviteByCode(code);
      setMessage('Joined successfully — redirecting...');

      // Ensure server selection happens before navigating. Keep modal open briefly
      if (joined && joined.id) {
        setSelectedDM(null);
        setSelectedServer(joined as any);
        // Set first channel in the new server
        const serverChannels = channels.filter(c => c.serverId === joined.id);
        if (serverChannels.length > 0) {
          setSelectedChannel(serverChannels[0]);
        }
      }

      // Small delay to ensure state updates propagate and user sees success
      await new Promise((res) => setTimeout(res, 600));
      onOpenChange(false);
      navigate('/channels');
    } catch (err: any) {
      // If already a member, navigate
      const msg = err?.message || '';
      if (msg.toLowerCase().includes('already') && inviteInfo?.server?.id) {
        const s = servers.find((x) => x.id === inviteInfo.server.id);
        if (s) {
          setSelectedDM(null);
          setSelectedServer(s);
          // Set first channel in the server
          const serverChannels = channels.filter(c => c.serverId === s.id);
          if (serverChannels.length > 0) {
            setSelectedChannel(serverChannels[0]);
          }
        }
        onOpenChange(false);
        navigate('/channels');
        return;
      }
      setMessage(msg || 'Failed to join server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0d1a2e] border border-[#1e3248] text-[#e2e8f0] max-w-md">
        <DialogHeader>
          <DialogTitle>Server Invite</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {loading && <div className="text-[#94a3b8]">Loading...</div>}
          {message && <div className="text-sm text-[#f87171]">{message}</div>}
          {inviteInfo ? (
            <>
              <div className="text-[#e2e8f0] font-medium">{inviteInfo.server?.name}</div>
              <div className="text-xs text-[#94a3b8]">Invite code: {code}</div>
              <div className="text-sm text-[#64748b]">{inviteInfo.invite?.creator?.displayName || inviteInfo.invite?.creator?.username}</div>
              <div className="flex gap-2">
                <Button onClick={handleJoin} className="bg-[#06b6d4] hover:bg-[#0891b2]">{currentUser ? 'Join Server' : 'Log in to Join'}</Button>
                <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-[#94a3b8]">Close</Button>
              </div>
            </>
          ) : (
            !loading && <div className="text-[#94a3b8]">Invite not found or invalid.</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InviteModal;
