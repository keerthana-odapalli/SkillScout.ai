import React, { useState } from 'react';
import { SkillLevel, TimeCommitment, UserPreferences } from '../types';
import { Send, BookOpen, Clock, BarChart } from 'lucide-react';

interface InputFormProps {
  onSubmit: (prefs: UserPreferences) => void;
  isSubmitting: boolean;
}

const InputForm: React.FC<InputFormProps> = ({ onSubmit, isSubmitting }) => {
  const [goal, setGoal] = useState('');
  const [skillLevel, setSkillLevel] = useState<SkillLevel>(SkillLevel.Beginner);
  const [timeCommitment, setTimeCommitment] = useState<TimeCommitment>(TimeCommitment.Low);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (goal.trim()) {
      onSubmit({ goal, skillLevel, timeCommitment });
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 overflow-hidden ring-1 ring-white/60">
      <div className="p-8 bg-teal-400 backdrop-blur-md">
        <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
          <BookOpen className="w-8 h-8" />
          Design Your Path
        </h2>
        <p className="text-teal-50 font-medium">
          Tell our agents what you want to learn, and we'll build a personalized syllabus with curated resources.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        {/* Goal Input */}
        <div>
          <label htmlFor="goal" className="block text-sm font-bold text-slate-700 mb-2">
            What is your learning goal?
          </label>
          <textarea
            id="goal"
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-slate-300/60 bg-slate-800 text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all outline-none resize-none shadow-inner"
            placeholder="e.g., Learn React Native to build a mobile app, or Understand Quantum Physics basics..."
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            disabled={isSubmitting}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Skill Level */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              <BarChart className="w-4 h-4 text-cyan-500" />
              Current Skill Level
            </label>
            <div className="relative">
              <select
                value={skillLevel}
                onChange={(e) => setSkillLevel(e.target.value as SkillLevel)}
                disabled={isSubmitting}
                className="w-full appearance-none px-4 py-3 rounded-xl border border-slate-300/60 bg-white/50 focus:bg-white focus:ring-2 focus:ring-cyan-400 outline-none transition-all cursor-pointer backdrop-blur-sm"
              >
                {Object.values(SkillLevel).map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>

          {/* Time Commitment */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-500" />
              Time Commitment
            </label>
            <div className="relative">
              <select
                value={timeCommitment}
                onChange={(e) => setTimeCommitment(e.target.value as TimeCommitment)}
                disabled={isSubmitting}
                className="w-full appearance-none px-4 py-3 rounded-xl border border-slate-300/60 bg-white/50 focus:bg-white focus:ring-2 focus:ring-cyan-400 outline-none transition-all cursor-pointer backdrop-blur-sm"
              >
                {Object.values(TimeCommitment).map((time) => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting || !goal.trim()}
            className={`w-full py-4 px-6 rounded-xl text-white font-bold flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] ${
              isSubmitting || !goal.trim()
                ? 'bg-slate-400/50 cursor-not-allowed'
                : 'bg-teal-400 hover:bg-teal-500 shadow-lg shadow-teal-400/30'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                Initializing Agents...
              </>
            ) : (
              <>
                Start Learning Journey
                <Send className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InputForm;