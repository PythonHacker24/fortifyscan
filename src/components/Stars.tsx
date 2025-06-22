import React, { useState } from 'react';
import { SparklesIcon, FileDiff, Lightbulb, History, CheckCircle, AlertCircle, X, Copy } from 'lucide-react';

const Star = ({ style }: { style: React.CSSProperties }) => (
  <div
    className="absolute rounded-full bg-white animate-twinkle"
    style={{
      width: '2px',
      height: '2px',
      ...style,
    }}
  />
);

export const FloatingSparkleButton: React.FC<{ onClick?: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-full bg-yellow-400 shadow-md hover:scale-105 transition-transform focus:outline-none"
    style={{
      boxShadow: '0 0 8px 2px #fde047',
      filter: 'drop-shadow(0 0 4px #fde047)'
    }}
    aria-label="All Fixes"
  >
    <SparklesIcon className="w-6 h-6 text-yellow-100" />
    <span className="font-bold text-white text-base">All Fixes</span>
  </button>
);

export const AllFixesPopup: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  fixes: Array<{
    success: boolean;
    diff: string;
    explanation: string;
    confidence: number;
    changelog: string;
    _issueKey?: string;
  }>;
  setFixes: (fixes: Array<any>) => void;
  onRemoveFix: (idx: number) => void;
}> = ({ isOpen, onClose, fixes, setFixes, onRemoveFix }) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'diff' | 'explanation' | 'changelog'>('diff');
  const [showCommand, setShowCommand] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <SparklesIcon className="w-6 h-6 text-yellow-300" />
              All Fixes
            </h2>
            <button
              onClick={() => setShowCommand((prev) => !prev)}
              className="ml-6 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold rounded-lg transition-colors"
              disabled={selectedIdx === null || !fixes[selectedIdx]}
              title={selectedIdx === null ? 'Select a fix to generate command' : 'Create Raincheck Command'}
            >
              Create Raincheck Command
            </button>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        {showCommand && (
          <div className="px-6 pt-2 pb-4 bg-gray-900 border-b border-yellow-400">
            {selectedIdx !== null && fixes[selectedIdx] ? (
              <div className="flex items-center gap-3">
                <div className="p-3 rounded text-sm font-mono text-yellow-200 border border-yellow-400 bg-gray-900 flex-1">
                  {`raincheck apply --diff '${fixes[selectedIdx].diff.substring(0, 40)}...'`}
                </div>
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(`raincheck apply --diff '${fixes[selectedIdx].diff}'`);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                  className="p-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 rounded-lg transition-colors flex items-center"
                  title="Copy to clipboard"
                >
                  <Copy className="w-5 h-5" />
                  {copied && <span className="ml-2 text-xs font-semibold">Copied!</span>}
                </button>
              </div>
            ) : (
              <div className="p-3 rounded text-sm text-yellow-200 border border-yellow-400 bg-gray-900 opacity-60">
                Select a fix to generate the command
              </div>
            )}
          </div>
        )}
        <div className="flex h-[60vh]">
          {/* Fixes List */}
          <div className="w-1/3 border-r border-gray-700 overflow-y-auto bg-gray-900">
            <h3 className="text-lg font-semibold text-blue-400 px-4 py-2">Applied Fixes</h3>
            {fixes.length === 0 ? (
              <div className="text-gray-400 px-4 py-8 text-center">No fixes applied yet.</div>
            ) : (
              <ul>
                {fixes.map((fix, idx) => (
                  <li
                    key={idx}
                    className={`px-4 py-3 cursor-pointer border-b border-gray-800 flex items-center gap-2 transition-colors ${selectedIdx === idx ? 'bg-gray-700' : 'hover:bg-gray-800'}`}
                    onClick={() => { setSelectedIdx(idx); setActiveTab('diff'); setShowCommand(false); }}
                  >
                    <SparklesIcon className="w-4 h-4 text-yellow-300" />
                    <span className="font-semibold text-white">Fix #{idx + 1}</span>
                    <span className={`ml-auto text-xs font-bold ${getConfidenceColor(fix.confidence)}`}>{fix.confidence}%</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* Fix Details */}
          <div className="flex-1 flex flex-col">
            {selectedIdx === null || !fixes[selectedIdx] ? (
              <div className="flex-1 flex items-center justify-center text-gray-400">Select a fix to view details</div>
            ) : (
              <>
                {/* Tabs */}
                <div className="flex border-b border-gray-700">
                  {[
                    { id: 'diff', label: 'Diff', icon: <FileDiff className="w-4 h-4" /> },
                    { id: 'explanation', label: 'Explanation', icon: <Lightbulb className="w-4 h-4" /> },
                    { id: 'changelog', label: 'Changelog', icon: <History className="w-4 h-4" /> }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
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
                <div className="p-6 overflow-y-auto flex-1">
                  {activeTab === 'diff' && (
                    <>
                      <div className="mb-4 flex items-center gap-2 justify-between">
                        <div className="flex items-center gap-2">
                          {getConfidenceIcon(fixes[selectedIdx].confidence)}
                          <span className={`text-lg font-bold ${getConfidenceColor(fixes[selectedIdx].confidence)}`}>{fixes[selectedIdx].confidence}% Confidence</span>
                        </div>
                        <button
                          onClick={() => { if (selectedIdx !== null) onRemoveFix(selectedIdx); }}
                          className="ml-4 p-1 rounded-full bg-red-100 hover:bg-red-200 text-red-500 transition-colors"
                          title="Remove this fix"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                        <pre className="whitespace-pre-wrap text-gray-300">{fixes[selectedIdx].diff}</pre>
                      </div>
                    </>
                  )}
                  {activeTab === 'explanation' && (
                    <div className="bg-gray-900 rounded-lg p-4">
                      <p className="text-gray-300 leading-relaxed">{fixes[selectedIdx].explanation}</p>
                    </div>
                  )}
                  {activeTab === 'changelog' && (
                    <div className="bg-gray-900 rounded-lg p-4">
                      <p className="text-gray-300 leading-relaxed">{fixes[selectedIdx].changelog}</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Stars() {
  // Generate random positions for stars
  const stars = Array.from({ length: 50 }, (_, i) => ({
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 5}s`,
    opacity: Math.random() * 0.5 + 0.5,
  }));

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {stars.map((star, index) => (
        <Star
          key={index}
          style={{
            top: star.top,
            left: star.left,
            animationDelay: star.animationDelay,
            opacity: star.opacity,
          }}
        />
      ))}
    </div>
  );
} 