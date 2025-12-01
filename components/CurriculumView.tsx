import React, { useState } from 'react';
import { Curriculum, Topic, Module } from '../types';
import { ChevronDown, ChevronRight, ExternalLink, PlayCircle, Book, Layout, Globe, Youtube, FileText, CheckCircle2, Circle, Trophy, BarChart3 } from 'lucide-react';

interface CurriculumViewProps {
  curriculum: Curriculum;
}

const CurriculumView: React.FC<CurriculumViewProps> = ({ curriculum }) => {
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set([0]));
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(
    curriculum.modules[0]?.topics[0]?.id || null
  );
  // Track completed resources by their URI
  const [completedResources, setCompletedResources] = useState<Set<string>>(new Set());
  // Track images that failed to load
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const toggleModule = (index: number) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedModules(newExpanded);
  };

  const toggleResource = (uri: string) => {
    const newCompleted = new Set(completedResources);
    if (newCompleted.has(uri)) {
      newCompleted.delete(uri);
    } else {
      newCompleted.add(uri);
    }
    setCompletedResources(newCompleted);
  };

  const handleImageError = (uri: string) => {
    setFailedImages(prev => {
      const newSet = new Set(prev);
      newSet.add(uri);
      return newSet;
    });
  };

  // Helper to find the currently selected topic object
  const getSelectedTopic = (): Topic | undefined => {
    for (const mod of curriculum.modules) {
      const topic = mod.topics.find(t => t.id === selectedTopicId);
      if (topic) return topic;
    }
    return undefined;
  };

  const activeTopic = getSelectedTopic();

  // Helper to determine if a resource is likely a video
  const isVideoResource = (uri: string, thumbnail?: string) => {
    return !!thumbnail || uri.includes('youtube.com') || uri.includes('youtu.be') || uri.includes('vimeo.com') || uri.includes('shorts/');
  };

  // Calculate progress for current topic
  const getTopicProgress = () => {
    if (!activeTopic?.curatedContent?.resources) return { current: 0, total: 0 };
    const resources = activeTopic.curatedContent.resources;
    const completed = resources.filter(r => completedResources.has(r.uri)).length;
    return { current: completed, total: resources.length };
  };

  // Calculate overall course progress
  const getTotalProgress = () => {
    const totalResources = curriculum.modules.reduce((acc, mod) => {
      return acc + mod.topics.reduce((tAcc, topic) => {
        return tAcc + (topic.curatedContent?.resources?.length || 0);
      }, 0);
    }, 0);

    const completedCount = completedResources.size;
    const percentage = totalResources > 0 ? Math.round((completedCount / totalResources) * 100) : 0;

    return { total: totalResources, completed: completedCount, percentage };
  };

  const topicProgress = getTopicProgress();
  const overallProgress = getTotalProgress();

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      
      {/* Overall Progress Dashboard */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/60 p-6 flex flex-col sm:flex-row items-center gap-6">
        <div className="p-4 bg-teal-50 rounded-full text-teal-500 shadow-sm">
          {overallProgress.percentage === 100 ? (
            <Trophy className="w-8 h-8" />
          ) : (
            <BarChart3 className="w-8 h-8" />
          )}
        </div>
        <div className="flex-1 w-full">
          <div className="flex justify-between items-end mb-2">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Course Progress</h2>
              <p className="text-sm text-slate-500 font-medium">
                {overallProgress.completed} of {overallProgress.total} resources completed
              </p>
            </div>
            <span className="text-2xl font-bold text-teal-500">{overallProgress.percentage}%</span>
          </div>
          <div className="w-full bg-slate-200/60 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-teal-400 h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(45,212,191,0.4)]"
              style={{ width: `${overallProgress.percentage}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 h-[800px] min-h-[600px]">
        {/* Sidebar: Syllabus Navigation */}
        <div className="w-full lg:w-1/3 bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/60 flex flex-col overflow-hidden h-full">
          <div className="p-6 bg-slate-50/30 border-b border-slate-200/60">
            <h2 className="text-xl font-bold text-slate-800">{curriculum.title}</h2>
            <p className="text-sm text-slate-600 mt-2 line-clamp-3">{curriculum.description}</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {curriculum.modules.map((module, mIdx) => (
              <div key={mIdx} className="border border-slate-200/60 rounded-lg overflow-hidden bg-white/40">
                <button 
                  onClick={() => toggleModule(mIdx)}
                  className="w-full flex items-center justify-between p-3 hover:bg-white/60 transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 flex items-center justify-center bg-cyan-100 text-cyan-700 rounded text-xs font-bold">
                      {mIdx + 1}
                    </span>
                    <span className="font-semibold text-slate-700 text-sm">{module.title}</span>
                  </div>
                  {expandedModules.has(mIdx) ? 
                    <ChevronDown className="w-4 h-4 text-slate-400" /> : 
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  }
                </button>
                
                {expandedModules.has(mIdx) && (
                  <div className="bg-white/30">
                    {module.topics.map((topic) => (
                      <button
                        key={topic.id}
                        onClick={() => setSelectedTopicId(topic.id)}
                        className={`w-full text-left p-3 pl-11 text-sm border-l-4 transition-all ${
                          selectedTopicId === topic.id
                            ? 'border-teal-400 bg-teal-50/50 text-teal-700 font-semibold'
                            : 'border-transparent text-slate-600 hover:bg-slate-50/50'
                        }`}
                      >
                        {topic.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content: Topic Details & Resources */}
        <div className="w-full lg:w-2/3 bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/60 overflow-hidden flex flex-col h-full">
          {activeTopic ? (
            <>
              <div className="p-8 border-b border-slate-200/60 bg-slate-50/20">
                <div className="flex items-center gap-2 text-cyan-600 text-xs font-bold tracking-wider uppercase mb-3">
                  <Layout className="w-4 h-4" /> Selected Topic
                </div>
                <h1 className="text-3xl font-bold text-slate-900 mb-4">{activeTopic.title}</h1>
                <p className="text-slate-700 leading-relaxed font-medium">{activeTopic.description}</p>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                
                {/* Actionable Step Card */}
                <div className="bg-cyan-50/40 border border-cyan-100 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-cyan-800 mb-2 flex items-center gap-2">
                    <PlayCircle className="w-5 h-5" />
                    Actionable Step
                  </h3>
                  <p className="text-cyan-900/80">{activeTopic.actionableStep}</p>
                </div>

                {/* Resources Section (Curated by Agent 2) */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <Book className="w-5 h-5 text-amber-400" />
                      Curated Resources
                    </h3>
                    {topicProgress.total > 0 && (
                      <span className="text-xs font-semibold px-2 py-1 bg-slate-100/80 text-slate-600 rounded-full border border-slate-200">
                        {topicProgress.current}/{topicProgress.total} Completed
                      </span>
                    )}
                  </div>
                  
                  {activeTopic.curatedContent ? (
                    <div className="space-y-4">
                      <div className="grid gap-4">
                        {activeTopic.curatedContent.resources.length > 0 ? (
                          activeTopic.curatedContent.resources.map((res, idx) => {
                            const isVideo = isVideoResource(res.uri, res.thumbnail);
                            const isCompleted = completedResources.has(res.uri);
                            const hasFailedImage = failedImages.has(res.uri);
                            
                            return (
                              <div key={idx} className="flex items-stretch gap-3">
                                {/* Checkbox Column */}
                                <button 
                                  onClick={() => toggleResource(res.uri)}
                                  className={`flex items-center justify-center w-10 shrink-0 rounded-xl border transition-all ${
                                    isCompleted 
                                      ? 'bg-emerald-50 border-emerald-200 text-emerald-500' 
                                      : 'bg-white border-slate-200 text-slate-300 hover:text-cyan-400 hover:border-cyan-300'
                                  }`}
                                  aria-label={isCompleted ? "Mark as incomplete" : "Mark as complete"}
                                >
                                  {isCompleted ? (
                                    <CheckCircle2 className="w-6 h-6" />
                                  ) : (
                                    <Circle className="w-6 h-6" />
                                  )}
                                </button>

                                {/* Resource Card */}
                                <div 
                                  className={`group flex-1 flex flex-col sm:flex-row gap-4 p-4 rounded-xl border transition-all bg-white overflow-hidden ${
                                    isCompleted 
                                      ? 'border-slate-100 opacity-60 hover:opacity-100' 
                                      : 'border-slate-200 hover:border-cyan-300 hover:shadow-md'
                                  }`}
                                >
                                  {/* Thumbnail or Icon */}
                                  <div className="flex-shrink-0">
                                    {res.thumbnail && !hasFailedImage ? (
                                      <a href={res.uri} target="_blank" rel="noopener noreferrer" className="block relative w-full sm:w-40 h-24 rounded-lg overflow-hidden bg-slate-100 shadow-sm border border-slate-100 group-hover:opacity-90 transition-opacity">
                                        <img 
                                          src={res.thumbnail} 
                                          alt={res.title} 
                                          className="w-full h-full object-cover"
                                          onError={() => handleImageError(res.uri)}
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/0 transition-colors">
                                           <PlayCircle className="w-8 h-8 text-white opacity-90 drop-shadow-md" />
                                        </div>
                                      </a>
                                    ) : (
                                      <a href={res.uri} target="_blank" rel="noopener noreferrer" className="block w-full sm:w-40 h-24 rounded-lg bg-slate-50 group-hover:bg-cyan-50 flex items-center justify-center transition-colors border border-slate-100">
                                        {isVideo ? (
                                          <Youtube className="w-8 h-8 text-red-400 group-hover:text-red-500" />
                                        ) : (
                                          <FileText className="w-8 h-8 text-slate-300 group-hover:text-cyan-400" />
                                        )}
                                      </a>
                                    )}
                                  </div>

                                  {/* Content */}
                                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                                    <div>
                                      <div className="flex items-start justify-between gap-2 mb-1">
                                        <a href={res.uri} target="_blank" rel="noopener noreferrer" className={`font-semibold transition-colors line-clamp-1 leading-tight hover:underline ${isCompleted ? 'text-slate-500' : 'text-slate-800 group-hover:text-cyan-600'}`}>
                                          {res.title}
                                        </a>
                                        <a href={res.uri} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-cyan-500 flex-shrink-0">
                                          <ExternalLink className="w-4 h-4" />
                                        </a>
                                      </div>
                                      
                                      {res.description && (
                                        <p className="text-sm text-slate-600 line-clamp-2 mb-2">
                                          {res.description}
                                        </p>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-3 mt-auto">
                                      {isVideo ? (
                                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                                          <Youtube className="w-3 h-3" /> Video
                                        </span>
                                      ) : (
                                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">
                                          <FileText className="w-3 h-3" /> Article
                                        </span>
                                      )}
                                      {res.source && (
                                        <span className="text-xs text-slate-400 truncate max-w-[150px]">
                                          {res.source}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                           <div className="p-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-300">
                             <Globe className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                             <p className="text-slate-500 text-sm">No specific links found for this topic. Try searching manually.</p>
                           </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-32 text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-300">
                      <div className="animate-pulse flex flex-col items-center">
                        <div className="h-2 w-24 bg-slate-200 rounded mb-2"></div>
                        <p className="text-xs">Loading resources...</p>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
              <Layout className="w-16 h-16 mb-4 opacity-20" />
              <p>Select a topic from the sidebar to view details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CurriculumView;