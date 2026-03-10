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
      color: "bg-blue-500",
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Your Focus Statistics</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 transition-colors duration-200 rounded-xl hover:bg-slate-100"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {statCards.map((stat, index) => (
            <div key={index} className="bg-slate-50 rounded-2xl p-6">
              <div className="flex items-center gap-4 mb-3">
                <div className={`${stat.color} text-white p-3 rounded-xl`}>
                  {stat.icon}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">{stat.title}</h3>
                  <p className="text-slate-600 text-sm">{stat.description}</p>
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-800">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Additional Insights */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 mb-6">
          <h3 className="font-bold text-slate-800 text-xl mb-4">Focus Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {formatTime(Math.round(averageSessionLength))}
              </div>
              <div className="text-slate-600 text-sm">Average Session</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{totalBreakTime}</div>
              <div className="text-slate-600 text-sm">Total Break Time</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{stats.totalBreaks}</div>
              <div className="text-slate-600 text-sm">Total Breaks</div>
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-slate-50 rounded-2xl p-6">
          <h3 className="font-bold text-slate-800 text-xl mb-4">Achievements</h3>
          <div className="space-y-3">
            {stats.totalSessions >= 1 && (
              <div className="flex items-center gap-3 p-3 bg-white rounded-xl">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-slate-700 font-medium">First Session Complete!</span>
              </div>
            )}
            {stats.totalSessions >= 5 && (
              <div className="flex items-center gap-3 p-3 bg-white rounded-xl">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-slate-700 font-medium">Focus Beginner (5+ sessions)</span>
              </div>
            )}
            {stats.totalSessions >= 25 && (
              <div className="flex items-center gap-3 p-3 bg-white rounded-xl">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-slate-700 font-medium">Focus Expert (25+ sessions)</span>
              </div>
            )}
            {stats.streak >= 5 && (
              <div className="flex items-center gap-3 p-3 bg-white rounded-xl">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-slate-700 font-medium">Break Champion (5+ streak)</span>
              </div>
            )}
            {stats.totalSessions === 0 && (
              <div className="text-center text-slate-500 py-4">
                Start your first session to unlock achievements!
              </div>
            )}
          </div>
        </div>

        {/* Close Button */}
        <div className="mt-6 text-center">
          <button
            onClick={onClose}
            className="px-8 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-xl font-semibold transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default Statistics;