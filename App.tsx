import React, { useState, useCallback } from 'react';
import { AgentStatus, Curriculum, UserPreferences, Topic } from './types';
import InputForm from './components/InputForm';
import AgentProgress from './components/AgentProgress';
import CurriculumView from './components/CurriculumView';
import { runPlannerAgent, runCuratorAgent } from './services/geminiService';
import { GraduationCap } from 'lucide-react';

const App: React.FC = () => {
  const [status, setStatus] = useState<AgentStatus>({ stage: 'idle', message: '', progress: 0 });
  const [curriculum, setCurriculum] = useState<Curriculum | null>(null);

  const startGeneration = useCallback(async (prefs: UserPreferences) => {
    try {
      // 1. Planner Agent Stage
      setStatus({ stage: 'planning', message: 'Planner Agent is designing the syllabus...', progress: 0 });
      
      const plan = await runPlannerAgent(prefs);
      setCurriculum(plan); // Save intermediate state (syllabus without resources)

      // 2. Curator Agent Stage (Sequential Processing)
      setStatus({ 
        stage: 'curating', 
        message: 'Curator Agent is finding resources...', 
        progress: 0 
      });

      // Flatten topics to iterate easily
      const allTopics: { topic: Topic, moduleIndex: number, topicIndex: number }[] = [];
      plan.modules.forEach((mod, mIdx) => {
        mod.topics.forEach((top, tIdx) => {
          allTopics.push({ topic: top, moduleIndex: mIdx, topicIndex: tIdx });
        });
      });

      const totalTopics = allTopics.length;
      const enrichedModules = [...plan.modules];

      // Sequential Loop to simulate agent workflow and avoid rate limits
      for (let i = 0; i < totalTopics; i++) {
        const { topic, moduleIndex, topicIndex } = allTopics[i];
        
        // Add throttling to respect rate limits (e.g. 15 RPM = ~1 request every 4 seconds)
        // This prevents the "429 RESOURCE_EXHAUSTED" error
        if (i > 0) {
           await new Promise(resolve => setTimeout(resolve, 6000));
        }

        setStatus({
          stage: 'curating',
          message: `Curating resources for Module ${moduleIndex + 1}...`,
          progress: Math.round((i / totalTopics) * 100),
          currentTask: topic.title
        });

        // Call Curator Service
        const context = `Course Goal: ${prefs.goal}. Module: ${enrichedModules[moduleIndex].title}`;
        const curatedContent = await runCuratorAgent(topic.title, context);

        // Update In-Memory State securely
        enrichedModules[moduleIndex].topics[topicIndex] = {
          ...topic,
          curatedContent
        };
        
        // Update UI incrementally so user sees progress
        setCurriculum({ ...plan, modules: [...enrichedModules] });
      }

      // 3. Complete
      setStatus({ stage: 'complete', message: 'Curriculum ready!', progress: 100 });

    } catch (error) {
      console.error(error);
      setStatus({ 
        stage: 'error', 
        message: 'An error occurred while generating the curriculum. Please check your API key or try again.', 
        progress: 0 
      });
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-transparent">
      {/* Header - Glassmorphism */}
      <header className="bg-white/70 backdrop-blur-md border-b border-white/40 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-teal-400 p-2 rounded-lg shadow-sm text-white">
              <GraduationCap className="w-6 h-6" />
            </div>
            <span className="font-bold text-xl text-slate-800 tracking-tight">SkillScout.ai</span>
          </div>
          <div className="text-sm text-slate-600 font-medium hidden sm:block">
            Powered by Gemini Multi-Agent System
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        
        {/* State: Idle or Error -> Show Form */}
        {(status.stage === 'idle' || status.stage === 'error') && !curriculum && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="text-center mb-10 max-w-2xl">
              <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-6 leading-tight drop-shadow-sm">
                Master any skill with <span className="text-teal-500">Personalized Learning</span>
              </h1>
              <p className="text-lg text-slate-700 font-medium">
                A personalized curriculum planner that scours the web for the best resources, tailored just for you.
              </p>
            </div>
            <InputForm 
              onSubmit={startGeneration} 
              isSubmitting={false} 
            />
            {status.stage === 'error' && (
               <div className="mt-6 p-4 bg-red-50/90 backdrop-blur-sm text-red-700 border border-red-200 rounded-xl max-w-2xl w-full shadow-sm">
                 {status.message}
               </div>
            )}
          </div>
        )}

        {/* State: Planning or Curating -> Show Progress */}
        {(status.stage === 'planning' || status.stage === 'curating') && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
             <AgentProgress status={status} />
          </div>
        )}

        {/* State: Complete */}
        {status.stage === 'complete' && curriculum && (
          <div className="animate-fade-in-up">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 drop-shadow-sm">Your Personal Curriculum</h2>
              <button 
                onClick={() => {
                  setStatus({ stage: 'idle', message: '', progress: 0 });
                  setCurriculum(null);
                }}
                className="bg-white/50 hover:bg-white/80 backdrop-blur-sm text-teal-600 hover:text-teal-800 px-4 py-2 rounded-lg font-medium text-sm transition-all border border-white/40 shadow-sm"
              >
                Create New +
              </button>
            </div>
            <CurriculumView curriculum={curriculum} />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;