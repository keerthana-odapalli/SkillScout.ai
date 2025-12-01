import React from 'react';
import { AgentStatus } from '../types';
import { Bot, Search, BrainCircuit, CheckCircle2, Loader2 } from 'lucide-react';

interface AgentProgressProps {
  status: AgentStatus;
}

const AgentProgress: React.FC<AgentProgressProps> = ({ status }) => {
  if (status.stage === 'idle') return null;

  const isPlanning = status.stage === 'planning';
  const isCurating = status.stage === 'curating';
  const isComplete = status.stage === 'complete';

  return (
    <div className="w-full max-w-2xl mx-auto my-8 space-y-6">
      <div className="bg-white/70 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-white/60 ring-1 ring-white/60">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Bot className="w-5 h-5 text-cyan-500" />
          Multi-Agent System Status
        </h3>
        
        <div className="relative">
          {/* Connecting Line */}
          <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-slate-200/60" />

          {/* Planner Step */}
          <div className="relative flex items-start gap-4 mb-8">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center z-10 transition-colors shadow-sm ${
              isPlanning ? 'bg-cyan-50 text-cyan-500 ring-4 ring-cyan-50/50' : 
              (isCurating || isComplete) ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-100 text-slate-400'
            }`}>
              {isPlanning ? <BrainCircuit className="w-6 h-6 animate-pulse" /> : 
               (isCurating || isComplete) ? <CheckCircle2 className="w-6 h-6" /> : <BrainCircuit className="w-6 h-6" />}
            </div>
            <div className="flex-1 pt-1">
              <h4 className={`font-bold ${isPlanning ? 'text-cyan-600' : 'text-slate-900'}`}>Planner Agent</h4>
              <p className="text-sm text-slate-600 font-medium">
                {isPlanning ? "Structuring your personal curriculum..." : 
                 (isCurating || isComplete) ? "Curriculum structure generated." : "Waiting to start..."}
              </p>
            </div>
          </div>

          {/* Curator Step */}
          <div className="relative flex items-start gap-4">
             <div className={`w-12 h-12 rounded-full flex items-center justify-center z-10 transition-colors shadow-sm ${
              isCurating ? 'bg-amber-50 text-amber-500 ring-4 ring-amber-50/50' : 
              isComplete ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-100 text-slate-400'
            }`}>
              {isCurating ? <Search className="w-6 h-6 animate-bounce" /> : 
               isComplete ? <CheckCircle2 className="w-6 h-6" /> : <Search className="w-6 h-6" />}
            </div>
            <div className="flex-1 pt-1 space-y-2">
              <div>
                <h4 className={`font-bold ${isCurating ? 'text-amber-600' : 'text-slate-900'}`}>Curator Agent</h4>
                <p className="text-sm text-slate-600 font-medium">
                  {isCurating ? "Searching reliable resources for each topic..." : 
                   isComplete ? "All resources vetted and collected." : "Waiting for planner..."}
                </p>
              </div>
              
              {/* Progress Bar for Curating */}
              {isCurating && (
                <div className="w-full bg-slate-200/60 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-amber-400 h-2 rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(251,191,36,0.4)]"
                    style={{ width: `${status.progress}%` }}
                  />
                </div>
              )}
              {isCurating && status.currentTask && (
                <p className="text-xs text-amber-600 font-bold font-mono flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Processing: {status.currentTask}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentProgress;