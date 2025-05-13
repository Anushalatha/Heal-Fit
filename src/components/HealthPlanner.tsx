import React, { useState } from 'react';
import { Target, Clock, Apple, Salad, Beef, Wheat, Droplets, Milk, Utensils, Coffee } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI("AIzaSyBTuhevuFKGRA4ZFZiHTJJz0kunCnC72Es");

const categories = {
  "Fruits": ["Apples", "Bananas", "Oranges", "Berries", "Mangoes", "Avocados", "Grapes", "Papaya"],
  "Vegetables": ["Carrots", "Spinach", "Broccoli", "Bell Peppers", "Cucumber", "Tomatoes", "Cauliflower", "Sweet Potatoes"],
  "Proteins": ["Chicken", "Tofu", "Lentils", "Eggs", "Fish", "Chickpeas", "Paneer", "Greek Yogurt"],
  "Whole Grains & Carbs": ["Rice", "Oats", "Quinoa", "Whole Wheat Bread", "Pasta", "Millets", "Barley", "Sweet Corn"],
  "Healthy Fats & Nuts": ["Olive Oil", "Nuts", "Seeds", "Nut Butter", "Coconut Oil", "Flaxseeds", "Chia Seeds"],
  "Dairy & Alternatives": ["Milk", "Almond Milk", "Yogurt", "Cheese", "Soy Milk"],
  "Spices & Condiments": ["Turmeric", "Black Pepper", "Ginger", "Garlic", "Cumin", "Cinnamon", "Honey"],
  "Beverages": ["Green Tea", "Lemon", "Coconut Water", "Herbal Tea"]
};

const categoryIcons = {
  "Fruits": Apple,
  "Vegetables": Salad,
  "Proteins": Beef,
  "Whole Grains & Carbs": Wheat,
  "Healthy Fats & Nuts": Droplets,
  "Dairy & Alternatives": Milk,
  "Spices & Condiments": Utensils,
  "Beverages": Coffee
};

const HealthPlanner: React.FC = () => {
  const [goal, setGoal] = useState("Weight Loss");
  const [duration, setDuration] = useState("1 Day");
  const [preferences, setPreferences] = useState("");
  const [selectedGroceries, setSelectedGroceries] = useState<string[]>([]);
  const [otherGrocery, setOtherGrocery] = useState("");
  const [plan, setPlan] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const toggleGroceryItem = (item: string) => {
    setSelectedGroceries(prev => 
      prev.includes(item) 
        ? prev.filter(i => i !== item)
        : [...prev, item]
    );
  };

  const generatePlan = async () => {
    setLoading(true);
    try {
      const allSelectedGroceries = [
        ...selectedGroceries,
        otherGrocery
      ].filter(Boolean);

      const prompt = `
        Create a ${duration.toLowerCase()} personalized health plan for ${goal}.
        Include a structured meal plan for each day (with clear sections for breakfast, lunch, dinner, and snacks), workouts, mental wellness activities, and hydration tips.
        Consider dietary/lifestyle preferences: ${preferences}.
        Available groceries: ${allSelectedGroceries.join(", ")}.
        Output in clearly labeled daily sections (Day 1, Day 2...) and use clear meal plan subheadings.
        If possible, format the meal plan as:
        Day X:
        - Breakfast: ...
        - Lunch: ...
        - Dinner: ...
        - Snacks: ...
      `;

      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      setPlan(response.text());
    } catch (error) {
      console.error('Error generating plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderPlan = () => {
    if (!plan) return null;
    const days = plan.split(/Day \d+:?/).filter(Boolean);
    if (days.length === 0) {
      return <div className="text-red-600 font-semibold">No meal plan found. Please try again or adjust your preferences.</div>;
    }
    return days.map((day, index) => (
      <div key={index} className="mb-4">
        <button
          className={`w-full text-left p-4 rounded-lg ${
            expandedDay === `day-${index}` ? 'bg-indigo-50' : 'bg-gray-50'
          } hover:bg-indigo-50 transition-colors`}
          onClick={() => setExpandedDay(expandedDay === `day-${index}` ? null : `day-${index}`)}
        >
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Day {index + 1}</h3>
            <span>{expandedDay === `day-${index}` ? '−' : '+'}</span>
          </div>
        </button>
        {expandedDay === `day-${index}` && (
          <div className="mt-2 p-4 bg-white rounded-lg shadow-sm">
            {day.split('\n').map((line, i) => (
              <p key={i} className="mb-2">{line.trim()}</p>
            ))}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🩺 Personalized Health Planner</h1>
        <p className="text-gray-600">Create your customized health plan with AI assistance</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="flex items-center gap-2 text-lg font-medium text-gray-700 mb-2">
            <Target className="w-5 h-5" />
            Select Your Health Goal
          </label>
          <select
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            {["Weight Loss", "Muscle Gain", "Stress Reduction", "Better Sleep"].map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="flex items-center gap-2 text-lg font-medium text-gray-700 mb-2">
            <Clock className="w-5 h-5" />
            Plan Duration
          </label>
          <div className="space-x-4">
            {["1 Day", "1 Week"].map((d) => (
              <label key={d} className="inline-flex items-center">
                <input
                  type="radio"
                  value={d}
                  checked={duration === d}
                  onChange={(e) => setDuration(e.target.value)}
                  className="form-radio text-indigo-600"
                />
                <span className="ml-2">{d}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-lg font-medium text-gray-700 mb-2">
            🍽️ Dietary or Lifestyle Preferences
          </label>
          <input
            type="text"
            value={preferences}
            onChange={(e) => setPreferences(e.target.value)}
            placeholder="e.g. vegan, gluten-free"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">🛒 Select Grocery Items</h3>
          <div className="space-y-4">
            {Object.entries(categories).map(([category, items]) => {
              const Icon = categoryIcons[category as keyof typeof categoryIcons];
              const isExpanded = expandedCategory === category;
              return (
                <div key={category} className="border rounded-lg overflow-hidden">
                  <button
                    className={`w-full p-4 text-left flex items-center justify-between ${
                      isExpanded ? 'bg-indigo-50' : 'bg-gray-50'
                    } hover:bg-indigo-50 transition-colors`}
                    onClick={() => setExpandedCategory(isExpanded ? null : category)}
                  >
                    <div className="flex items-center gap-2">
                      {Icon && <Icon className="w-5 h-5" />}
                      <span className="font-medium">{category}</span>
                      <span className="text-sm text-gray-500">
                        ({items.filter(item => selectedGroceries.includes(item)).length} selected)
                      </span>
                    </div>
                    <span>{isExpanded ? '−' : '+'}</span>
                  </button>
                  {isExpanded && (
                    <div className="p-4 grid grid-cols-2 gap-3 bg-white">
                      {items.map((item) => (
                        <label key={item} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={selectedGroceries.includes(item)}
                            onChange={() => toggleGroceryItem(item)}
                            className="form-checkbox text-indigo-600 rounded"
                          />
                          <span>{item}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4">
            <input
              type="text"
              value={otherGrocery}
              onChange={(e) => setOtherGrocery(e.target.value)}
              placeholder="Other items not listed?"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={generatePlan}
            disabled={loading}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Generating Plan...
              </>
            ) : (
              <>
                🧠 Generate My Health Plan
              </>
            )}
          </button>
        </div>

        {plan && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">📋 Your Personalized Plan</h2>
            {renderPlan()}
          </div>
        )}
      </div>
    </div>
  );
};

export default HealthPlanner;