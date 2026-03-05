import React, { useState } from 'react';
import {
  Sparkles,
  Camera,
  MessageCircle,
  Wand2,
  Image as ImageIcon,
  Brain,
  Zap,
  ArrowRight,
  Star,
  Lightbulb
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import AIPromptEnhancer from '../components/AIPromptEnhancer';
import AIChatInterface from '../components/AIChatInterface';
import TestImageAnalysis from '../components/TestImageAnalysis';
import { AIService } from '../services/ai';

interface AIApp {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  category: 'enhancement' | 'analysis' | 'generation' | 'studio';
  featured?: boolean;
  component?: React.ComponentType<any>;
  route?: string;
  comingSoon?: boolean;
}

const AIApps: React.FC = () => {
  const navigate = useNavigate();
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [testPrompt, setTestPrompt] = useState('');

  const aiApps: AIApp[] = [
    {
      id: 'smart-studio',
      title: 'Smart Prompt Studio',
      description: 'Advanced prompt engineering workspace with voice input, analysis, and professional templates',
      icon: Sparkles,
      category: 'studio',
      featured: true,
      route: '/smart-studio'
    },
    {
      id: 'ai-chat',
      title: 'AI Chat Assistant',
      description: 'Interactive AI assistant for prompt creation, enhancement, and general AI guidance',
      icon: MessageCircle,
      category: 'generation',
      featured: true,
      route: '/chat'
    },
    {
      id: 'prompt-enhancer',
      title: 'Prompt Enhancer',
      description: 'Transform basic prompts into professional, detailed versions with multiple style variants',
      icon: Wand2,
      category: 'enhancement',
      featured: true,
      component: AIPromptEnhancer
    },
    {
      id: 'image-analyzer',
      title: 'Image to Prompt',
      description: 'Upload images and generate detailed prompts to recreate similar content',
      icon: Camera,
      category: 'analysis',
      featured: true,
      component: TestImageAnalysis
    },
    {
      id: 'style-generator',
      title: 'Style Generator',
      description: 'Generate prompts in specific artistic styles: photographic, cinematic, digital art, and more',
      icon: Lightbulb,
      category: 'generation',
      comingSoon: true
    },
    {
      id: 'prompt-optimizer',
      title: 'Prompt Optimizer',
      description: 'Analyze and optimize prompts for better AI model performance and results',
      icon: Zap,
      category: 'enhancement',
      comingSoon: true
    },
    {
      id: 'batch-processor',
      title: 'Batch Processor',
      description: 'Process multiple prompts or images at once for efficient workflow',
      icon: Brain,
      category: 'studio',
      comingSoon: true
    }
  ];

  const categories = [
    { id: 'all', label: 'All Apps', count: aiApps.length },
    { id: 'enhancement', label: 'Enhancement', count: aiApps.filter(app => app.category === 'enhancement').length },
    { id: 'analysis', label: 'Analysis', count: aiApps.filter(app => app.category === 'analysis').length },
    { id: 'generation', label: 'Generation', count: aiApps.filter(app => app.category === 'generation').length },
    { id: 'studio', label: 'Studio', count: aiApps.filter(app => app.category === 'studio').length }
  ];

  const filteredApps = selectedCategory === 'all'
    ? aiApps
    : aiApps.filter(app => app.category === selectedCategory);

  const featuredApps = aiApps.filter(app => app.featured && !app.comingSoon);

  const handleAppClick = (app: AIApp) => {
    if (app.comingSoon) return;

    if (app.route) {
      navigate(app.route);
    } else if (app.component) {
      setSelectedApp(app.id);
    }
  };

  const handleCloseApp = () => {
    setSelectedApp(null);
  };

  const renderAppComponent = (app: AIApp) => {
    if (!app.component) return null;

    const Component = app.component;

    switch (app.id) {
      case 'prompt-enhancer':
        return (
          <AIPromptEnhancer
            prompt={testPrompt}
            onPromptChange={setTestPrompt}
            onEnhancementSelect={(enhancement) => {
              console.log('Enhancement selected:', enhancement);
            }}
          />
        );
      case 'image-analyzer':
        return <TestImageAnalysis />;
      default:
        return <Component />;
    }
  };

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex flex-col items-center justify-center space-y-4 mb-6">
            <div className="p-4 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-2xl shadow-xl shadow-blue-500/20 animate-pulse-slow">
              <Brain className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-extrabold font-outfit tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-200 dark:to-white">
              AI Intelligent Apps
            </h1>
          </div>
          <p className="text-xl font-medium text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Unleash the power of professional prompt engineering with our curated suite of AI-driven creative tools.
          </p>
        </div>

        {/* AI Service Status */}
        <div className="mb-12 flex justify-center">
          <div className={`inline-flex items-center space-x-3 px-5 py-2.5 rounded-2xl glass-panel border shadow-sm ${AIService.isAIAvailable()
              ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20'
              : 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20'
            }`}>
            <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${AIService.isAIAvailable() ? 'bg-green-500' : 'bg-yellow-500'
              }`} />
            <span className="text-sm font-bold uppercase tracking-widest">
              {AIService.isAIAvailable() ? 'AI Infrastructure Online' : 'Simulation Mode Active'}
            </span>
          </div>
        </div>

        {/* Featured Apps */}
        {featuredApps.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center space-x-3 mb-8 px-2">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Star className="h-6 w-6 text-yellow-500" />
              </div>
              <h2 className="text-2xl font-black font-outfit text-gray-900 dark:text-white uppercase tracking-tight">Premium Workspace Tools</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredApps.map((app) => (
                <div
                  key={app.id}
                  onClick={() => handleAppClick(app)}
                  className="group relative glass-card bg-white/40 dark:bg-gray-800/40 rounded-3xl p-8 border border-gray-200/50 dark:border-gray-700/50 hover:bg-white/60 dark:hover:bg-gray-800/60 transition-all duration-500 cursor-pointer shadow-xl hover:shadow-2xl hover:scale-[1.03] active:scale-95 overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                  <div className="relative flex flex-col items-start">
                    <div className="p-4 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-blue-500/20 group-hover:rotate-6 transition-transform duration-500 mb-6">
                      <app.icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-black font-outfit text-gray-900 dark:text-white mb-3 tracking-tight">
                      {app.title}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-base font-medium mb-6 leading-relaxed">
                      {app.description}
                    </p>
                    <div className="flex items-center text-blue-500 dark:text-blue-400 text-sm font-black uppercase tracking-widest mt-auto">
                      <span>Launch App</span>
                      <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-2 transition-transform duration-300" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category Filter */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
          <h3 className="text-xl font-black font-outfit text-gray-900 dark:text-white uppercase tracking-tight">Explorer Tools</h3>
          <div className="flex flex-wrap gap-2 glass-panel bg-gray-100/50 dark:bg-gray-800/50 p-1.5 rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${selectedCategory === category.id
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-lg scale-105'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
                  }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* All Apps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredApps.map((app) => (
            <div
              key={app.id}
              onClick={() => handleAppClick(app)}
              className={`glass-panel p-7 rounded-3xl border transition-all duration-300 flex flex-col h-full ${app.comingSoon
                  ? 'opacity-50 grayscale bg-gray-100/30 dark:bg-gray-800/30 border-gray-200/30 dark:border-gray-700/30 cursor-not-allowed'
                  : 'bg-white/40 dark:bg-gray-800/40 border-gray-200/50 dark:border-gray-700/50 hover:bg-white/80 dark:hover:bg-gray-800/80 hover:shadow-2xl hover:scale-[1.02] cursor-pointer'
                }`}
            >
              <div className="flex items-start justify-between mb-6">
                <div className={`p-3.5 rounded-2xl shadow-sm ${app.comingSoon
                    ? 'bg-gray-100 dark:bg-gray-700'
                    : 'bg-gradient-to-br from-blue-500/10 to-purple-600/10'
                  }`}>
                  <app.icon className={`h-7 w-7 ${app.comingSoon ? 'text-gray-400' : 'text-blue-500 dark:text-blue-400'
                    }`} />
                </div>
                {app.featured && !app.comingSoon && (
                  <div className="bg-yellow-500/10 p-1.5 rounded-lg">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  </div>
                )}
                {app.comingSoon && (
                  <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-gray-200/50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 rounded-lg">
                    Pipeline
                  </span>
                )}
              </div>

              <h3 className="text-xl font-black font-outfit text-gray-900 dark:text-white mb-2 tracking-tight">
                {app.title}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-6 leading-relaxed flex-1">
                {app.description}
              </p>

              <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-200/30 dark:border-gray-700/30">
                <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">
                  {app.category}
                </span>
                {!app.comingSoon && (
                  <div className="flex items-center text-blue-500 text-xs font-black uppercase tracking-widest">
                    <span>Open</span>
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* App Modal */}
        {selectedApp && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {aiApps.find(app => app.id === selectedApp)?.title}
                </h2>
                <button
                  onClick={handleCloseApp}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  ×
                </button>
              </div>
              <div className="p-6">
                {renderAppComponent(aiApps.find(app => app.id === selectedApp)!)}
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default AIApps;
