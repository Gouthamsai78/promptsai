import React, { useState } from 'react';
import { AIService } from '../services/ai';

const TestImageAnalysis: React.FC = () => {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('🧪 Testing image analysis with file:', file.name);
      const analysis = await AIService.analyzeImage(file);
      
      console.log('✅ Analysis completed:', analysis);
      console.log('🔍 Enhanced prompts:', analysis.enhancedPrompts);
      
      setResult(analysis);
    } catch (err: any) {
      console.error('❌ Analysis failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">🧪 Image Analysis Test</h2>
      
      <div className="mb-6">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      {loading && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-blue-800">🔄 Analyzing image with real AI...</div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-800">❌ Error: {error}</div>
        </div>
      )}

      {result && (
        <div className="space-y-6">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-green-800 font-semibold">✅ Analysis Completed!</div>
          </div>

          <div className="grid gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Description</h3>
              <p>{result.description}</p>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Detected Style</h3>
              <p>{result.detectedStyle}</p>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Suggested Tags</h3>
              <p>{result.suggestedTags?.join(', ')}</p>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Enhanced Prompts Debug</h3>
              <div className="space-y-2 text-sm">
                <div>Has enhancedPrompts: {!!result.enhancedPrompts ? 'Yes' : 'No'}</div>
                <div>Is Array: {Array.isArray(result.enhancedPrompts) ? 'Yes' : 'No'}</div>
                <div>Length: {result.enhancedPrompts?.length || 0}</div>
                <div>Type: {typeof result.enhancedPrompts}</div>
              </div>
            </div>

            {result.enhancedPrompts && Array.isArray(result.enhancedPrompts) && result.enhancedPrompts.length > 0 ? (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Enhanced Prompts ({result.enhancedPrompts.length})</h3>
                {result.enhancedPrompts.map((prompt: any, index: number) => (
                  <div key={prompt.id || index} className="p-4 border rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-blue-600">{prompt.style}</span>
                      <span className="text-sm text-gray-500">{prompt.id}</span>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">{prompt.description}</div>
                    <div className="text-sm bg-white p-3 rounded border font-mono">
                      {prompt.prompt}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="text-yellow-800">⚠️ No enhanced prompts found or invalid format</div>
                <div className="text-sm mt-2">
                  Raw enhancedPrompts value: {JSON.stringify(result.enhancedPrompts, null, 2)}
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border rounded-lg bg-gray-50">
            <h3 className="font-semibold mb-2">Raw Result (Debug)</h3>
            <pre className="text-xs overflow-auto max-h-96">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestImageAnalysis;
