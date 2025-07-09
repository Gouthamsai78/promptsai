import React from 'react';
import { AIService } from '../services/ai';

const DebugEnv: React.FC = () => {
  const envVars = import.meta.env;
  
  const handleTestAI = async () => {
    console.log('🔍 Environment Variables:', envVars);
    console.log('🔍 VITE_OPENROUTER_API_KEY:', envVars.VITE_OPENROUTER_API_KEY);
    console.log('🔍 AI Available:', AIService.isAIAvailable());
    
    try {
      const result = await AIService.enhancePrompt('a cat');
      console.log('✅ AI Test Result:', result);
    } catch (error) {
      console.error('❌ AI Test Error:', error);
    }
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Environment Debug</h3>
      
      <div className="space-y-2 mb-4">
        <p><strong>VITE_OPENROUTER_API_KEY:</strong> {envVars.VITE_OPENROUTER_API_KEY ? 'Present' : 'Missing'}</p>
        <p><strong>Key Length:</strong> {envVars.VITE_OPENROUTER_API_KEY?.length || 0}</p>
        <p><strong>Key Prefix:</strong> {envVars.VITE_OPENROUTER_API_KEY?.substring(0, 15) || 'undefined'}</p>
        <p><strong>AI Available:</strong> {AIService.isAIAvailable() ? 'Yes' : 'No'}</p>
      </div>
      
      <button
        onClick={handleTestAI}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Test AI Service
      </button>
      
      <div className="mt-4">
        <h4 className="font-semibold">All VITE_ Environment Variables:</h4>
        <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-2 overflow-auto">
          {JSON.stringify(
            Object.fromEntries(
              Object.entries(envVars).filter(([key]) => key.startsWith('VITE_'))
            ),
            null,
            2
          )}
        </pre>
      </div>
    </div>
  );
};

export default DebugEnv;
