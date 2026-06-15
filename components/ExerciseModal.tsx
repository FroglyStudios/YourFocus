import React, { useState } from 'react';
import { X, Eye, Zap, RotateCcw, CheckCircle } from 'lucide-react';

interface ExerciseModalProps {
  onClose: () => void;
}

const ExerciseModal: React.FC<ExerciseModalProps> = ({ onClose }) => {
  const [currentExercise, setCurrentExercise] = useState(0);
  const [completed, setCompleted] = useState<boolean[]>([]);

  const exercises = [
    {
      icon: <Eye className="w-8 h-8" />,
      title: "20-20-20 Eye Rule",
      description: "Look at something 20 feet away for 20 seconds",
      instructions: "Find a window or distant object and focus on it. This helps relax your eye muscles and prevent eye strain.",
      duration: 20,
      color: "bg-theme-primary"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Neck Stretch",
      description: "Gentle neck rotations and stretches",
      instructions: "Slowly turn your head left, then right. Tilt your head to each shoulder. Hold each position for 5 seconds.",
      duration: 30,
      color: "bg-green-500"
    },
    {
      icon: <RotateCcw className="w-8 h-8" />,
      title: "Shoulder Rolls",
      description: "Release shoulder tension",
      instructions: "Roll your shoulders backward 5 times, then forward 5 times. Lift your shoulders to your ears and release.",
      duration: 25,
      color: "bg-purple-500"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Wrist Stretch",
      description: "Prevent repetitive strain injury",
      instructions: "Extend your arm forward, palm up. Use your other hand to gently pull your fingers back. Hold for 15 seconds each hand.",
      duration: 30,
      color: "bg-orange-500"
    }
  ];

  const markComplete = (index: number) => {
    const newCompleted = [...completed];
    newCompleted[index] = true;
    setCompleted(newCompleted);
  };

  const allCompleted = completed.length === exercises.length && completed.every(Boolean);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-theme-surface backdrop-blur-xl border border-theme-border rounded-3xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6 sticky top-0 bg-theme-surface z-10 pb-2 border-b border-theme-border">
          <h2 className="text-2xl font-bold text-theme-text">Break Exercises</h2>
          <button
            onClick={onClose}
            className="p-2 text-theme-muted hover:text-theme-text transition-colors duration-200 rounded-xl hover:bg-theme-bg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6 p-4 bg-theme-primary/10 rounded-2xl border border-theme-primary/20">
          <p className="text-theme-text text-sm font-medium">
            💡 These exercises help prevent gaming fatigue and maintain your health during long sessions.
          </p>
        </div>

        <div className="space-y-4">
          {exercises.map((exercise, index) => (
            <div
              key={index}
              className={`p-4 rounded-2xl border-2 transition-all duration-200 ${
                completed[index] 
                  ? 'bg-green-500/10 border-green-500/30' 
                  : currentExercise === index 
                    ? 'bg-theme-primary/10 border-theme-primary' 
                    : 'bg-theme-bg border-theme-border'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`${exercise.color} text-white p-3 rounded-xl flex-shrink-0 shadow-lg`}>
                  {exercise.icon}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-theme-text">{exercise.title}</h3>
                    <span className="text-sm text-theme-muted font-medium">{exercise.duration}s</span>
                  </div>
                  
                  <p className="text-theme-muted font-medium mb-2">{exercise.description}</p>
                  
                  {currentExercise === index && (
                    <div className="mt-3">
                      <p className="text-sm text-theme-text mb-3">{exercise.instructions}</p>
                      {!completed[index] && (
                        <button
                          onClick={() => markComplete(index)}
                          className="bg-theme-primary hover:bg-theme-primaryHover text-white px-4 py-2 rounded-xl font-medium transition-colors duration-200 flex items-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Mark Complete
                        </button>
                      )}
                    </div>
                  )}
                  
                  {completed[index] && (
                    <div className="flex items-center gap-2 mt-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-green-500 font-semibold">Completed!</span>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => setCurrentExercise(currentExercise === index ? -1 : index)}
                  className="text-theme-muted hover:text-theme-text p-1"
                >
                  {currentExercise === index ? '−' : '+'}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-theme-border">
          {allCompleted ? (
            <div className="text-center">
              <div className="text-green-500 mb-2">
                <CheckCircle className="w-8 h-8 mx-auto" />
              </div>
              <p className="text-green-500 font-semibold mb-4">Great job! You've completed all exercises.</p>
              <button
                onClick={onClose}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors duration-200"
              >
                Back to Gaming
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 text-theme-text bg-theme-bg hover:bg-theme-border border border-theme-border rounded-xl font-semibold transition-colors duration-200"
              >
                Skip for Now
              </button>
              <button
                onClick={() => {
                  const nextIncomplete = exercises.findIndex((_, i) => !completed[i]);
                  if (nextIncomplete !== -1) {
                    setCurrentExercise(nextIncomplete);
                  }
                }}
                className="flex-1 px-6 py-3 bg-theme-primary hover:bg-theme-primaryHover text-white rounded-xl font-semibold transition-colors duration-200"
              >
                Continue
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExerciseModal;