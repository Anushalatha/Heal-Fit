import React, { useState } from 'react';
import { Target, Award, CheckCircle, Trophy, Brain, Heart, Moon } from 'lucide-react';

interface Goal {
  id: string;
  text: string;
  completed: boolean;
}

interface GoalCategory {
  name: string;
  icon: React.ElementType;
  goals: string[];
}

interface GoalTrackerProps {
  completeTask?: (module: 'goals') => void;
}

const goalCategories: GoalCategory[] = [
  {
    name: "Physical Health",
    icon: Heart,
    goals: [
      "Walk 8,000 steps today",
      "Complete a 30-minute workout",
      "Stretch for 10 minutes",
      "Take the stairs instead of elevator",
      "Do 20 push-ups"
    ]
  },
  {
    name: "Nutrition",
    icon: Target,
    goals: [
      "Drink 8 glasses of water",
      "Eat 3 servings of vegetables",
      "Avoid sugary snacks today",
      "Prepare a healthy breakfast",
      "Track calorie intake"
    ]
  },
  {
    name: "Mental Wellness",
    icon: Brain,
    goals: [
      "Do a 10-minute meditation",
      "Write in your journal",
      "Practice deep breathing exercises",
      "Take a mindful walk",
      "Express gratitude"
    ]
  },
  {
    name: "Sleep Hygiene",
    icon: Moon,
    goals: [
      "Sleep for at least 7 hours",
      "Avoid screens 1 hour before bed",
      "Go to bed by 10 PM",
      "Create a bedtime routine",
      "Keep bedroom temperature optimal"
    ]
  }
];

const GoalTracker: React.FC<GoalTrackerProps> = ({ completeTask }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(goalCategories[0].name);
  const [activeGoals, setActiveGoals] = useState<Goal[]>([]);
  const [points, setPoints] = useState<number>(0);
  const [showConfetti, setShowConfetti] = useState(false);

  const handleLoadGoals = () => {
    const category = goalCategories.find(cat => cat.name === selectedCategory);
    if (category) {
      const newGoals = category.goals.map(goal => ({
        id: Math.random().toString(36).substr(2, 9),
        text: goal,
        completed: false
      }));
      setActiveGoals(newGoals);
    }
  };

  const handleGoalToggle = (goalId: string) => {
    setActiveGoals(prev => prev.map(goal => {
      if (goal.id === goalId && !goal.completed) {
        setPoints(p => p + 5);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 2000);
        if (completeTask) completeTask('goals');
        return { ...goal, completed: true };
      }
      return goal;
    }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Smart Health Goal Tracker</h1>
        <p className="text-gray-600">Set, track, and achieve your daily health goals</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Target className="w-6 h-6 text-indigo-600 mr-2" />
          Choose Your Goal Category
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {goalCategories.map(category => {
            const Icon = category.icon;
            return (
              <button
                key={category.name}
                onClick={() => setSelectedCategory(category.name)}
                className={`p-4 rounded-lg transition-colors duration-200 flex flex-col items-center ${
                  selectedCategory === category.name
                    ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-500'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-8 h-8 mb-2" />
                <span className="font-medium">{category.name}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={handleLoadGoals}
          className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 flex items-center justify-center"
        >
          <Award className="w-5 h-5 mr-2" />
          Load My Daily Goals
        </button>
      </div>

      {activeGoals.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
            Track Your Progress
          </h2>
          
          <div className="space-y-4">
            {activeGoals.map(goal => (
              <div
                key={goal.id}
                className={`p-4 rounded-lg transition-colors duration-200 flex items-center justify-between ${
                  goal.completed ? 'bg-green-50' : 'bg-gray-50'
                }`}
              >
                <span className={goal.completed ? 'text-green-700' : 'text-gray-700'}>
                  {goal.text}
                </span>
                <button
                  onClick={() => handleGoalToggle(goal.id)}
                  disabled={goal.completed}
                  className={`p-2 rounded-full transition-colors duration-200 ${
                    goal.completed
                      ? 'bg-green-100 text-green-600'
                      : 'bg-gray-200 text-gray-600 hover:bg-indigo-100 hover:text-indigo-600'
                  }`}
                >
                  <CheckCircle className="w-6 h-6" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-6 rounded-lg shadow flex items-center justify-between">
        <div className="flex items-center">
          <Trophy className="w-8 h-8 text-yellow-600 mr-3" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Total Points</h3>
            <p className="text-yellow-700">{points} points earned</p>
          </div>
        </div>
        {showConfetti && (
          <div className="text-2xl animate-bounce">
            🎉
          </div>
        )}
      </div>
    </div>
  );
};

export default GoalTracker;