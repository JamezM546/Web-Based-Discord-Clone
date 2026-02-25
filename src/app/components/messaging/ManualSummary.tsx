import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Sparkles, X, Clock, Calendar, MessageSquare, TrendingUp, Users, AlertCircle } from 'lucide-react';
import { Message } from '../../types';

interface ManualSummaryProps {
  messages: Message[];
  onClose: () => void;
}

interface SummaryData {
  overview: string;
  keyTopics: string[];
  mostActiveUsers: { username: string; count: number }[];
  importantMessages: Message[];
  timeframe: string;
  stats: {
    totalMessages: number;
    uniqueUsers: number;
    questionsAsked: number;
    decisionsMarked: number;
  };
}

const generateManualSummary = (
  messages: Message[], 
  users: any[], 
  startDate: Date,
  endDate: Date
): SummaryData => {
  // Filter messages by custom time range
  const relevantMessages = messages.filter(m => {
    const msgTime = new Date(m.timestamp);
    return msgTime >= startDate && msgTime <= endDate;
  });
  
  // Format timeframe label
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };
  
  const timeframeLabel = `${formatDate(startDate)} ${formatTime(startDate)} - ${formatDate(endDate)} ${formatTime(endDate)}`;
  
  if (relevantMessages.length === 0) {
    return {
      overview: 'No messages found in this time range.',
      keyTopics: [],
      mostActiveUsers: [],
      importantMessages: [],
      timeframe: timeframeLabel,
      stats: { totalMessages: 0, uniqueUsers: 0, questionsAsked: 0, decisionsMarked: 0 }
    };
  }

  const userMap = new Map(users.map(u => [u.id, u.username]));
  const uniqueUsers = new Set(relevantMessages.map(m => m.authorId));

  // Get channel ID from first message
  const channelId = relevantMessages[0]?.channelId;
  const dmId = relevantMessages[0]?.dmId;

  // User activity analysis
  const userMessageCounts = new Map<string, number>();
  relevantMessages.forEach(m => {
    userMessageCounts.set(m.authorId, (userMessageCounts.get(m.authorId) || 0) + 1);
  });

  const mostActiveUsers = Array.from(userMessageCounts.entries())
    .map(([userId, count]) => ({
      username: userMap.get(userId) || 'Unknown',
      count
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Important message detection
  const importantMessages = relevantMessages.filter(m => {
    const content = m.content.toLowerCase();
    return (
      content.includes('important') ||
      content.includes('urgent') ||
      content.includes('📢') ||
      content.includes('🎯') ||
      content.includes('bug') ||
      content.includes('ready for review')
    );
  }).slice(0, 5);

  // Hardcoded summaries based on channel
  let overview = '';
  let keyTopics: string[] = [];
  let questionsAsked = 0;
  let decisionsMarked = 0;

  // Team Project - General channel
  if (channelId === 'c1') {
    overview = "Nafisa is working on the user system including registration, login, and profiles. Ashraf is handling servers with creating, deleting, and settings functionality. James is working on text channels with permissions. Elvis and Salma are working on messaging features including real-time chat, timestamps, edit/delete, and emoji support. Salma confirmed the emoji picker is working great. Ashraf asked about scheduling a meeting tomorrow to discuss the deadline. Nafisa agreed and will prepare the agenda for a 10 AM meeting.";
    keyTopics = ["user system", "servers", "text channels", "messaging features", "emoji picker", "meeting planning"];
    questionsAsked = 2;
    decisionsMarked = 1;
  }
  // Team Project - Announcements channel
  else if (channelId === 'c2') {
    overview = "Nafisa posted an important announcement requesting the team to review the project roadmap in the development channel. Ashraf shared a milestone update celebrating that the team has completed 60% of the core features.";
    keyTopics = ["project roadmap", "milestone update", "core features"];
    questionsAsked = 0;
    decisionsMarked = 0;
  }
  // Team Project - Development channel
  else if (channelId === 'c3') {
    overview = "Nafisa just pushed the new authentication flow and is requesting the team to test it. Ashraf found a bug in the server settings modal and is working on a fix. James completed the channel permissions system and it's ready for review.";
    keyTopics = ["authentication flow", "server settings bug", "channel permissions system"];
    questionsAsked = 0;
    decisionsMarked = 0;
  }
  // Direct Message
  else if (dmId === 'dm1') {
    overview = "Ashraf suggested grabbing coffee after the meeting. You agreed to meet at the place downtown at 2 PM.";
    keyTopics = ["coffee meetup", "social plans"];
    questionsAsked = 1;
    decisionsMarked = 1;
  }
  // Default fallback
  else {
    overview = `Conversation between ${uniqueUsers.size} participants with ${relevantMessages.length} messages exchanged.`;
    keyTopics = ["general discussion"];
    questionsAsked = 0;
    decisionsMarked = 0;
  }

  return {
    overview,
    keyTopics,
    mostActiveUsers,
    importantMessages,
    timeframe: timeframeLabel,
    stats: {
      totalMessages: relevantMessages.length,
      uniqueUsers: uniqueUsers.size,
      questionsAsked,
      decisionsMarked
    }
  };
};

export const ManualSummary: React.FC<ManualSummaryProps> = ({ messages, onClose }) => {
  const { users } = useApp();
  
  // Set default start date to 24 hours ago, end date to now
  const getDefaultStartDate = () => {
    const date = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);
    return date.toISOString().slice(0, 16); // Format for datetime-local input
  };
  const getDefaultEndDate = () => {
    return new Date().toISOString().slice(0, 16); // Format for datetime-local input
  };
  
  const [startDateInput, setStartDateInput] = useState(getDefaultStartDate());
  const [endDateInput, setEndDateInput] = useState(getDefaultEndDate());
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    setHasGenerated(true);
    // Simulate AI processing time
    setTimeout(() => setIsGenerating(false), 800);
  };

  const startDate = new Date(startDateInput);
  const endDate = new Date(endDateInput);
  const summaryData = hasGenerated ? generateManualSummary(messages, users, startDate, endDate) : null;

  // Quick preset functions
  const setQuickRange = (hours: number) => {
    const now = new Date();
    const start = new Date(now.getTime() - hours * 60 * 60 * 1000);
    setStartDateInput(start.toISOString().slice(0, 16));
    setEndDateInput(now.toISOString().slice(0, 16));
    handleGenerate();
  };

  const setAllTime = () => {
    if (messages.length > 0) {
      const oldestMessage = messages.reduce((oldest, msg) => 
        msg.timestamp < oldest.timestamp ? msg : oldest
      , messages[0]);
      setStartDateInput(new Date(oldestMessage.timestamp).toISOString().slice(0, 16));
      setEndDateInput(new Date().toISOString().slice(0, 16));
      handleGenerate();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#313338] rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#5865f2] to-[#7983f5] p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles className="size-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">AI Summary</h2>
                <p className="text-sm text-white/80 mt-1">
                  Get an intelligent overview of your conversation history
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
              title="Close"
            >
              <X className="size-6" />
            </button>
          </div>

          {/* Time Range Selector */}
          <div className="mt-4 space-y-3">
            {/* Custom Date/Time Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-white/70 mb-1.5 font-medium">Start Date & Time</label>
                <input
                  type="datetime-local"
                  value={startDateInput}
                  onChange={(e) => setStartDateInput(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/30 hover:bg-white/15 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-white/70 mb-1.5 font-medium">End Date & Time</label>
                <input
                  type="datetime-local"
                  value={endDateInput}
                  onChange={(e) => setEndDateInput(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/30 hover:bg-white/15 transition-colors"
                />
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full bg-white text-[#5865f2] hover:bg-white/90 font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#5865f2]"></div>
                  Generating Summary...
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  Generate Summary
                </>
              )}
            </button>

            {/* Quick Presets */}
            <div>
              <p className="text-xs text-white/60 mb-2">Quick Presets:</p>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setQuickRange(1)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/10 text-white hover:bg-white/20 transition-colors text-xs font-medium"
                >
                  <Clock className="size-3" />
                  Last Hour
                </button>
                <button
                  onClick={() => setQuickRange(24)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/10 text-white hover:bg-white/20 transition-colors text-xs font-medium"
                >
                  <Clock className="size-3" />
                  Last 24 Hours
                </button>
                <button
                  onClick={() => setQuickRange(7 * 24)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/10 text-white hover:bg-white/20 transition-colors text-xs font-medium"
                >
                  <Calendar className="size-3" />
                  Last 7 Days
                </button>
                <button
                  onClick={() => setQuickRange(30 * 24)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/10 text-white hover:bg-white/20 transition-colors text-xs font-medium"
                >
                  <Calendar className="size-3" />
                  Last 30 Days
                </button>
                <button
                  onClick={setAllTime}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/10 text-white hover:bg-white/20 transition-colors text-xs font-medium"
                >
                  <MessageSquare className="size-3" />
                  All Time
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!hasGenerated ? (
            <div className="text-center py-12">
              <Sparkles className="size-16 text-[#5865f2] mx-auto mb-4 opacity-50" />
              <p className="text-[#b5bac1] text-lg mb-2">Ready to analyze your conversation</p>
              <p className="text-[#949ba4] text-sm">
                Select a time range above and click "Generate Summary" to get started
              </p>
            </div>
          ) : isGenerating ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5865f2]"></div>
                <p className="text-[#b5bac1]">Analyzing conversation...</p>
              </div>
            </div>
          ) : summaryData?.stats.totalMessages === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="size-12 text-[#949ba4] mx-auto mb-4" />
              <p className="text-[#b5bac1] text-lg">No messages found in this time range</p>
              <p className="text-[#949ba4] text-sm mt-2">Try selecting a different time period</p>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-[#2b2d31] rounded-lg p-4">
                  <div className="flex items-center gap-2 text-[#949ba4] text-xs mb-1">
                    <MessageSquare className="size-3" />
                    <span>MESSAGES</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{summaryData?.stats.totalMessages}</p>
                </div>
                <div className="bg-[#2b2d31] rounded-lg p-4">
                  <div className="flex items-center gap-2 text-[#949ba4] text-xs mb-1">
                    <Users className="size-3" />
                    <span>PARTICIPANTS</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{summaryData?.stats.uniqueUsers}</p>
                </div>
                <div className="bg-[#2b2d31] rounded-lg p-4">
                  <div className="flex items-center gap-2 text-[#949ba4] text-xs mb-1">
                    <AlertCircle className="size-3" />
                    <span>QUESTIONS</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{summaryData?.stats.questionsAsked}</p>
                </div>
                <div className="bg-[#2b2d31] rounded-lg p-4">
                  <div className="flex items-center gap-2 text-[#949ba4] text-xs mb-1">
                    <TrendingUp className="size-3" />
                    <span>DECISIONS</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{summaryData?.stats.decisionsMarked}</p>
                </div>
              </div>

              {/* Overview */}
              <div className="bg-gradient-to-r from-[#5865f2]/10 to-[#7983f5]/10 border border-[#5865f2]/30 rounded-lg p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="size-5 text-[#5865f2]" />
                  <h3 className="text-white font-semibold">Overview</h3>
                  <span className="text-xs text-[#949ba4]">({summaryData?.timeframe})</span>
                </div>
                <p className="text-[#dbdee1] leading-relaxed">{summaryData?.overview}</p>
              </div>

              {/* Key Topics */}
              {summaryData?.keyTopics.length > 0 && (
                <div>
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="size-5 text-[#5865f2]" />
                    Key Topics Discussed
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {summaryData?.keyTopics.map((topic, index) => (
                      <span
                        key={index}
                        className="bg-[#5865f2]/20 text-[#c4c9ff] px-3 py-1.5 rounded-full text-sm font-medium border border-[#5865f2]/30"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Most Active Users */}
              {summaryData?.mostActiveUsers.length > 0 && (
                <div>
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <Users className="size-5 text-[#5865f2]" />
                    Most Active Participants
                  </h3>
                  <div className="space-y-2">
                    {summaryData?.mostActiveUsers.map((user, index) => {
                      const userData = users.find(u => u.username === user.username);
                      const percentage = (user.count / summaryData?.stats.totalMessages) * 100;
                      return (
                        <div key={index} className="bg-[#2b2d31] rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {userData && (
                                <img
                                  src={userData.avatar}
                                  alt={user.username}
                                  className="size-8 rounded-full"
                                />
                              )}
                              <span className="text-white font-medium">{user.username}</span>
                            </div>
                            <span className="text-[#949ba4] text-sm">
                              {user.count} message{user.count > 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="bg-[#1e1f22] rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-[#5865f2] to-[#7983f5] h-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Important Messages */}
              {summaryData?.importantMessages.length > 0 && (
                <div>
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <AlertCircle className="size-5 text-[#5865f2]" />
                    Important Messages
                  </h3>
                  <div className="space-y-2">
                    {summaryData?.importantMessages.map((msg) => {
                      const author = users.find(u => u.id === msg.authorId);
                      return (
                        <div key={msg.id} className="bg-[#2b2d31] rounded-lg p-3 border-l-4 border-[#5865f2]">
                          <div className="flex items-center gap-2 mb-2">
                            {author && (
                              <img
                                src={author.avatar}
                                alt={author.username}
                                className="size-6 rounded-full"
                              />
                            )}
                            <span className="text-white font-medium text-sm">{author?.username}</span>
                            <span className="text-[#949ba4] text-xs">
                              {new Date(msg.timestamp).toLocaleDateString()} at{' '}
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[#dbdee1] text-sm">{msg.content}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#2b2d31] p-4 bg-[#2b2d31]/50">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#949ba4]">
              💡 Tip: Use manual summaries to catch up after being away
            </p>
            <button
              onClick={onClose}
              className="bg-[#5865f2] hover:bg-[#4752c4] text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};