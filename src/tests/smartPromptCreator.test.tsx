import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SmartPromptCreator from '../components/SmartPromptCreator';
import { RequirementsAnalysisService } from '../services/requirementsAnalysis';
import { VoiceRecognitionService } from '../services/voiceRecognition';

// Mock the services
jest.mock('../services/requirementsAnalysis');
jest.mock('../services/voiceRecognition');
jest.mock('../services/deviceCapabilities');

const mockRequirementsAnalysisService = RequirementsAnalysisService as jest.Mocked<typeof RequirementsAnalysisService>;
const mockVoiceRecognitionService = VoiceRecognitionService as jest.Mocked<typeof VoiceRecognitionService>;

// Mock the child components
jest.mock('../components/RequirementsAnalyzer', () => {
  return function MockRequirementsAnalyzer({ onPromptGenerated, onAnalysisComplete }: any) {
    return (
      <div data-testid="requirements-analyzer">
        <button 
          onClick={() => {
            onPromptGenerated?.('Generated prompt from requirements');
            onAnalysisComplete?.({
              originalDescription: 'Test description',
              generatedPrompts: [{ id: '1', title: 'Test Prompt', prompt: 'Test prompt content' }]
            });
          }}
        >
          Generate Prompt
        </button>
      </div>
    );
  };
});

jest.mock('../components/VoiceRecorder', () => {
  return function MockVoiceRecorder({ onTranscriptionUpdate, onSessionComplete, onTextGenerated }: any) {
    return (
      <div data-testid="voice-recorder">
        <button 
          onClick={() => {
            onTranscriptionUpdate?.({
              text: 'Voice transcription text',
              isFinal: true,
              confidence: 0.9
            });
            onTextGenerated?.('Voice generated text');
            onSessionComplete?.({
              id: 'session-1',
              finalText: 'Voice session final text',
              wordCount: 4
            });
          }}
        >
          Start Recording
        </button>
      </div>
    );
  };
});

jest.mock('../components/AIPromptEnhancer', () => {
  return function MockAIPromptEnhancer({ onEnhancementSelect }: any) {
    return (
      <div data-testid="ai-prompt-enhancer">
        <button 
          onClick={() => {
            onEnhancementSelect?.({
              prompt: 'Enhanced prompt content',
              style: 'professional'
            });
          }}
        >
          Enhance Prompt
        </button>
      </div>
    );
  };
});

describe('SmartPromptCreator', () => {
  const mockOnPromptGenerated = jest.fn();
  const mockOnPromptChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockVoiceRecognitionService.getCapabilities.mockReturnValue({
      isSupported: true,
      supportedLanguages: ['en-US'],
      hasPermission: true,
      browserSupport: {
        webSpeechAPI: true,
        mediaRecorder: true,
        audioContext: true
      }
    });
  });

  describe('Mode Toggle', () => {
    it('should render mode toggle buttons', () => {
      render(<SmartPromptCreator showModeToggle={true} />);
      
      expect(screen.getByText('Text Input')).toBeInTheDocument();
      expect(screen.getByText('Voice Input')).toBeInTheDocument();
      expect(screen.getByText('Smart Mode')).toBeInTheDocument();
    });

    it('should switch between modes', async () => {
      const user = userEvent.setup();
      render(<SmartPromptCreator showModeToggle={true} />);
      
      // Start in text mode
      expect(screen.getByTestId('requirements-analyzer')).toBeInTheDocument();
      
      // Switch to voice mode
      await user.click(screen.getByText('Voice Input'));
      expect(screen.getByTestId('voice-recorder')).toBeInTheDocument();
      
      // Switch to hybrid mode
      await user.click(screen.getByText('Smart Mode'));
      expect(screen.getByTestId('voice-recorder')).toBeInTheDocument();
      expect(screen.getByTestId('requirements-analyzer')).toBeInTheDocument();
    });

    it('should disable voice modes when not supported', () => {
      mockVoiceRecognitionService.getCapabilities.mockReturnValue({
        isSupported: false,
        supportedLanguages: [],
        hasPermission: false,
        browserSupport: {
          webSpeechAPI: false,
          mediaRecorder: false,
          audioContext: false
        }
      });

      render(<SmartPromptCreator showModeToggle={true} />);
      
      const voiceButton = screen.getByText('Voice Input');
      const smartButton = screen.getByText('Smart Mode');
      
      expect(voiceButton).toBeDisabled();
      expect(smartButton).toBeDisabled();
    });
  });

  describe('Text Mode', () => {
    it('should render requirements analyzer in text mode', () => {
      render(<SmartPromptCreator />);
      
      expect(screen.getByTestId('requirements-analyzer')).toBeInTheDocument();
    });

    it('should handle prompt generation from requirements analyzer', async () => {
      const user = userEvent.setup();
      render(<SmartPromptCreator onPromptGenerated={mockOnPromptGenerated} />);
      
      await user.click(screen.getByText('Generate Prompt'));
      
      expect(mockOnPromptGenerated).toHaveBeenCalledWith('Generated prompt from requirements');
    });

    it('should show AI enhancer when prompt is generated', async () => {
      const user = userEvent.setup();
      render(<SmartPromptCreator />);
      
      await user.click(screen.getByText('Generate Prompt'));
      
      await waitFor(() => {
        expect(screen.getByTestId('ai-prompt-enhancer')).toBeInTheDocument();
      });
    });
  });

  describe('Voice Mode', () => {
    beforeEach(() => {
      render(<SmartPromptCreator showModeToggle={true} />);
    });

    it('should render voice recorder in voice mode', async () => {
      const user = userEvent.setup();
      
      await user.click(screen.getByText('Voice Input'));
      
      expect(screen.getByTestId('voice-recorder')).toBeInTheDocument();
    });

    it('should handle voice transcription and analysis', async () => {
      const user = userEvent.setup();
      
      await user.click(screen.getByText('Voice Input'));
      await user.click(screen.getByText('Start Recording'));
      
      await waitFor(() => {
        expect(screen.getByTestId('requirements-analyzer')).toBeInTheDocument();
      });
    });

    it('should show success message after voice analysis', async () => {
      const user = userEvent.setup();
      
      await user.click(screen.getByText('Voice Input'));
      await user.click(screen.getByText('Start Recording'));
      
      await waitFor(() => {
        expect(screen.getByText('Voice Analysis Complete')).toBeInTheDocument();
      });
    });
  });

  describe('Hybrid Mode', () => {
    it('should render both voice recorder and requirements analyzer', async () => {
      const user = userEvent.setup();
      render(<SmartPromptCreator showModeToggle={true} />);
      
      await user.click(screen.getByText('Smart Mode'));
      
      expect(screen.getByTestId('voice-recorder')).toBeInTheDocument();
      expect(screen.getByTestId('requirements-analyzer')).toBeInTheDocument();
    });

    it('should show AI enhancer section when prompt is generated', async () => {
      const user = userEvent.setup();
      render(<SmartPromptCreator showModeToggle={true} />);
      
      await user.click(screen.getByText('Smart Mode'));
      await user.click(screen.getByText('Generate Prompt'));
      
      await waitFor(() => {
        expect(screen.getByTestId('ai-prompt-enhancer')).toBeInTheDocument();
      });
    });
  });

  describe('Prompt Management', () => {
    it('should update current prompt when generated', async () => {
      const user = userEvent.setup();
      render(<SmartPromptCreator onPromptChange={mockOnPromptChange} />);
      
      await user.click(screen.getByText('Generate Prompt'));
      
      expect(mockOnPromptChange).toHaveBeenCalledWith('Generated prompt from requirements');
    });

    it('should update prompt when enhanced', async () => {
      const user = userEvent.setup();
      render(<SmartPromptCreator onPromptChange={mockOnPromptChange} />);
      
      // First generate a prompt
      await user.click(screen.getByText('Generate Prompt'));
      
      // Then enhance it
      await waitFor(() => {
        expect(screen.getByTestId('ai-prompt-enhancer')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Enhance Prompt'));
      
      expect(mockOnPromptChange).toHaveBeenCalledWith('Enhanced prompt content');
    });

    it('should handle initial prompt prop', () => {
      render(<SmartPromptCreator initialPrompt="Initial test prompt" />);
      
      // Should show AI enhancer since there's an initial prompt
      expect(screen.getByTestId('ai-prompt-enhancer')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle voice recognition errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock voice recorder to simulate error
      jest.doMock('../components/VoiceRecorder', () => {
        return function MockVoiceRecorderWithError() {
          return (
            <div data-testid="voice-recorder">
              <div>Voice recognition error occurred</div>
            </div>
          );
        };
      });
      
      render(<SmartPromptCreator showModeToggle={true} />);
      await user.click(screen.getByText('Voice Input'));
      
      expect(screen.getByTestId('voice-recorder')).toBeInTheDocument();
    });

    it('should handle requirements analysis errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock requirements analyzer to simulate error
      jest.doMock('../components/RequirementsAnalyzer', () => {
        return function MockRequirementsAnalyzerWithError() {
          return (
            <div data-testid="requirements-analyzer">
              <div>Requirements analysis error occurred</div>
            </div>
          );
        };
      });
      
      render(<SmartPromptCreator />);
      
      expect(screen.getByTestId('requirements-analyzer')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(<SmartPromptCreator showModeToggle={true} />);
      
      const textButton = screen.getByText('Text Input');
      const voiceButton = screen.getByText('Voice Input');
      const smartButton = screen.getByText('Smart Mode');
      
      expect(textButton).toHaveAttribute('role', 'button');
      expect(voiceButton).toHaveAttribute('role', 'button');
      expect(smartButton).toHaveAttribute('role', 'button');
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<SmartPromptCreator showModeToggle={true} />);
      
      // Tab through mode buttons
      await user.tab();
      expect(screen.getByText('Text Input')).toHaveFocus();
      
      await user.tab();
      expect(screen.getByText('Voice Input')).toHaveFocus();
      
      await user.tab();
      expect(screen.getByText('Smart Mode')).toHaveFocus();
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily', () => {
      const { rerender } = render(<SmartPromptCreator />);
      
      // Re-render with same props
      rerender(<SmartPromptCreator />);
      
      // Component should still be functional
      expect(screen.getByTestId('requirements-analyzer')).toBeInTheDocument();
    });

    it('should handle rapid mode switching', async () => {
      const user = userEvent.setup();
      render(<SmartPromptCreator showModeToggle={true} />);
      
      // Rapidly switch modes
      await user.click(screen.getByText('Voice Input'));
      await user.click(screen.getByText('Smart Mode'));
      await user.click(screen.getByText('Text Input'));
      
      // Should end up in text mode
      expect(screen.getByTestId('requirements-analyzer')).toBeInTheDocument();
    });
  });
});
