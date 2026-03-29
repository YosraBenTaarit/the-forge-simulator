"use client";

import { useState } from 'react';
import { Send, CheckCircle, AlertCircle } from 'lucide-react';

interface SubmissionState {
  step: 'initial' | 'submitted' | 'reviewed' | 'approved' | 'done';
  code: string;
  feedback: string[];
  approved: boolean;
}

const expectedFix = `// Ad-Service Fix
const data = [];
const MAX_SIZE = 1000;

setInterval(() => {
  const newData = new Array(100000).fill('datapoint');
  data.push(...newData);
  
  // THE FIX: Cleanup old data
  if (data.length > MAX_SIZE) {
    data.splice(0, data.length - MAX_SIZE);
  }
  
  console.log(\`Memory: \${process.memoryUsage().heapUsed / 1024 / 1024}MB\`);
}, 1000);`;

export default function CodeSubmission() {
  const [submission, setSubmission] = useState<SubmissionState>({
    step: 'initial',
    code: '',
    feedback: [],
    approved: false,
  });

  const handleSubmit = async () => {
    if (!submission.code.trim()) return;

    setSubmission((s) => ({ ...s, step: 'submitted' }));

    // Simulate API call for review
    setTimeout(() => {
      // Check if they're on the right track
      const hasCleanup = submission.code.includes('splice') || submission.code.includes('shift') || submission.code.includes('pop');
      const hasAwareness = submission.code.includes('MAX_SIZE') || submission.code.includes('limit') || submission.code.includes('length');
      
      const feedback: string[] = [];
      let approved = false;

      if (hasCleanup && hasAwareness) {
        feedback.push('✓ Good catch! You identified the accumulation and added cleanup.');
        feedback.push('✓ Using array bounds to prevent unbounded growth - solid approach.');
        approved = true;
        setSubmission((s) => ({
          ...s,
          step: 'approved',
          feedback,
          approved,
        }));
      } else if (hasCleanup) {
        feedback.push('⚠ You added cleanup logic - good instinct!');
        feedback.push('But how do you know when to clean? Need to set limits or thresholds.');
        feedback.push('Suggestion: Define MAX_SIZE and clean when exceeded.');
        setSubmission((s) => ({
          ...s,
          step: 'reviewed',
          feedback,
        }));
      } else {
        feedback.push('💭 Not quite there yet. The issue is that data keeps growing...');
        feedback.push('Hint: Look at the data array. What prevents it from growing forever?');
        feedback.push('Try exploring: splice(), array length limits, data rotation');
        setSubmission((s) => ({
          ...s,
          step: 'reviewed',
          feedback,
        }));
      }
    }, 1500);
  };

  const handleResubmit = () => {
    setSubmission((s) => ({
      ...s,
      step: 'initial',
      code: '',
    }));
  };

  const handleMoveNext = () => {
    setSubmission((s) => ({ ...s, step: 'done' }));
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Code Submission</h3>

        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 space-y-3">
          {submission.step === 'initial' && (
            <>
              <p className="text-xs text-slate-400">
                After debugging, submit your fix for code review. Paste your solution below:
              </p>
              <textarea
                value={submission.code}
                onChange={(e) =>
                  setSubmission((s) => ({ ...s, code: e.target.value }))
                }
                placeholder="// Paste your fixed code here"
                className="w-full h-32 bg-black border border-slate-700 rounded p-3 text-xs font-mono text-green-400 placeholder-slate-600 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleSubmit}
                disabled={!submission.code.trim()}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white text-xs px-4 py-2 rounded font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Send size={14} />
                Submit for Review
              </button>
            </>
          )}

          {submission.step === 'submitted' && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin mb-3">
                  <AlertCircle size={32} className="text-blue-400" />
                </div>
                <p className="text-sm text-slate-400">Senior dev reviewing your code...</p>
              </div>
            </div>
          )}

          {submission.step === 'reviewed' && (
            <>
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-3">
                <h4 className="text-xs font-semibold text-yellow-400 mb-2">Code Review - Feedback</h4>
                <div className="space-y-1">
                  {submission.feedback.map((msg, idx) => (
                    <p key={idx} className="text-xs text-slate-300">
                      {msg}
                    </p>
                  ))}
                </div>
              </div>
              <p className="text-xs text-slate-400">
                Take this feedback and refine your solution. Try again!
              </p>
              <button
                onClick={handleResubmit}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2 rounded font-semibold transition-colors"
              >
                Resubmit
              </button>
            </>
          )}

          {submission.step === 'approved' && (
            <>
              <div className="bg-green-500/10 border border-green-500/30 rounded p-3">
                <div className="flex items-start gap-2 mb-2">
                  <CheckCircle size={16} className="text-green-400 flex-shrink-0 mt-0.5" />
                  <h4 className="text-xs font-semibold text-green-400">Approved! 🎉</h4>
                </div>
                <div className="space-y-2">
                  {submission.feedback.map((msg, idx) => (
                    <p key={idx} className="text-xs text-slate-300">
                      {msg}
                    </p>
                  ))}
                </div>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3">
                <p className="text-xs text-blue-300 mb-2 font-semibold">Next Steps:</p>
                <ul className="text-xs text-slate-300 space-y-1">
                  <li>✓ Code approved for deployment</li>
                  <li>✓ Write tests to validate the fix</li>
                  <li>✓ Deploy to staging for validation</li>
                  <li>✓ Monitor metrics after production rollout</li>
                </ul>
              </div>
              <button
                onClick={handleMoveNext}
                className="w-full bg-green-600 hover:bg-green-500 text-white text-xs px-4 py-2 rounded font-semibold transition-colors"
              >
                Continue to Testing
              </button>
            </>
          )}

          {submission.step === 'done' && (
            <div className="bg-green-500/10 border border-green-500/30 rounded p-3 text-center">
              <p className="text-xs font-semibold text-green-400">
                Great job! Task completed. Ready for the next challenge.
              </p>
            </div>
          )}
        </div>

        {/* Helper - Show expected pattern */}
        {submission.step === 'reviewed' && !submission.approved && (
          <div className="mt-3 bg-slate-900/50 border border-slate-800 rounded p-3">
            <p className="text-xs text-slate-500 mb-2">
              <span className="text-slate-400">💡 Pattern hint:</span> Look for ways to limit or rotate data
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
