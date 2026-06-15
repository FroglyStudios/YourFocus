import React from 'react';
import { X, Trophy, Clock, Zap, Target } from 'lucide-react';

interface StatisticsProps {
  stats: {
    totalSessions: number;
    totalFocusTime: number;
    totalBreaks: number;
    totalBreakTime: number;
    streak: number;
    todaySessions: number;
  };
  onClose: () => void;
}

const Statistics: React.FC<StatisticsProps> = ({ stats, onClose }) => {
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
      icon: <Trophy className="w-8 h-8" />,
      title: "Total Sessions",
      value: stats.totalSessions,
      color: "bg-yellow-500",
      description: "gaming sessions completed"
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: "Focus Time",
      value: formatTime(stats.totalFocusTime),
      color: "bg-theme-primary",
      description: "total time focused"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Break Streak",
      value: stats.streak,
      color: "bg-green-500",
      description: "consecutive breaks taken"
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: "Today's Sessions",
      value: stats.todaySessions,
      color: "bg-purple-500",
      description: "sessions completed today"
    }
  ];

  const averageSessionLength = stats.totalSessions > 0 ? stats.totalFocusTime / stats.totalSessions : 0;
  const totalBreakTime = formatTime(stats.totalBreakTime);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-theme-surface backdrop-blur-xl border border-theme-border rounded-3xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6 sticky top-0 bg-theme-surface z-10 pb-2 border-b border-theme-border">
          <h2 className="text-2xl font-bold text-theme-text">Your Focus Statistics</h2>
          <button
            onClick={onClose}
            className="p-2 text-theme-muted hover:text-theme-text transition-colors duration-200 rounded-xl hover:bg-theme-bg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {statCards.map((stat, index) => (
            <div key={index} className="bg-theme-bg border border-theme-border rounded-2xl p-6">
              <div className="flex items-center gap-4 mb-3">
                <div className={`${stat.color} text-white p-3 rounded-xl shadow-lg`}>
                  {stat.icon}
                </div>
                <div>
                  <h3 className="font-bold text-theme-text text-lg">{stat.title}</h3>
                  <p className="text-theme-muted text-sm">{stat.description}</p>
                </div>
              </div>
              <div className="text-3xl font-bold text-theme-text">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Additional Insights */}
        <div className="bg-theme-primary/10 border border-theme-primary/20 rounded-2xl p-6 mb-6">
          <h3 className="font-bold text-theme-text text-xl mb-4">Focus Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-theme-primary">
                {formatTime(Math.round(averageSessionLength))}
              </div>
              <div className="text-theme-muted text-sm">Average Session</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-500">{totalBreakTime}</div>
              <div className="text-theme-muted text-sm">Total Break Time</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-500">{stats.totalBreaks}</div>
              <div className="text-theme-muted text-sm">Total Breaks</div>
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-theme-bg border border-theme-border rounded-2xl p-6">
          <h3 className="font-bold text-theme-text text-xl mb-4">Achievements</h3>
          <div className="space-y-3">
            {stats.totalSessions >= 1 && (
              <div className="flex items-center gap-3 p-3 bg-theme-surface border border-theme-border rounded-xl">
                <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
                <span className="text-theme-text font-medium">First Session Complete!</span>
              </div>
            )}
            {stats.totalSessions >= 5 && (
              <div className="flex items-center gap-3 p-3 bg-theme-surface border border-theme-border rounded-xl">
                <div className="w-2 h-2 bg-theme-primary rounded-full shadow-[0_0_8px_var(--theme-primary)]"></div>
                <span className="text-theme-text font-medium">Focus Beginner (5+ sessions)</span>
              </div>
            )}
            {stats.totalSessions >= 10 && (
              <div className="flex items-center gap-3 p-3 bg-theme-surface border border-theme-border rounded-xl">
                <div className="w-2 h-2 bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.8)]"></div>
                <span className="text-theme-text font-medium">Focus Expert (10+ sessions)</span>
              </div>
            )}
            {stats.streak >= 5 && (
              <div className="flex items-center gap-3 p-3 bg-theme-surface border border-theme-border rounded-xl">
                <div className="w-2 h-2 bg-orange-500 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.8)]"></div>
                <span className="text-theme-text font-medium">Break Champion (5+ streak)</span>
              </div>
            )}
            {stats.totalSessions === 0 && (
              <div className="text-center text-theme-muted py-4">
                Start your first session to unlock achievements!
              </div>
            )}
          </div>
        </div>

        {/* Close Button */}
        <div className="mt-6 text-center">
          <button
            onClick={onClose}
            className="px-8 py-3 bg-theme-primary hover:bg-theme-primaryHover text-white rounded-xl font-semibold transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default Statistics;