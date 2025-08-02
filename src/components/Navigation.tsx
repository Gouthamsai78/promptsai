import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Video, Plus, Search, User, Moon, Sun, Compass, MessageCircle, Sparkles, Users, Brain } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import RealtimeNotifications from './RealtimeNotifications';

const Navigation: React.FC = () => {
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();

  const desktopNavItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/reels', icon: Video, label: 'Reels' },
    { path: '/create', icon: Plus, label: 'Create' },
    { path: '/communities', icon: Users, label: 'Communities' },
    { path: '/ai-apps', icon: Brain, label: 'AI Apps' },
    { path: '/messages', icon: MessageCircle, label: 'Messages' },
    { path: '/ai-chat', icon: Sparkles, label: 'AI Chat' },
    { path: '/explore', icon: Compass, label: 'Explore' }
  ];

  const mobileNavItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/communities', icon: Users, label: 'Communities' },
    { path: '/create', icon: Plus, label: 'Create' },
    { path: '/explore', icon: Compass, label: 'Explore' },
    { path: '/ai-apps', icon: Brain, label: 'AI Apps' }
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 h-16">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between w-full">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AI</span>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">PromptShare</span>
          </Link>

          <div className="flex items-center space-x-8">
            {desktopNavItems.map(({ path, icon: Icon, label }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  isActive(path)
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{label}</span>
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <Link
              to="/search"
              className={`p-2 rounded-lg transition-colors ${
                isActive('/search')
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Search size={20} />
            </Link>

            {/* Real-time Notifications */}
            <RealtimeNotifications />

            {/* Profile moved to top-right corner */}
            <Link
              to="/profile"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                isActive('/profile')
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <User size={20} />
              <span className="font-medium">Profile</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-t border-gray-200 dark:border-gray-700 h-16">
        <div className="flex items-center justify-around px-2 py-2 h-full">
          {mobileNavItems.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center space-y-1 px-2 py-2 rounded-lg transition-all duration-200 ${
                isActive(path)
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <Icon size={path === '/create' ? 28 : 22} strokeWidth={path === '/create' ? 2.5 : 2} />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile Profile Button - Floating */}
      <div className="md:hidden fixed top-4 right-4 z-50">
        <Link
          to="/profile"
          className={`flex items-center justify-center w-12 h-12 rounded-full shadow-lg transition-all duration-200 ${
            isActive('/profile')
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <User size={24} />
        </Link>
      </div>
    </>
  );
};

export default Navigation;