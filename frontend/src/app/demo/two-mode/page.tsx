'use client';

import React, { useState } from 'react';
import { TwoModeChatInterface } from '@/components/chat/TwoModeChatInterface';
import { TwoModeSelector, InteractionMode } from '@/components/chat/TwoModeSelector';
import { ActionModeInput, ActionInput } from '@/components/chat/ActionModeInput';
import { ConversationModeInput } from '@/components/chat/ConversationModeInput';
import { ActionConfirmation } from '@/components/chat/ActionConfirmation';

export default function TwoModeDemoPage() {
  const [currentMode, setCurrentMode] = useState<InteractionMode>('conversation');
  const [recentActions, setRecentActions] = useState<Array<ActionInput & { timestamp: string }>>([]);
  const [showDemo, setShowDemo] = useState(false);

  const handleActionSubmit = (action: ActionInput) => {
    const timestamp = new Date().toISOString();
    setRecentActions(prev => [...prev.slice(-2), { ...action, timestamp }]);
  };

  const handleConversationSubmit = (message: string) => {
    console.log('Conversation message:', message);
    // In a real app, this would send to the AI
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            🤖 Two-Mode AI Companion Demo
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Experience the future of AI companionship with our innovative two-mode system. 
            Choose between fast action logging and rich conversational AI support.
          </p>
        </div>

        {/* Demo Toggle */}
        <div className="text-center mb-8">
          <button
            onClick={() => setShowDemo(!showDemo)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            {showDemo ? 'Hide Demo' : 'Show Full Demo'}
          </button>
        </div>

        {/* Mode Selector Demo */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Mode Selection
          </h2>
          <TwoModeSelector
            currentMode={currentMode}
            onModeChange={setCurrentMode}
          />
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Current Mode: <span className="font-medium text-blue-600 dark:text-blue-400">{currentMode}</span>
            </p>
          </div>
        </div>

        {/* Mode-Specific Inputs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Action Mode */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <span className="mr-2">🔧</span>
              Action Mode
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Quick logging and tracking for workouts, meals, mood, and more.
            </p>
            <ActionModeInput
              onSubmit={handleActionSubmit}
            />
          </div>

          {/* Conversation Mode */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <span className="mr-2">💬</span>
              Conversation Mode
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Rich AI companionship with memory and context awareness.
            </p>
            <ConversationModeInput
              onSubmit={handleConversationSubmit}
            />
          </div>
        </div>

        {/* Recent Actions Display */}
        {recentActions.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Recent Actions
            </h3>
            <div className="space-y-3">
              {recentActions.map((action, index) => (
                <ActionConfirmation
                  key={`${action.type}-${action.timestamp}-${index}`}
                  action={action}
                  timestamp={action.timestamp}
                  onClose={() => setRecentActions(prev => prev.filter((_, i) => i !== index))}
                />
              ))}
            </div>
          </div>
        )}

        {/* Full Demo Interface */}
        {showDemo && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Full Two-Mode Interface
            </h2>
            <div className="h-96 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <TwoModeChatInterface
                conversationId="demo-conversation"
                userName="Demo User"
                assistantName="AI Companion"
              />
            </div>
          </div>
        )}

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Fast Action Logging
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Log workouts, meals, mood, and more with quick, structured inputs.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🧠</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Rich AI Companionship
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Deep conversations with context-aware AI that remembers everything.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔄</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Seamless Mode Switching
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Switch between modes instantly based on your current needs.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mt-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            How It Works
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                🔧 Action Mode
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-300">
                <li>Select Action mode above</li>
                <li>Choose the type of activity</li>
                <li>Fill in details and notes</li>
                <li>Get instant confirmation</li>
                <li>Data is saved to your profile</li>
              </ol>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                💬 Conversation Mode
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-300">
                <li>Select Conversation mode above</li>
                <li>Type your message naturally</li>
                <li>AI analyzes your context</li>
                <li>Get personalized responses</li>
                <li>Build meaningful relationships</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 mt-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Why Two-Mode System?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                🎯 Clear Intent
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                No more confusion about what you want. Choose your mode upfront and get exactly what you need.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                ⚡ Optimal Performance
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Action mode is lightning fast, conversation mode is rich and contextual. Best of both worlds.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                🧠 Better Memory
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Structured logging + rich conversations = comprehensive life tracking and AI understanding.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                🔄 Flexible Workflow
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Switch modes seamlessly throughout your day based on your current needs and mood.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
