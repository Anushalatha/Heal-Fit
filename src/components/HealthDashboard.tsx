import React, { useState } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Mock data
const heartRateData = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  datasets: [
    {
      label: 'Heart Rate (bpm)',
      data: [75, 78, 76, 80, 77, 79, 78],
      borderColor: 'rgb(34, 197, 94)',
      tension: 0.4,
    },
  ],
};

const sleepData = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  datasets: [
    {
      label: 'Sleep Duration (hours)',
      data: [7.2, 6.5, 7.0, 6.8, 6.5, 7.5, 6.75],
      backgroundColor: 'rgba(59, 130, 246, 0.5)',
    },
  ],
};

// Mock data for mini charts
const miniHeartRateData = {
  labels: ['6h', '12h', '18h', '24h'],
  datasets: [
    {
      data: [72, 75, 78, 76],
      borderColor: '#22c55e',
      tension: 0.4,
      pointRadius: 0,
      borderWidth: 2,
    },
  ],
};

const miniBloodPressureData = {
  labels: ['6h', '12h', '18h', '24h'],
  datasets: [
    {
      data: [118, 122, 120, 120],
      borderColor: '#3b82f6',
      tension: 0.4,
      pointRadius: 0,
      borderWidth: 2,
    },
  ],
};

const miniSleepData = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu'],
  datasets: [
    {
      data: [7.2, 6.5, 7.0, 6.8],
      backgroundColor: 'rgba(59, 130, 246, 0.3)',
      borderColor: '#3b82f6',
      borderWidth: 1,
    },
  ],
};

const miniStepsData = {
  labels: ['6h', '12h', '18h', '24h'],
  datasets: [
    {
      data: [1200, 2800, 3800, 4320],
      borderColor: '#8b5cf6',
      tension: 0.4,
      pointRadius: 0,
      borderWidth: 2,
    },
  ],
};

const HealthDashboard: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showDetails, setShowDetails] = useState<string | null>(null);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleShowDetails = (metric: string) => {
    setShowDetails(showDetails === metric ? null : metric);
  };

  return (
    <div className={`min-h-screen p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header with Dark Mode Toggle */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Health Summary</h1>
          <button
            onClick={toggleDarkMode}
            className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            {isDarkMode ? '🌞 Light Mode' : '🌙 Dark Mode'}
          </button>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Health Summary Cards */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
                <VitalCard
                  title="Heart Rate"
                  value="78 bpm"
                  status="normal"
                  icon="❤️"
                  miniChart={
                    <div className="h-16 mt-2">
                      <Line
                        data={miniHeartRateData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { display: false },
                            tooltip: { enabled: false },
                          },
                          scales: {
                            x: { display: false },
                            y: { display: false },
                          },
                        }}
                      />
                    </div>
                  }
                  onShowDetails={() => handleShowDetails('heart')}
                  showDetails={showDetails === 'heart'}
                />
                <VitalCard
                  title="Blood Pressure"
                  value="120/80 mmHg"
                  status="normal"
                  icon="🫀"
                  miniChart={
                    <div className="h-16 mt-2">
                      <Line
                        data={miniBloodPressureData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { display: false },
                            tooltip: { enabled: false },
                          },
                          scales: {
                            x: { display: false },
                            y: { display: false },
                          },
                        }}
                      />
                    </div>
                  }
                  onShowDetails={() => handleShowDetails('bp')}
                  showDetails={showDetails === 'bp'}
                />
                <VitalCard
                  title="Sleep"
                  value="6h 45m"
                  status="warning"
                  icon="😴"
                  miniChart={
                    <div className="h-16 mt-2">
                      <Bar
                        data={miniSleepData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { display: false },
                            tooltip: { enabled: false },
                          },
                          scales: {
                            x: { display: false },
                            y: { display: false },
                          },
                        }}
                      />
                    </div>
                  }
                  onShowDetails={() => handleShowDetails('sleep')}
                  showDetails={showDetails === 'sleep'}
                />
                <VitalCard
                  title="Steps"
                  value="4,320"
                  status="progress"
                  progress={43}
                  icon="👣"
                  miniChart={
                    <div className="h-16 mt-2">
                      <Line
                        data={miniStepsData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { display: false },
                            tooltip: { enabled: false },
                          },
                          scales: {
                            x: { display: false },
                            y: { display: false },
                          },
                        }}
                      />
                    </div>
                  }
                  onShowDetails={() => handleShowDetails('steps')}
                  showDetails={showDetails === 'steps'}
                />
              </div>
            </div>

            {/* Health Insights */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">Health Insights</h2>
              <div className="space-y-4">
                <p className="text-green-600">✓ Your average heart rate is stable this week.</p>
                <p className="text-orange-500">⚠️ You slept 20% less than last week. Try adjusting your bedtime.</p>
              </div>
            </div>
          </div>

          {/* Right Column - Progress Tracker and Quick Tips */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">Progress Tracker</h2>
              <div className="space-y-4">
                <ProgressBar label="BMI" value={22.4} status="normal" />
                <ProgressBar label="Fitness Goal" value={65} status="progress" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">Quick Health Tips</h2>
              <div className="text-center text-lg">
                <p className="animate-fade-in">Stay hydrated throughout the day! 💧</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Vital Card Component
const VitalCard: React.FC<{
  title: string;
  value: string;
  status: 'normal' | 'warning' | 'progress';
  icon: string;
  progress?: number;
  miniChart?: React.ReactNode;
  onShowDetails?: () => void;
  showDetails?: boolean;
}> = ({ title, value, status, icon, progress, miniChart, onShowDetails, showDetails }) => {
  const statusColors = {
    normal: 'bg-green-100 text-green-700 border-green-200',
    warning: 'bg-red-100 text-red-700 border-red-200',
    progress: 'bg-blue-100 text-blue-700 border-blue-200',
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <span className={`px-2 py-1 rounded-full text-xs border ${statusColors[status]}`}>
          {status === 'normal' ? 'Normal' : status === 'warning' ? 'Needs Improvement' : 'In Progress'}
        </span>
      </div>
      <h3 className="text-base font-semibold mb-1 text-gray-900">{title}</h3>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      {miniChart}
      {progress && (
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            {progress}% of daily goal
          </p>
        </div>
      )}
      <button
        onClick={onShowDetails}
        className="mt-2 w-full py-1.5 px-3 bg-white border border-gray-200 hover:border-gray-300 rounded text-xs font-medium text-gray-700 transition-colors"
      >
        {showDetails ? 'Hide Details' : 'Show Details'}
      </button>
      {showDetails && (
        <div className="mt-2 p-3 bg-white border border-gray-100 rounded text-xs text-gray-600">
          {title === 'Heart Rate' && 'Average resting heart rate: 72 bpm. Peak during exercise: 145 bpm.'}
          {title === 'Blood Pressure' && 'Last 24 hours average: 120/80 mmHg. Diastolic range: 75-85 mmHg.'}
          {title === 'Sleep' && 'Deep sleep: 1h 45m. REM sleep: 2h 15m. Light sleep: 2h 45m.'}
          {title === 'Steps' && 'Morning: 1,200 steps. Afternoon: 2,800 steps. Evening: 1,320 steps.'}
        </div>
      )}
    </div>
  );
};

// Progress Bar Component
const ProgressBar: React.FC<{
  label: string;
  value: number;
  status: 'normal' | 'progress';
}> = ({ label, value, status }) => {
  const getColor = () => {
    if (status === 'normal') return 'bg-green-600';
    return 'bg-blue-600';
  };

  return (
    <div>
      <div className="flex justify-between mb-2">
        <span className="font-medium text-gray-900">{label}</span>
        <span className="font-medium text-gray-900">{value}{label === 'BMI' ? '' : '%'}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className={`${getColor()} h-2.5 rounded-full`}
          style={{ width: `${Math.min(value * 2, 100)}%` }}
        ></div>
      </div>
    </div>
  );
};

export default HealthDashboard; 