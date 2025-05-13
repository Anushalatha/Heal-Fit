import React, { useState, useEffect } from 'react';
import { Activity, Brain, Heart, TrendingUp, Calendar, AlertCircle, Clock, PlusCircle, MessageCircle, Pill, FileText, Target, Siren, Stethoscope, ExternalLink, Mic, Download, Search, ChevronDown, ChevronUp, CheckCircle, Circle, Music, Video, BookOpen, X, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { healthMetrics } from '../data/mockData';
import { format } from 'date-fns';
import { GoogleGenerativeAI } from '@google/generative-ai';
import ReportAnalyzer from './ReportAnalyzer';
import HealthPlanner from './HealthPlanner';
import EmergencyHelp from './EmergencyHelp';
import GoalTracker from './GoalTracker';
import SymptomTracker from './SymptomTracker';
import MedicationReminder from './MedicationReminder';
import HealthDashboard from './HealthDashboard';
import html2pdf from 'html2pdf.js';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import HealthProfile from './HealthProfile';

const genAI = new GoogleGenerativeAI("AIzaSyBTuhevuFKGRA4ZFZiHTJJz0kunCnC72Es");

const dailyPrompts = [
  'What made you smile today?',
  'What challenged you emotionally today?',
  'What are you grateful for?',
  'How did you take care of yourself today?',
  'What are you looking forward to tomorrow?',
  'What was the highlight of your day?',
  'What did you learn about yourself today?',
  'How did you practice self-care today?'
];

// Add type definitions for Web Speech API
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

// Add new interfaces for type safety
interface Challenge {
  id: number;
  day: number;
  activity: string;
  completed: boolean;
}

interface MoodData {
  date: string;
  mood: string;
  trigger?: string;
  relief?: string;
  gratitude: string[];
}

interface CopingResource {
  id: string;
  title: string;
  type: 'breathing' | 'grounding' | 'meditation' | 'music';
  url: string;
  description: string;
  embedUrl?: string;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('health-summary');
  const [journalEntry, setJournalEntry] = useState('');
  const [journalEntries, setJournalEntries] = useState<Array<{timestamp: string, entry: string}>>([]);
  const [mood, setMood] = useState<string>('');
  const [moodNote, setMoodNote] = useState('');
  const [medicalQuestion, setMedicalQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [dailyPrompt, setDailyPrompt] = useState('');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [isGeneratingAdvice, setIsGeneratingAdvice] = useState(false);
  const [userPoints, setUserPoints] = useState(0);
  const [userCoupons, setUserCoupons] = useState<Array<{ code: string; status: string; expiry: string }>>([]);
  const [moduleProgress, setModuleProgress] = useState({
    challenges: 0,
    mealPlanner: 0,
    goals: 0,
    journaling: 0,
  });
  const userId = user?.email ? user.email.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : 'USER';
  
  const defaultMetrics = healthMetrics.aggregated;
  const userMetrics = (user?.email && healthMetrics.byUser[user.email]) || defaultMetrics;

  const moods = ['😊 Great', '🙂 Okay', '😐 Meh', '😟 Stressed', '😢 Sad'];

  const bmi = user?.profile?.weight && user?.profile?.height 
    ? (user.profile.weight / Math.pow(user.profile.height / 100, 2)).toFixed(1)
    : 'N/A';

  const formatAIResponse = (response: string) => {
    return response
      .replace(/\*+/g, '')
      .replace(/\[https?:\/\/[^\]]+\]/g, '')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line)
      .join('\n');
  };

  const askAI = async (prompt: string) => {
    setIsLoading(true);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      setAiResponse(formatAIResponse(response.text()));
    } catch (error) {
      console.error('Error querying AI:', error);
      setAiResponse('Sorry, there was an error processing your request.');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    // Set random daily prompt on component mount
    setDailyPrompt(dailyPrompts[Math.floor(Math.random() * dailyPrompts.length)]);
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ message, type });
  };

  let recognitionInstance: any = null;

  const startVoiceRecognition = (target: 'journal' | 'medical') => {
    if (recognitionInstance) {
      recognitionInstance.abort();
      recognitionInstance = null;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showNotification('Voice recognition is not supported in your browser', 'error');
      return;
    }
    try {
      recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';
      recognitionInstance.onstart = () => setIsRecording(true);
      recognitionInstance.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (target === 'journal') {
          setJournalEntry(prev => prev + (prev ? ' ' : '') + transcript);
        } else {
          setMedicalQuestion(prev => prev + (prev ? ' ' : '') + transcript);
        }
        setIsRecording(false);
        recognitionInstance = null;
      };
      recognitionInstance.onerror = (event: any) => {
        setIsRecording(false);
        recognitionInstance = null;
        if (event.error === 'not-allowed' || event.error === 'denied') {
          showNotification('Microphone access was denied. Please allow microphone access in your browser settings.', 'error');
        } else {
          showNotification('Voice recognition error: ' + event.error, 'error');
        }
        console.error('Speech recognition error:', event.error);
      };
      recognitionInstance.onend = () => {
        setIsRecording(false);
        recognitionInstance = null;
      };
      recognitionInstance.start();
    } catch (error) {
      setIsRecording(false);
      recognitionInstance = null;
      showNotification('Failed to initialize voice recognition', 'error');
      console.error('Speech recognition initialization error:', error);
    }
  };

  const handleJournalSubmit = () => {
    if (journalEntry.trim()) {
      const newEntry = {
        timestamp: format(new Date(), 'yyyy-MM-dd HH:mm'),
        entry: journalEntry
      };
      setJournalEntries([newEntry, ...journalEntries]);
      setJournalEntry('');
      showNotification('✅ Entry Saved Successfully', 'success');
      completeTask('journaling');
    }
  };

  const handleMoodSubmit = async () => {
    if (mood) {
      const prompt = `I'm feeling ${mood}. Additional context: ${moodNote}. 
        Suggest mindfulness activities, coping strategies, and a daily affirmation. 
        Be empathetic and supportive. Keep the response concise.`;
      await askAI(prompt);
    }
  };

  const handleMedicalQuestion = async () => {
    if (medicalQuestion.trim()) {
      const prompt = `Answer this medical question using verified sources and simple language: ${medicalQuestion}
        Keep the response concise and easy to understand.`;
      await askAI(prompt);
    }
  };

  const exportToPDF = () => {
    const element = document.createElement('div');
    element.innerHTML = `
      <h1 style="text-align: center; color: #1a365d; margin-bottom: 20px;">Health Journal Entries</h1>
      ${journalEntries.map(entry => `
        <div style="margin-bottom: 20px; padding: 10px; border-bottom: 1px solid #e2e8f0;">
          <p style="color: #4a5568; font-size: 14px;">${entry.timestamp}</p>
          <p style="color: #2d3748; font-size: 16px;">${entry.entry}</p>
        </div>
      `).join('')}
    `;

    const opt = {
      margin: 1,
      filename: 'health-journal.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  };

  const filteredEntries = journalEntries
    .filter(entry => 
      entry.entry.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.timestamp.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortOrder === 'newest') {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      }
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });

  const [challenges, setChallenges] = useState<Challenge[]>([
    { id: 1, day: 1, activity: "Take a 5-minute mindful walk", completed: false },
    { id: 2, day: 2, activity: "Write three positive affirmations", completed: false },
    { id: 3, day: 3, activity: "Practice deep breathing for 2 minutes", completed: false },
    { id: 4, day: 4, activity: "List three things you're grateful for", completed: false },
    { id: 5, day: 5, activity: "Do a quick body scan meditation", completed: false },
    { id: 6, day: 6, activity: "Share a kind message with someone", completed: false },
    { id: 7, day: 7, activity: "Try a new relaxation technique", completed: false },
  ]);

  const [moodHistory, setMoodHistory] = useState<MoodData[]>([]);
  const [showCopingResources, setShowCopingResources] = useState(false);
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [trigger, setTrigger] = useState('');
  const [relief, setRelief] = useState('');

  const copingResources: CopingResource[] = [
    {
      id: 'breathing1',
      title: '4-7-8 Breathing Exercise',
      type: 'breathing',
      url: '',
      description: 'A guided breathing exercise to help reduce anxiety and promote relaxation',
      embedUrl: 'https://www.youtube.com/embed/0Jc8tQqQYwY'
    },
    {
      id: 'grounding1',
      title: '5-4-3-2-1 Grounding Technique',
      type: 'grounding',
      url: '',
      description: 'A quick grounding exercise using your senses to help you stay present and calm',
      embedUrl: 'https://www.youtube.com/embed/O-6f5wQXSu8'
    },
    {
      id: 'meditation1',
      title: 'Quick Calm Meditation',
      type: 'meditation',
      url: '',
      description: 'A 5-minute guided meditation to help you find peace and clarity',
      embedUrl: 'https://www.youtube.com/embed/inpok4MKVLM'
    },
    {
      id: 'music1',
      title: 'Calming Nature Sounds',
      type: 'music',
      url: '',
      description: 'Soothing nature sounds playlist to help you relax and focus',
      embedUrl: 'https://open.spotify.com/embed/playlist/37i9dQZF1DX3Ogo9pFvBkY'
    }
  ];

  const emotions = [
    { category: 'Positive', emotions: ['Happy', 'Grateful', 'Peaceful', 'Excited', 'Content'] },
    { category: 'Neutral', emotions: ['Calm', 'Focused', 'Tired', 'Meh', 'Curious'] },
    { category: 'Challenging', emotions: ['Anxious', 'Stressed', 'Sad', 'Angry', 'Overwhelmed'] }
  ];

  const moodSuggestions = {
    'Sad': {
      quote: "Every day may not be good, but there is something good in every day.",
      copingCard: "Remember that feelings are temporary. Try reaching out to a friend or engaging in a favorite activity.",
      activity: "Take a short walk outside and notice three beautiful things around you."
    },
    'Stressed': {
      quote: "You are stronger than you think.",
      copingCard: "Practice the 4-7-8 breathing technique: inhale for 4, hold for 7, exhale for 8.",
      activity: "Do a quick 2-minute stretch routine to release tension."
    },
    // Add more mood suggestions as needed
  };

  const challengeGradients = [
    'from-blue-100 to-blue-50',
    'from-pink-100 to-pink-50',
    'from-purple-100 to-purple-50',
    'from-green-100 to-green-50',
    'from-yellow-100 to-yellow-50',
    'from-red-100 to-red-50',
    'from-indigo-100 to-indigo-50'
  ];

  const moodEmojis: Record<string, string> = {
    'Happy': '☀️',
    'Grateful': '🙏',
    'Peaceful': '😌',
    'Excited': '🤩',
    'Content': '😊',
    'Calm': '🧘',
    'Focused': '🎯',
    'Tired': '😴',
    'Meh': '😐',
    'Curious': '🤔',
    'Anxious': '😰',
    'Stressed': '😓',
    'Sad': '😢',
    'Angry': '😠',
    'Overwhelmed': '😫'
  };

  const toggleChallenge = (id: number) => {
    setChallenges(challenges.map(challenge => {
      if (challenge.id === id && !challenge.completed) {
        // Trigger confetti when completing a challenge
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        return { ...challenge, completed: true };
      }
      return challenge;
    }));
    completeTask('challenges');
  };

  const generateAIAdvice = async () => {
    if (!selectedEmotion || !trigger || !relief) return;

    setIsGeneratingAdvice(true);
    try {
      const prompt = `I'm feeling ${selectedEmotion}. 
        Trigger: ${trigger}
        What helped: ${relief}
        Please provide personalized advice, coping strategies, and encouragement. 
        Keep it concise and supportive.`;

      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      setAiAdvice(response.text());
    } catch (error) {
      console.error('Error generating AI advice:', error);
      setAiAdvice('Sorry, I encountered an error. Please try again.');
    }
    setIsGeneratingAdvice(false);
  };

  // Helper to add points and update module progress
  const completeTask = (module: keyof typeof moduleProgress) => {
    setUserPoints((pts) => pts + 10);
    setModuleProgress((prog) => ({ ...prog, [module]: prog[module] + 1 }));
  };

  // Coupon generation and claim
  const claimReward = () => {
    if (userPoints < 100) return;
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    const code = `HEX-${userId}-${randomStr}`;
    const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setUserCoupons((coupons) => [
      ...coupons,
      { code, status: 'active', expiry },
    ]);
    setUserPoints((pts) => pts - 100);
  };

  // Mock Hexpertify API integration
  const redeemCoupon = (code: string) => {
    setUserCoupons((coupons) => coupons.map(c => c.code === code ? { ...c, status: 'claimed' } : c));
    // Here, you would call the real API to attach the coupon to a booking
    showNotification(`Coupon ${code} applied to your Hexpertify booking!`, 'success');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'health-summary':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Health Overview</h2>
                <HealthDashboard />
              </div>
            </div>
          </div>
        );

      case 'health-journal':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Health Journal</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Today's Entry</h3>
                  {dailyPrompt && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <p className="text-blue-800 font-medium">Daily Prompt:</p>
                      <p className="text-blue-600">{dailyPrompt}</p>
                    </div>
                  )}
                  <div className="relative">
                    <textarea
                      value={journalEntry}
                      onChange={(e) => setJournalEntry(e.target.value)}
                      className="w-full h-32 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="How are you feeling today?"
                    />
                    <button
                      type="button"
                      onClick={() => startVoiceRecognition('journal')}
                      className={`absolute right-2 bottom-2 p-2 rounded-full ${isRecording ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                      aria-label="Start voice input"
                    >
                      <Mic className="w-5 h-5" />
                    </button>
                  </div>
                  <button
                    onClick={handleJournalSubmit}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Save Entry
                  </button>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Recent Entries</h3>
                    <button
                      onClick={exportToPDF}
                      className="flex items-center px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Export PDF
                    </button>
                  </div>
                  <div className="mb-4 space-y-2">
                    <div className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search entries..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                    </div>
                    <select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                      className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                    </select>
                  </div>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto">
                    {filteredEntries.map((entry, index) => (
                      <div key={index} className="p-3 bg-white rounded-lg border border-gray-100">
                        <p className="text-sm text-gray-600">{entry.timestamp}</p>
                        <p className="text-gray-900">{entry.entry}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'mental-health':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Mental Health Check-in</h2>
              
              {/* 7-Day Challenge Section */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">7-Day Mental Wellness Challenge</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {challenges.map((challenge) => (
                    <motion.div
                      key={challenge.id}
                      whileHover={{ scale: 1.02 }}
                      className="p-4 rounded-2xl border border-gray-100 flex items-center justify-between shadow-md bg-white transition-all duration-200 ease-in-out"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-gray-600">Day {challenge.day}</span>
                        </div>
                        <p className="text-text font-medium">{challenge.activity}</p>
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-500 ${challenge.completed ? 'bg-success' : 'bg-gray-300'}`}
                            style={{ width: challenge.completed ? '100%' : '0%' }}
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => toggleChallenge(challenge.id)}
                        className={`ml-4 p-2 rounded-full transition-all duration-300 border-2 ${
                          challenge.completed
                            ? 'text-green-500 hover:text-green-600 border-green-300 bg-white'
                            : 'text-gray-400 hover:text-gray-500 border-gray-300 bg-white'
                        }`}
                        aria-label={challenge.completed ? 'Completed' : 'Mark as complete'}
                      >
                        {challenge.completed ? (
                          <CheckCircle className="w-6 h-6" />
                        ) : (
                          <Circle className="w-6 h-6" />
                        )}
                      </button>
                    </motion.div>
                  ))}
                </div>
                {/* Weekly Progress Bar - Soft, colorful */}
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-text">Weekly Progress</span>
                    <span className="text-sm font-medium text-success">{challenges.filter(c => c.completed).length}/7 days</span>
                  </div>
                  <div className="w-full h-4 bg-secondary/30 rounded-2xl shadow-inner relative overflow-hidden">
                    <div
                      className="h-4 rounded-2xl bg-primary transition-all duration-700 shadow-md"
                      style={{ width: `${(challenges.filter(c => c.completed).length / challenges.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Mood Selection */}
              <div className="mb-8">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">How are you feeling?</h3>
                  <div className="space-y-4">
                    {emotions.map(category => (
                      <div key={category.category}>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">{category.category}</h4>
                        <div className="flex flex-wrap gap-2">
                          {category.emotions.map(emotion => (
                            <button
                              key={emotion}
                              onClick={() => setSelectedEmotion(emotion)}
                              className={`px-3 py-1.5 rounded-full text-sm flex items-center gap-1 ${
                                selectedEmotion === emotion
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-500'
                              }`}
                            >
                              {moodEmojis[emotion]} {emotion}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Trigger & Relief Log with AI Advice */}
              {selectedEmotion && (
                <div className="space-y-6 mb-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">What triggered this feeling?</h3>
                      <textarea
                        value={trigger}
                        onChange={(e) => setTrigger(e.target.value)}
                        className="w-full h-24 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Describe what led to this feeling..."
                      />
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">What helped you cope?</h3>
                      <textarea
                        value={relief}
                        onChange={(e) => setRelief(e.target.value)}
                        className="w-full h-24 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Share what helped you feel better..."
                      />
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <button
                      onClick={generateAIAdvice}
                      disabled={isGeneratingAdvice || !trigger || !relief}
                      className={`px-6 py-3 rounded-lg text-white font-medium transition-colors ${
                        isGeneratingAdvice || !trigger || !relief
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {isGeneratingAdvice ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                          Generating Advice...
                        </div>
                      ) : (
                        'Get Personalized Advice'
                      )}
                    </button>
                  </div>

                  {aiAdvice && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-xl border border-purple-100"
                    >
                      <h4 className="text-lg font-medium text-gray-900 mb-2">Personalized Advice</h4>
                      <p className="text-gray-700 whitespace-pre-line">{aiAdvice}</p>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Coping Resources Library */}
              <div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Coping Resources Library</h3>
                    <button
                      onClick={() => setShowCopingResources(!showCopingResources)}
                      className="p-2 text-gray-500 hover:text-gray-700"
                    >
                      {showCopingResources ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                  <AnimatePresence>
                    {showCopingResources && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="grid grid-cols-1 gap-6">
                          {copingResources.map(resource => (
                            <div
                              key={resource.id}
                              className="p-4 bg-white rounded-lg border border-gray-100 hover:border-blue-200 transition-colors"
                            >
                              <div className="flex items-center gap-2 mb-3">
                                {resource.type === 'breathing' && <Activity className="w-5 h-5 text-blue-500" />}
                                {resource.type === 'grounding' && <Target className="w-5 h-5 text-green-500" />}
                                {resource.type === 'meditation' && <Brain className="w-5 h-5 text-purple-500" />}
                                {resource.type === 'music' && <Music className="w-5 h-5 text-red-500" />}
                                <h4 className="font-medium text-gray-900">{resource.title}</h4>
                              </div>
                              <p className="text-sm text-gray-600 mb-4">{resource.description}</p>
                              {resource.embedUrl && (
                                <div className="aspect-video w-full rounded-lg overflow-hidden">
                                  {resource.type === 'music' ? (
                                    <iframe
                                      src={resource.embedUrl}
                                      width="100%"
                                      height="352"
                                      frameBorder="0"
                                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                      loading="lazy"
                                      className="rounded-lg"
                                    />
                                  ) : (
                                    <iframe
                                      src={resource.embedUrl}
                                      title={resource.title}
                                      width="100%"
                                      height="100%"
                                      frameBorder="0"
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                      allowFullScreen
                                      className="rounded-lg"
                                    />
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        );

      case 'medical-qa':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Medical Q&A</h3>
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    value={medicalQuestion}
                    onChange={(e) => setMedicalQuestion(e.target.value)}
                    className="w-full p-3 border rounded-lg"
                    placeholder="Ask a medical question..."
                  />
                  <button
                    type="button"
                    onClick={() => startVoiceRecognition('medical')}
                    className={`absolute right-3 top-3 p-2 rounded-full ${isRecording ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                    aria-label="Start voice input"
                  >
                    <Mic className="w-5 h-5 animate-pulse" />
                  </button>
                </div>
                <button
                  onClick={handleMedicalQuestion}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  disabled={!medicalQuestion.trim() || isLoading}
                >
                  Ask AI
                </button>
                {isLoading && (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                  </div>
                )}
                {aiResponse && (
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Answer:</h4>
                    <div className="prose prose-sm max-w-none">
                      {aiResponse.split('\n').map((paragraph, index) => (
                        <p key={index} className="text-gray-700 leading-relaxed mb-2">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'health-planner':
        return <HealthPlanner />;

      case 'emergency-help':
        return <EmergencyHelp />;

      case 'goal-tracker':
        return <GoalTracker completeTask={completeTask} />;

      case 'symptom-tracker':
        return <SymptomTracker />;

      case 'medication-reminder':
        return <MedicationReminder />;

      case 'rewards':
        return (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">Rewards & Coupons</h3>
            <div className="mb-4 flex items-center gap-6">
              <div className="text-xl font-bold">Total Points: <span className="text-indigo-600">{userPoints}</span></div>
              {userPoints >= 100 && (
                <button
                  onClick={claimReward}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Claim Reward (100 pts)
                </button>
              )}
            </div>
            <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="font-medium text-gray-700">Challenges</div>
                <div className="text-2xl font-bold">{moduleProgress.challenges}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="font-medium text-gray-700">Meal Planner</div>
                <div className="text-2xl font-bold">{moduleProgress.mealPlanner}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="font-medium text-gray-700">Goals</div>
                <div className="text-2xl font-bold">{moduleProgress.goals}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="font-medium text-gray-700">Journaling</div>
                <div className="text-2xl font-bold">{moduleProgress.journaling}</div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Your Coupons</h4>
              <div className="space-y-2">
                {userCoupons.length === 0 && <div className="text-gray-500">No coupons yet.</div>}
                {userCoupons.map(coupon => (
                  <div key={coupon.code} className="flex items-center justify-between bg-indigo-50 p-3 rounded-lg">
                    <div>
                      <span className="font-mono text-lg">{coupon.code}</span>
                      <span className="ml-4 text-sm text-gray-600">Expiry: {coupon.expiry}</span>
                      <span className={`ml-4 text-sm font-semibold ${coupon.status === 'active' ? 'text-green-600' : 'text-gray-400'}`}>{coupon.status}</span>
                    </div>
                    {coupon.status === 'active' && (
                      <button
                        onClick={() => redeemCoupon(coupon.code)}
                        className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                      >
                        Redeem
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Notification Banner */}
        {notification && (
          <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            notification.type === 'success' ? 'bg-green-500' :
            notification.type === 'error' ? 'bg-red-500' :
            'bg-blue-500'
          } text-white`}>
            {notification.message}
          </div>
        )}
        
        <div className="mb-8">
          <nav className="flex flex-wrap gap-4">
            {[
              { id: 'health-summary', label: 'Health Summary', icon: Heart },
              { id: 'health-journal', label: 'Health Journal', icon: PlusCircle },
              { id: 'mental-health', label: 'Mental Health', icon: Brain },
              { id: 'health-planner', label: 'Health Planner', icon: Target },
              { id: 'medical-qa', label: 'Medical Q&A', icon: MessageCircle },
              { id: 'emergency-help', label: 'Emergency Help', icon: Siren },
              { id: 'goal-tracker', label: 'Goal Tracker', icon: Target },
              { id: 'symptom-tracker', label: 'Symptom Tracker', icon: Stethoscope },
              { id: 'medication-reminder', label: 'Medication Reminder', icon: Pill },
              { id: 'rewards', label: 'Rewards', icon: PlusCircle }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
        
        {renderContent()}

        <div className="mt-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between">
            <div className="text-white mb-4 sm:mb-0">
              <h3 className="text-2xl font-bold mb-2">Connect with Expert Doctors</h3>
              <p className="text-blue-100 max-w-xl">
                Get personalized medical advice from experienced healthcare professionals. Our verified doctors are ready to help you with your health concerns.
              </p>
            </div>
            <a
              href="https://hexpertify.com/services/doctors/66d842e4210a8bd3caa83c5e"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-indigo-600 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-indigo-600 focus:ring-white transition-colors duration-200"
            >
              <span>Find a Doctor</span>
              <ExternalLink className="ml-2 h-5 w-5" />
            </a>
          </div>
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-2">
            <p className="text-blue-100 text-sm text-center">
              ✨ Expert consultation available 24/7 • Secure and confidential • Verified medical professionals
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;