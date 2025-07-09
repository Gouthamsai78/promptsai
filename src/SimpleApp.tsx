import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

// Simple test components
const SimpleHome = () => (
  <div className="p-8">
    <h1 className="text-3xl font-bold mb-4">PromptShare - Simple Mode</h1>
    <p className="mb-4">This is a simplified version to test basic functionality.</p>
    <div className="space-y-2">
      <div>✅ React is working</div>
      <div>✅ Routing is working</div>
      <div>✅ Tailwind CSS is working</div>
    </div>
  </div>
);

const SimpleLogin = () => (
  <div className="p-8">
    <h1 className="text-3xl font-bold mb-4">Login Page</h1>
    <p>This would be the login page.</p>
    <Link to="/" className="text-blue-500 hover:underline">Go to Home</Link>
  </div>
);

const SimpleNav = () => (
  <nav className="bg-blue-600 text-white p-4">
    <div className="flex space-x-4">
      <Link to="/" className="hover:underline">Home</Link>
      <Link to="/login" className="hover:underline">Login</Link>
    </div>
  </nav>
);

// Simple App without authentication complexity
const SimpleApp: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <SimpleNav />
        <Routes>
          <Route path="/" element={<SimpleHome />} />
          <Route path="/login" element={<SimpleLogin />} />
        </Routes>
      </div>
    </Router>
  );
};

export default SimpleApp;
