import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Code2, Send, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../lib/api';
import { Challenge as ChallengeType, Contest } from '../types';

export default function Challenge() {
  const { contestId, challengeId } = useParams();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState<ChallengeType | null>(null);
  const [contest, setContest] = useState<Contest | null>(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ points: number; success: boolean } | null>(null);
  const [activeTab, setActiveTab] = useState<'description' | 'submissions'>('description');

  useEffect(() => {
    const fetchChallenge = async () => {
      try {
        const response = await api.get(`/contest/${contestId}/${challengeId}`);
        setChallenge(response.data.challenge);
        setContest(response.data.contest);
      } catch (error) {
        console.error('Failed to fetch challenge:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChallenge();
  }, [contestId, challengeId]);

  const handleSubmit = async () => {
    if (!code.trim()) {
      alert('Please write some code before submitting');
      return;
    }

    setSubmitting(true);
    setResult(null);

    try {
      const response = await api.post(`/contest/submit/${challengeId}`, {
        submission: code,
      });

      setResult({
        points: response.data.points,
        success: true,
      });
    } catch (error: any) {
      setResult({
        points: 0,
        success: false,
      });
      console.error('Submission failed:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-bg-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-main"></div>
      </div>
    );
  }

  if (!challenge || !contest) {
    return (
      <div className="min-h-screen bg-bg-dark flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Challenge Not Found</h2>
          <button
            onClick={() => navigate(`/contest/${contestId}`)}
            className="text-primary-light hover:text-primary-main"
          >
            Back to Contest
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-bg-dark">
      <header className="bg-neutral-black border-b border-neutral-dark px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(`/contest/${contestId}`)}
            className="text-neutral-light hover:text-white transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-lg font-semibold text-white">{challenge.title}</h1>
          <span className="px-3 py-1 bg-success bg-opacity-20 text-success text-sm font-medium rounded">
            {challenge.maxPoints} points
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-neutral-light text-sm">{contest.title}</span>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-1/2 border-r border-neutral-dark bg-neutral-black overflow-y-auto">
          <div className="border-b border-neutral-dark">
            <div className="flex space-x-1 px-4">
              <button
                onClick={() => setActiveTab('description')}
                className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'description'
                    ? 'border-primary-main text-primary-light'
                    : 'border-transparent text-neutral-light hover:text-white'
                }`}
              >
                Description
              </button>
              <button
                onClick={() => setActiveTab('submissions')}
                className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'submissions'
                    ? 'border-primary-main text-primary-light'
                    : 'border-transparent text-neutral-light hover:text-white'
                }`}
              >
                Submissions
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'description' ? (
              <div className="text-neutral-lighter space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">{challenge.title}</h2>
                  <div className="flex items-center space-x-4 mb-6">
                    <span className="px-3 py-1 bg-success bg-opacity-20 text-success text-sm font-medium rounded">
                      Easy
                    </span>
                    <span className="text-neutral-medium">Max Points: {challenge.maxPoints}</span>
                  </div>
                </div>

                <div className="prose prose-invert max-w-none">
                  <p className="text-neutral-lighter leading-relaxed">
                    This challenge is documented in Notion. The detailed problem description,
                    examples, constraints, and test cases can be found in the linked document.
                  </p>

                  <div className="mt-6 p-4 bg-neutral-dark rounded-lg border border-border-dark">
                    <div className="flex items-center space-x-2 mb-2">
                      <Code2 className="w-5 h-5 text-primary-light" />
                      <span className="font-medium text-white">Notion Document</span>
                    </div>
                    <p className="text-sm text-neutral-medium mb-3">
                      View the complete problem description and examples:
                    </p>
                    <a
                      href={`https://notion.so/${challenge.notionDocId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium"
                    >
                      Open in Notion →
                    </a>
                  </div>

                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-white mb-3">Instructions</h3>
                    <ul className="space-y-2 text-neutral-lighter">
                      <li>• Read the problem description carefully</li>
                      <li>• Write your solution in the code editor</li>
                      <li>• Test your solution with the provided examples</li>
                      <li>• Submit when you're confident in your solution</li>
                      <li>• You can submit up to 20 times per challenge</li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-neutral-lighter">
                <h3 className="text-xl font-bold text-white mb-4">Your Submissions</h3>
                <p className="text-neutral-medium">
                  Your submission history will appear here after you make your first submission.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="w-1/2 flex flex-col bg-neutral-black">
          <div className="border-b border-neutral-dark px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-white font-medium">Code</span>
              <select className="bg-neutral-dark text-white px-3 py-1 rounded border border-border-dark text-sm">
                <option>JavaScript</option>
                <option>Python</option>
                <option>TypeScript</option>
                <option>Java</option>
              </select>
            </div>
            <span className="text-neutral-medium text-sm">Auto</span>
          </div>

          <div className="flex-1 overflow-hidden">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="// Write your solution here..."
              className="w-full h-full p-4 bg-neutral-black text-neutral-lighter font-mono text-sm resize-none focus:outline-none"
              style={{ fontFamily: 'monospace', lineHeight: '1.6' }}
            />
          </div>

          {result && (
            <div
              className={`mx-4 mb-4 p-4 rounded-lg border ${
                result.success
                  ? 'bg-success bg-opacity-10 border-success'
                  : 'bg-error bg-opacity-10 border-error'
              }`}
            >
              <div className="flex items-center space-x-2">
                {result.success ? (
                  <CheckCircle className="w-5 h-5 text-success" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-error" />
                )}
                <span className={result.success ? 'text-success' : 'text-error'}>
                  {result.success
                    ? `Accepted! You scored ${result.points} points`
                    : 'Submission failed. Please try again.'}
                </span>
              </div>
            </div>
          )}

          <div className="border-t border-neutral-dark px-4 py-3 flex items-center justify-between bg-neutral-black">
            <div className="text-sm text-neutral-medium">Saved</div>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center space-x-2 px-6 py-2 bg-success text-white rounded-lg font-medium hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Submitting...' : 'Submit'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
