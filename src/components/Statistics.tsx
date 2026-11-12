import React, { useState, useEffect } from 'react';
import { 
  X, 
  Trophy, 
  Clock, 
  Zap, 
  Target, 
  RefreshCw, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Medal, 
  User,
  Flame,
  Award
} from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { steamService, LeaderboardEntry } from '../services/steamService';

interface StatisticsProps {
  stats: {
    totalSessions: number;
    totalFocusTime: number;
    totalBreaks: number;
    totalBreakTime: number;
    streak: number;
    todaySessions: number;
  };
  onSync?: () => Promise<any>;
  onClose: () => void;
}

const Statistics: React.FC<StatisticsProps> = ({ stats, onSync, onClose }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'overview' | 'leaderboard'>('overview');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSteamOnline, setIsSteamOnline] = useState<boolean | null>(null);
  const [steamUsername, setSteamUsername] = useState<string>('');
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);

  // Check Steam status on mount
  useEffect(() => {
    steamService.initConnection().then((online) => {
      setIsSteamOnline(online);
      setSteamUsername(steamService.getUsername());
    });
  }, []);

  // Load leaderboard when switching to leaderboard tab
  useEffect(() => {
    if (activeTab === 'leaderboard') {
      loadLeaderboard();
    }
  }, [activeTab]);

  const loadLeaderboard = async () => {
    setIsLoadingLeaderboard(true);
    try {
      const res = await steamService.getLeaderboard('focus_hours');
      if (res && res.success && Array.isArray(res.entries)) {
        setLeaderboardEntries(res.entries);
      }
    } catch (e) {
      console.warn('Failed to fetch leaderboard:', e);
    } finally {
      setIsLoadingLeaderboard(false);
    }
  };

  const handleManualSync = async () => {
    if (isSyncing || !onSync) return;
    setIsSyncing(true);
    try {
      await onSync();
      await loadLeaderboard();
    } finally {
      setIsSyncing(false);
    }
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const statCards = [
    {
      icon: <Trophy className="w-7 h-7" />,
      title: t('statistics.totalSessions') || 'Total Sessions',
      value: stats.totalSessions,
      color: "bg-yellow-500",
      description: t('statistics.sessionsCompleted') || 'gaming sessions completed'
    },
    {
      icon: <Clock className="w-7 h-7" />,
      title: t('statistics.focusTime') || 'Focus Time',
      value: formatTime(stats.totalFocusTime),
      color: "bg-theme-primary",
      description: t('statistics.totalTimeFocused') || 'total time focused'
    },
    {
      icon: <Zap className="w-7 h-7" />,
      title: t('statistics.breakStreak') || 'Break Streak',
      value: stats.streak,
      color: "bg-emerald-500",
      description: t('statistics.consecutiveBreaks') || 'consecutive breaks taken'
    },
    {
      icon: <Target className="w-7 h-7" />,
      title: t('statistics.todaySessions') || "Today's Sessions",
      value: stats.todaySessions,
      color: "bg-purple-500",
      description: t('statistics.sessionsToday') || 'sessions completed today'
    }
  ];

  const averageSessionLength = stats.totalSessions > 0 ? stats.totalFocusTime / stats.totalSessions : 0;
  const totalBreakTime = formatTime(stats.totalBreakTime);
  const totalFocusHours = Math.floor(stats.totalFocusTime / 60);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-theme-surface backdrop-blur-xl border border-theme-border rounded-3xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sticky top-0 bg-theme-surface z-10 pb-3 border-b border-theme-border flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-theme-text">
              {t('statistics.title') || 'Your Focus Statistics'}
            </h2>
            {isSteamOnline === true && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{steamUsername || 'Steam Online'}</span>
              </span>
            )}
            {isSteamOnline === false && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Steam Offline</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onSync && (
              <button
                type="button"
                onClick={handleManualSync}
                disabled={isSyncing}
                className="p-2 text-theme-primary bg-theme-primary/10 hover:bg-theme-primary/20 rounded-xl transition-all disabled:opacity-50"
                title={t('statistics.syncNow') || 'Sync with Steam'}
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-theme-muted hover:text-theme-text transition-colors duration-200 rounded-xl hover:bg-theme-bg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-theme-border gap-2 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'border-theme-primary text-theme-primary'
                : 'border-transparent text-theme-muted hover:text-theme-text'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>{t('statistics.overviewTab') || 'Overview'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('leaderboard')}
            className={`pb-2.5 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'leaderboard'
                ? 'border-theme-primary text-theme-primary'
                : 'border-transparent text-theme-muted hover:text-theme-text'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>{t('statistics.leaderboardTab') || 'Top 10 Leaderboard'}</span>
          </button>
        </div>

        {activeTab === 'overview' ? (
          /* TAB 1: OVERVIEW */
          <div className="space-y-6">
            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {statCards.map((stat, index) => (
                <div key={index} className="bg-theme-bg border border-theme-border rounded-2xl p-5 hover:border-theme-primary/30 transition-all">
                  <div className="flex items-center gap-3.5 mb-2.5">
                    <div className={`${stat.color} text-white p-2.5 rounded-xl shadow-md flex-shrink-0`}>
                      {stat.icon}
                    </div>
                    <div className="truncate">
                      <h3 className="font-bold text-theme-text text-sm sm:text-base truncate">{stat.title}</h3>
                      <p className="text-theme-muted text-xs truncate">{stat.description}</p>
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold text-theme-text">{stat.value}</div>
                </div>
              ))}
            </div>

            {/* Additional Insights */}
            <div className="bg-theme-primary/10 border border-theme-primary/20 rounded-2xl p-5">
              <h3 className="font-bold text-theme-text text-base mb-3 flex items-center gap-2">
                <Flame className="w-4 h-4 text-theme-primary" />
                <span>{t('statistics.focusInsights') || 'Focus Insights'}</span>
              </h3>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-theme-surface/60 p-3 rounded-xl border border-theme-border/50">
                  <div className="text-xl font-bold text-theme-primary">
                    {formatTime(Math.round(averageSessionLength))}
                  </div>
                  <div className="text-theme-muted text-xs mt-0.5">{t('statistics.averageSession') || 'Average Session'}</div>
                </div>
                <div className="bg-theme-surface/60 p-3 rounded-xl border border-theme-border/50">
                  <div className="text-xl font-bold text-emerald-500">{totalBreakTime}</div>
                  <div className="text-theme-muted text-xs mt-0.5">{t('statistics.totalBreakTime') || 'Total Break Time'}</div>
                </div>
                <div className="bg-theme-surface/60 p-3 rounded-xl border border-theme-border/50">
                  <div className="text-xl font-bold text-purple-500">{stats.totalBreaks}</div>
                  <div className="text-theme-muted text-xs mt-0.5">{t('statistics.totalBreaks') || 'Total Breaks'}</div>
                </div>
              </div>
            </div>

            {/* Achievements */}
            <div className="bg-theme-bg border border-theme-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3.5">
                <h3 className="font-bold text-theme-text text-base flex items-center gap-2">
                  <Award className="w-4 h-4 text-yellow-500" />
                  <span>{t('statistics.achievements') || 'Achievements'}</span>
                </h3>
                <span className="text-xs text-theme-muted font-medium">
                  {steamService.getUnlockedCount()} / {steamService.getTotalCount()}
                </span>
              </div>

              <div className="space-y-2.5">
                {stats.totalSessions >= 1 && (
                  <div className="flex items-center gap-3 p-3 bg-theme-surface border border-theme-border rounded-xl">
                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                    <div>
                      <span className="text-theme-text font-semibold text-sm block">
                        {t('statistics.firstSessionComplete') || 'First Session Complete!'}
                      </span>
                      <span className="text-xs text-theme-muted">
                        {t('statistics.firstSessionAchievementDesc') || '1 gaming session completed'}
                      </span>
                    </div>
                  </div>
                )}
                {stats.totalSessions >= 5 && (
                  <div className="flex items-center gap-3 p-3 bg-theme-surface border border-theme-border rounded-xl">
                    <div className="w-2.5 h-2.5 bg-theme-primary rounded-full shadow-[0_0_8px_var(--theme-primary)]" />
                    <div>
                      <span className="text-theme-text font-semibold text-sm block">
                        {t('statistics.focusBeginner') || 'Focus Beginner (5+ sessions)'}
                      </span>
                      <span className="text-xs text-theme-muted">
                        {t('statistics.focusBeginnerAchievementDesc') || '5 gaming sessions completed'}
                      </span>
                    </div>
                  </div>
                )}
                {stats.totalSessions >= 10 && (
                  <div className="flex items-center gap-3 p-3 bg-theme-surface border border-theme-border rounded-xl">
                    <div className="w-2.5 h-2.5 bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                    <div>
                      <span className="text-theme-text font-semibold text-sm block">
                        {t('statistics.focusExpert') || 'Focus Expert (10+ sessions)'}
                      </span>
                      <span className="text-xs text-theme-muted">
                        {t('statistics.focusExpertAchievementDesc') || '10 gaming sessions completed'}
                      </span>
                    </div>
                  </div>
                )}
                {stats.streak >= 5 && (
                  <div className="flex items-center gap-3 p-3 bg-theme-surface border border-theme-border rounded-xl">
                    <div className="w-2.5 h-2.5 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                    <div>
                      <span className="text-theme-text font-semibold text-sm block">
                        {t('statistics.breakChampion') || 'Break Champion (5+ streak)'}
                      </span>
                      <span className="text-xs text-theme-muted">
                        {t('statistics.breakChampionAchievementDesc') || '5 consecutive breaks taken'}
                      </span>
                    </div>
                  </div>
                )}
                {stats.totalSessions === 0 && (
                  <div className="text-center text-theme-muted py-6 bg-theme-surface rounded-xl border border-theme-border text-sm italic">
                    {t('statistics.startFirstSession') || 'Start your first session to unlock achievements!'}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* TAB 2: LEADERBOARD */
          <div className="space-y-5">
            {/* User Profile Card in Leaderboard */}
            <div className="bg-gradient-to-r from-theme-primary/15 via-theme-surface to-theme-surface border border-theme-primary/30 rounded-2xl p-5 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-theme-primary/20 text-theme-primary border border-theme-primary/30 flex items-center justify-center font-bold text-xl">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-theme-text text-base">
                      {steamUsername || (t('statistics.player') || 'Player')}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-theme-primary/20 text-theme-primary font-semibold">
                      {t('statistics.yourRank') || 'Your Rank'}
                    </span>
                  </div>
                  <span className="text-xs text-theme-muted">
                    {isSteamOnline ? (t('statistics.steamSynced') || 'Steam Cloud Synced') : (t('statistics.localMode') || 'Local Mode')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-6 text-right">
                <div>
                  <span className="text-xs text-theme-muted block">{t('statistics.focusTime') || 'Focus Time'}</span>
                  <span className="text-xl font-extrabold text-theme-primary">
                    {formatTime(stats.totalFocusTime)}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-theme-muted block">{t('statistics.totalSessions') || 'Sessions'}</span>
                  <span className="text-xl font-extrabold text-theme-text">
                    {stats.totalSessions}
                  </span>
                </div>
              </div>
            </div>

            {/* Top 10 Leaderboard List */}
            <div className="bg-theme-bg border border-theme-border rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-theme-border">
                <span className="font-bold text-sm text-theme-text flex items-center gap-2">
                  <Medal className="w-4 h-4 text-yellow-500" />
                  <span>{t('statistics.leaderboardTab') || 'Top 10 Leaderboard'}</span>
                </span>
                <span className="text-xs text-theme-muted">
                  Steamworks: `focus_hours`
                </span>
              </div>

              {isLoadingLeaderboard ? (
                <div className="p-8 text-center text-sm text-theme-muted flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-theme-primary" />
                  <span>{t('statistics.loadingLeaderboard') || 'Loading Steam Leaderboard...'}</span>
                </div>
              ) : leaderboardEntries.length > 0 ? (
                <div className="space-y-2">
                  {leaderboardEntries.map((entry) => {
                    const isTop1 = entry.rank === 1;
                    const isTop2 = entry.rank === 2;
                    const isTop3 = entry.rank === 3;
                    return (
                      <div
                        key={entry.rank}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                          isTop1
                            ? 'bg-yellow-500/10 border-yellow-500/30'
                            : isTop2
                            ? 'bg-slate-300/10 border-slate-400/30'
                            : isTop3
                            ? 'bg-amber-700/10 border-amber-700/30'
                            : 'bg-theme-surface border-theme-border'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center ${
                            isTop1
                              ? 'bg-yellow-500 text-black shadow-sm'
                              : isTop2
                              ? 'bg-slate-400 text-black'
                              : isTop3
                              ? 'bg-amber-700 text-white'
                              : 'bg-theme-border text-theme-muted'
                          }`}>
                            #{entry.rank}
                          </span>
                          <span className="font-semibold text-sm text-theme-text">
                            {entry.name}
                          </span>
                        </div>

                        <div className="font-bold text-sm text-theme-primary">
                          {entry.score} h
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 bg-theme-surface rounded-xl border border-theme-border text-center space-y-2.5">
                  <Trophy className="w-10 h-10 text-theme-muted mx-auto opacity-40" />
                  <p className="text-sm text-theme-text font-semibold">
                    {t('statistics.noLeaderboardEntries') || 'No entries on the Steam Leaderboard yet.'}
                  </p>
                  <p className="text-xs text-theme-muted max-w-md mx-auto">
                    {t('statistics.leaderboardHint') || 'Complete your focus sessions to climb the global Steam leaderboard! Your stats sync automatically with Steam.'}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 border-t border-theme-border flex flex-col sm:flex-row items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => steamService.openLeaderboardInSteam()}
                  className="flex-1 w-full p-2.5 bg-theme-primary/10 hover:bg-theme-primary/20 text-theme-primary rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 border border-theme-primary/20"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{t('statistics.openSteamCommunityLeaderboard') || 'Open Official Steam Leaderboard'}</span>
                </button>

                {onSync && (
                  <button
                    type="button"
                    onClick={handleManualSync}
                    disabled={isSyncing}
                    className="w-full sm:w-auto px-4 py-2.5 bg-theme-surface hover:bg-theme-border border border-theme-border text-theme-text rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? (t('statistics.syncing') || 'Syncing...') : (t('statistics.syncNow') || 'Sync Now')}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Close Button */}
        <div className="mt-6 text-center">
          <button
            onClick={onClose}
            className="px-8 py-2.5 bg-theme-primary hover:bg-theme-primaryHover text-white rounded-xl font-semibold transition-colors duration-200 text-sm shadow-sm"
          >
            {t('statistics.close') || 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Statistics;
