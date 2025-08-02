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
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              AI Apps
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Discover and explore our collection of AI-powered tools for prompt engineering, 
            image analysis, and content creation
          </p>
        </div>

        {/* AI Service Status */}
        <div className="mb-8">
          <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg ${
            AIService.isAIAvailable() 
              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              AIService.isAIAvailable() ? 'bg-green-500' : 'bg-yellow-500'
            }`} />
            <span className="text-sm font-medium">
              {AIService.isAIAvailable() ? 'AI Services Online' : 'Demo Mode - Limited Functionality'}
            </span>
          </div>
        </div>

        {/* Featured Apps */}
        {featuredApps.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center space-x-2 mb-6">
              <Star className="h-6 w-6 text-yellow-500" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Featured Apps</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredApps.map((app) => (
                <div
                  key={app.id}
                  onClick={() => handleAppClick(app)}
                  className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all cursor-pointer"
                >
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg group-hover:scale-110 transition-transform">
                      <app.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {app.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                        {app.description}
                      </p>
                      <div className="flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium">
                        <span>Try it now</span>
                        <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {category.label} ({category.count})
              </button>
            ))}
          </div>
        </div>

        {/* All Apps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredApps.map((app) => (
            <div
              key={app.id}
              onClick={() => handleAppClick(app)}
              className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-all ${
                app.comingSoon 
                  ? 'opacity-60 cursor-not-allowed' 
                  : 'hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${
                  app.comingSoon 
                    ? 'bg-gray-100 dark:bg-gray-700' 
                    : 'bg-gradient-to-br from-blue-500 to-purple-600'
                }`}>
                  <app.icon className={`h-6 w-6 ${
                    app.comingSoon ? 'text-gray-400' : 'text-white'
                  }`} />
                </div>
                {app.featured && !app.comingSoon && (
                  <Star className="h-5 w-5 text-yellow-500" />
                )}
                {app.comingSoon && (
                  <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                    Coming Soon
                  </span>
                )}
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {app.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                {app.description}
              </p>
              
              <div className="flex items-center justify-between">
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full capitalize">
                  {app.category}
                </span>
                {!app.comingSoon && (
                  <ArrowRight className="h-4 w-4 text-gray-400" />
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
