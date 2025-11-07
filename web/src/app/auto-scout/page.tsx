'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Sparkles, History, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { GeneratedReport, GenerationProgress as ProgressType } from '@/types/auto-scout';

// Components
import { TemplateSelector } from '@/components/auto-scout/TemplateSelector';
import { GenerationForm } from '@/components/auto-scout/GenerationForm';
import { GenerationProgress } from '@/components/auto-scout/GenerationProgress';
import { GeneratedReportPreview } from '@/components/auto-scout/GeneratedReportPreview';
import { ReportHistoryList } from '@/components/auto-scout/ReportHistoryList';

type WizardStep = 'template' | 'configure' | 'generating' | 'preview';
type Tab = 'generate' | 'history';

export default function AutoScoutPage() {
  // Tab state
  const [activeTab, setActiveTab] = useState<Tab>('generate');

  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>('template');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [generatedReport, setGeneratedReport] = useState<GeneratedReport | null>(null);

  // Progress state
  const [progress, setProgress] = useState<ProgressType>({
    stage: 'idle',
    message: 'Initializing...',
    progress: 0,
  });

  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
  };

  // Handle next step
  const handleNext = () => {
    if (currentStep === 'template' && !selectedTemplate) {
      toast.error('Please select a template');
      return;
    }

    const steps: WizardStep[] = ['template', 'configure', 'generating', 'preview'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  // Handle previous step
  const handleBack = () => {
    const steps: WizardStep[] = ['template', 'configure', 'generating', 'preview'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  // Handle report generation
  const handleGenerate = async (data: {
    playerId: string;
    matchId?: string;
    reportType: string;
    customContext?: string;
    autoSave: boolean;
  }) => {
    try {
      // Move to generating step
      setCurrentStep('generating');

      // Simulate progress stages
      setProgress({
        stage: 'fetching_stats',
        message: 'Fetching player statistics...',
        progress: 10,
        estimatedTimeRemaining: 10,
      });

      // Wait 1 second
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setProgress({
        stage: 'generating',
        message: 'Generating report with GPT-4...',
        progress: 40,
        estimatedTimeRemaining: 8,
      });

      // Call API
      const response = await apiClient.generateAutoScoutReport(data);

      if (!response.success) {
        throw new Error(response.message || 'Failed to generate report');
      }

      // Update progress
      setProgress({
        stage: 'scoring',
        message: 'Calculating quality score...',
        progress: 80,
        estimatedTimeRemaining: 2,
      });

      // Wait for animation
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setProgress({
        stage: 'complete',
        message: 'Report generated successfully!',
        progress: 100,
        estimatedTimeRemaining: 0,
      });

      // Set generated report
      setGeneratedReport(response.data);

      // Move to preview step after short delay
      setTimeout(() => {
        setCurrentStep('preview');
      }, 1000);

      toast.success('Report generated successfully!');
    } catch (error: any) {
      console.error('Failed to generate report:', error);
      toast.error(error.message || 'Failed to generate report');

      setProgress({
        stage: 'error',
        message: 'Failed to generate report',
        progress: 0,
      });

      // Go back to configure step
      setTimeout(() => {
        setCurrentStep('configure');
      }, 2000);
    }
  };

  // Handle save report
  const handleSave = async () => {
    try {
      toast.success('Report saved successfully!');
      // Reset wizard
      setCurrentStep('template');
      setSelectedTemplate('');
      setGeneratedReport(null);
      // Switch to history tab
      setActiveTab('history');
    } catch (error) {
      console.error('Failed to save report:', error);
      toast.error('Failed to save report');
    }
  };

  // Handle regenerate
  const handleRegenerate = () => {
    setCurrentStep('configure');
    setGeneratedReport(null);
  };

  // Handle discard
  const handleDiscard = () => {
    if (confirm('Are you sure you want to discard this report?')) {
      setCurrentStep('template');
      setSelectedTemplate('');
      setGeneratedReport(null);
      toast.info('Report discarded');
    }
  };

  // Progress indicator steps
  const wizardSteps = [
    { id: 'template', label: 'Template', number: 1 },
    { id: 'configure', label: 'Configure', number: 2 },
    { id: 'generating', label: 'Generate', number: 3 },
    { id: 'preview', label: 'Review', number: 4 },
  ];

  const currentStepIndex = wizardSteps.findIndex((s) => s.id === currentStep);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8 text-[#E4FF3B]" />
            <h1 className="text-4xl font-bold text-white">
              AutoScout
            </h1>
            <span className="px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-400 text-sm font-semibold">
              GPT-4 Powered
            </span>
          </div>
          <p className="text-gray-400 text-lg">
            AI-powered scouting report generation with quality scoring
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => setActiveTab('generate')}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all
              ${activeTab === 'generate'
                ? 'bg-[#E4FF3B] text-black'
                : 'bg-white/10 text-white hover:bg-white/20'
              }
            `}
          >
            <FileText className="w-5 h-5" />
            Generate Report
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all
              ${activeTab === 'history'
                ? 'bg-[#E4FF3B] text-black'
                : 'bg-white/10 text-white hover:bg-white/20'
              }
            `}
          >
            <History className="w-5 h-5" />
            Report History
          </button>
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          {activeTab === 'generate' ? (
            <motion.div
              key="generate"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Progress indicator */}
              {currentStep !== 'generating' && (
                <div className="flex items-center justify-center gap-4">
                  {wizardSteps.map((step, index) => (
                    <div key={step.id} className="flex items-center gap-4">
                      {/* Step circle */}
                      <div
                        className={`
                          flex items-center gap-3 px-4 py-2 rounded-full transition-all
                          ${index <= currentStepIndex
                            ? 'bg-[#E4FF3B]/20 border-2 border-[#E4FF3B]'
                            : 'bg-white/5 border-2 border-white/20'
                          }
                        `}
                      >
                        <div
                          className={`
                            w-8 h-8 rounded-full flex items-center justify-center font-bold
                            ${index <= currentStepIndex
                              ? 'bg-[#E4FF3B] text-black'
                              : 'bg-white/10 text-gray-500'
                            }
                          `}
                        >
                          {step.number}
                        </div>
                        <span
                          className={`
                            font-semibold
                            ${index <= currentStepIndex
                              ? 'text-white'
                              : 'text-gray-500'
                            }
                          `}
                        >
                          {step.label}
                        </span>
                      </div>

                      {/* Arrow */}
                      {index < wizardSteps.length - 1 && (
                        <ArrowRight
                          className={`
                            w-5 h-5
                            ${index < currentStepIndex
                              ? 'text-[#E4FF3B]'
                              : 'text-gray-600'
                            }
                          `}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Step content */}
              <div className="rounded-2xl bg-black/40 backdrop-blur-sm border border-white/10 p-8">
                <AnimatePresence mode="wait">
                  {currentStep === 'template' && (
                    <motion.div
                      key="template"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <TemplateSelector
                        selected={selectedTemplate}
                        onSelect={handleTemplateSelect}
                      />
                    </motion.div>
                  )}

                  {currentStep === 'configure' && (
                    <motion.div
                      key="configure"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <GenerationForm
                        selectedTemplate={selectedTemplate}
                        onGenerate={handleGenerate}
                      />
                    </motion.div>
                  )}

                  {currentStep === 'generating' && (
                    <motion.div
                      key="generating"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <GenerationProgress progress={progress} />
                    </motion.div>
                  )}

                  {currentStep === 'preview' && generatedReport && (
                    <motion.div
                      key="preview"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <GeneratedReportPreview
                        report={generatedReport}
                        onSave={handleSave}
                        onRegenerate={handleRegenerate}
                        onDiscard={handleDiscard}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Navigation buttons */}
              {currentStep !== 'generating' && currentStep !== 'preview' && (
                <div className="flex justify-between">
                  <button
                    onClick={handleBack}
                    disabled={currentStep === 'template'}
                    className="px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Back
                  </button>

                  <button
                    onClick={handleNext}
                    disabled={currentStep === 'template' && !selectedTemplate}
                    className="px-6 py-3 rounded-xl bg-[#E4FF3B] text-black font-semibold hover:bg-[#d4ef2b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    Next
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="rounded-2xl bg-black/40 backdrop-blur-sm border border-white/10 p-8"
            >
              <ReportHistoryList />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
