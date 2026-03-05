import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Video, Plus, Search, User, Moon, Sun, Compass, MessageCircle, Sparkles, Users, Brain, LogIn } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../contexts/AuthContext';
import RealtimeNotifications from './RealtimeNotifications';

const Navigation: React.FC = () => {
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const { user } = useAuth();

  // Public nav items visible to everyone
  const publicNavItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/reels', icon: Video, label: 'Reels' },
    { path: '/communities', icon: Users, label: 'Communities' },
    { path: '/explore', icon: Compass, label: 'Explore' },
    { path: '/ai-chat', icon: Sparkles, label: 'AI Chat' },
  ];

  // Protected nav items only visible to logged-in users
  const protectedNavItems = [
    { path: '/create', icon: Plus, label: 'Create' },
    { path: '/ai-apps', icon: Brain, label: 'AI Apps' },
    { path: '/messages', icon: MessageCircle, label: 'Messages' },
  ];

  const desktopNavItems = user ? [...publicNavItems, ...protectedNavItems] : publicNavItems;

  const mobileNavItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/communities', icon: Users, label: 'Communities' },
    ...(user ? [{ path: '/create', icon: Plus, label: 'Create' }] : []),
    { path: '/explore', icon: Compass, label: 'Explore' },
    ...(user ? [{ path: '/ai-apps', icon: Brain, label: 'AI Apps' }] : []),
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 glass-panel border-b border-gray-200/50 dark:border-gray-700/50 h-16 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between w-full">
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform duration-300">
              <span className="text-white font-bold text-sm tracking-wider">AI</span>
            </div>
            <span className="text-xl font-bold font-outfit text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">PromptShare</span>
          </Link>

          <div className="flex items-center space-x-2">
            {desktopNavItems.map(({ path, icon: Icon, label }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 ${isActive(path)
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-900/30 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-gray-800/60'
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
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-800/60 transition-all duration-300 hover:rotate-12"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <Link
              to="/search"
              className={`p-2 rounded-lg transition-all duration-300 hover:scale-105 ${isActive('/search')
                ? 'text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-900/30'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-800/60'
                }`}
            >
              <Search size={20} />
            </Link>

            {user ? (
              <>
                {/* Real-time Notifications */}
                <RealtimeNotifications />

                {/* Profile */}
                <Link
                  to="/profile"
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 ${isActive('/profile')
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-900/30 shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-800/60'
                    }`}
                >
                  <User size={20} />
                  <span className="font-medium">Profile</span>
                </Link>
              </>
            ) : (
              <Link
                to="/auth/login"
                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium hover:opacity-95 hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5 transition-all duration-300"
              >
                <LogIn size={18} />
                <span>Login</span>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-panel border-t border-gray-200/50 dark:border-gray-700/50 h-16 pb-safe">
        <div className="flex items-center justify-around px-2 py-2 h-full">
          {mobileNavItems.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center space-y-1 px-2 py-2 rounded-lg transition-all duration-200 ${isActive(path)
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

      {/* Mobile Profile/Login Button - Floating */}
      <div className="md:hidden fixed top-4 right-4 z-50">
        {user ? (
          <Link
            to="/profile"
            className={`flex items-center justify-center w-12 h-12 rounded-full shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 ${isActive('/profile')
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-blue-500/30'
              : 'glass-panel text-gray-700 dark:text-gray-200 hover:bg-white/80 dark:hover:bg-gray-800/80 border border-gray-200/50 dark:border-gray-700/50'
              }`}
          >
            <User size={24} />
          </Link>
        ) : (
          <Link
            to="/auth/login"
            className="flex items-center justify-center w-12 h-12 rounded-full shadow-lg shadow-blue-500/30 bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:scale-105 transition-all duration-300"
          >
            <LogIn size={24} />
          </Link>
        )}
      </div>
    </>
  );
};

export default Navigation;