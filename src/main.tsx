import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import SimpleApp from './SimpleApp.tsx';
import './index.css';
import './utils/demoTransformation';

// Initialize theme on app load
const initializeTheme = () => {
  const savedTheme = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

// Initialize theme immediately
initializeTheme();

console.log('🚀 PromptShare main.tsx loading...');
console.log('Environment variables check:', {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ? 'Present' : 'Missing',
  SUPABASE_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Present' : 'Missing',
  OPENROUTER_KEY: import.meta.env.VITE_OPENROUTER_API_KEY ? 'Present' : 'Missing'
});

// Check for any localStorage issues that might affect routing
console.log('LocalStorage check:', {
  mockAuthSession: localStorage.getItem('mock-auth-session') ? 'Present' : 'Missing',
  theme: localStorage.getItem('theme') || 'Not set'
});

// Use SimpleApp for testing, switch back to App when auth is fixed
const USE_SIMPLE_APP = false; // Set to true to bypass auth issues - RESTORED TO MAIN APP

console.log('Using app mode:', USE_SIMPLE_APP ? 'SimpleApp' : 'Full App');

try {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      {USE_SIMPLE_APP ? <SimpleApp /> : <App />}
    </StrictMode>
  );
  console.log('✅ React app rendered successfully');
} catch (error) {
  console.error('❌ Failed to render React app:', error);
}
