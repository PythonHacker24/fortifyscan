import React, { useState } from 'react';
import { X, FileDiff, Lightbulb, History, CheckCircle, AlertCircle } from 'lucide-react';

interface FixIssueResponse {
  success: boolean;
  diff: string;
  explanation: string;
  confidence: number;
  changelog: string;
}

interface FixIssuePopupProps {
  isOpen: boolean;
  onClose: () => void;
  response: FixIssueResponse | null;
  onApplyFix?: (diff: string) => void;
}

type TabType = 'diff' | 'explanation' | 'changelog';

export default function FixIssuePopup({ isOpen, onClose, response, onApplyFix }: FixIssuePopupProps) {
  const [activeTab, setActiveTab] = useState<TabType>('diff');

  if (!isOpen || !response) return null;

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-400';
    if (confidence >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 80) return <CheckCircle className="w-5 h-5 text-green-400" />;
    if (confidence >= 60) return <AlertCircle className="w-5 h-5 text-yellow-400" />;
    return <AlertCircle className="w-5 h-5 text-red-400" />;
  };

  const tabs = [
    { id: 'diff' as TabType, label: 'Diff', icon: <FileDiff className="w-4 h-4" /> },
    { id: 'explanation' as TabType, label: 'Explanation', icon: <Lightbulb className="w-4 h-4" /> },
    { id: 'changelog' as TabType, label: 'Changelog', icon: <History className="w-4 h-4" /> }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'diff':
        return (
          <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm overflow-x-auto">
            <pre className="whitespace-pre-wrap text-gray-300">{response.diff}</pre>
          </div>
        );
      case 'explanation':
        return (
          <div className="bg-gray-900 rounded-lg p-4">
            <p className="text-gray-300 leading-relaxed">{response.explanation}</p>
          </div>
        );
      case 'changelog':
        return (
          <div className="bg-gray-900 rounded-lg p-4">
            <p className="text-gray-300 leading-relaxed">{response.changelog}</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white">Fix Issue Response</h2>
            <div className="flex items-center gap-2">
              {getConfidenceIcon(response.confidence)}
              <span className={`text-2xl font-bold ${getConfidenceColor(response.confidence)}`}>
                {response.confidence}%
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-700'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {renderContent()}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-700">
          <button
            onClick={() => { if (onApplyFix && response) onApplyFix(response.diff); }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            Apply Fixes
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
} 