import { useState } from 'react';
import { Plus, Trophy, Code2, Link as LinkIcon } from 'lucide-react';
import Layout from '../components/Layout';
import api from '../lib/api';

export default function Admin() {
  const [activeTab, setActiveTab] = useState<'contest' | 'challenge' | 'link'>('contest');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [contestData, setContestData] = useState({
    title: '',
    startTime: '',
  });

  const [challengeData, setChallengeData] = useState({
    title: '',
    notionDocId: '',
    maxPoints: 100,
  });

  const [linkData, setLinkData] = useState({
    contestId: '',
    challengeId: '',
    index: 0,
  });

  const handleCreateContest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await api.post('/admin/contest', contestData);
      setMessage({ type: 'success', text: 'Contest created successfully!' });
      setContestData({ title: '', startTime: '' });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to create contest',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await api.post('/admin/challenge', challengeData);
      setMessage({ type: 'success', text: 'Challenge created successfully!' });
      setChallengeData({ title: '', notionDocId: '', maxPoints: 100 });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to create challenge',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLinkChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await api.post(`/admin/link/${linkData.challengeId}/${linkData.contestId}`, {
        index: linkData.index,
      });
      setMessage({ type: 'success', text: 'Challenge linked to contest successfully!' });
      setLinkData({ contestId: '', challengeId: '', index: 0 });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to link challenge',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-neutral-black mb-2">Admin Dashboard</h1>
          <p className="text-neutral-medium">Manage contests, challenges, and configurations</p>
        </div>

        <div className="bg-bg-primary rounded-xl shadow-lg border border-border-light overflow-hidden">
          <div className="border-b border-border-light">
            <div className="flex">
              <button
                onClick={() => setActiveTab('contest')}
                className={`flex-1 flex items-center justify-center space-x-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === 'contest'
                    ? 'bg-primary-main text-white'
                    : 'text-neutral-dark hover:bg-bg-tertiary'
                }`}
              >
                <Trophy className="w-5 h-5" />
                <span>Create Contest</span>
              </button>
              <button
                onClick={() => setActiveTab('challenge')}
                className={`flex-1 flex items-center justify-center space-x-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === 'challenge'
                    ? 'bg-primary-main text-white'
                    : 'text-neutral-dark hover:bg-bg-tertiary'
                }`}
              >
                <Code2 className="w-5 h-5" />
                <span>Create Challenge</span>
              </button>
              <button
                onClick={() => setActiveTab('link')}
                className={`flex-1 flex items-center justify-center space-x-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === 'link'
                    ? 'bg-primary-main text-white'
                    : 'text-neutral-dark hover:bg-bg-tertiary'
                }`}
              >
                <LinkIcon className="w-5 h-5" />
                <span>Link Challenge</span>
              </button>
            </div>
          </div>

          <div className="p-8">
            {message && (
              <div
                className={`mb-6 p-4 rounded-lg border ${
                  message.type === 'success'
                    ? 'bg-success bg-opacity-10 border-success text-success'
                    : 'bg-error bg-opacity-10 border-error text-error'
                }`}
              >
                {message.text}
              </div>
            )}

            {activeTab === 'contest' && (
              <form onSubmit={handleCreateContest} className="space-y-6">
                <div>
                  <label htmlFor="contest-title" className="block text-sm font-medium text-neutral-dark mb-2">
                    Contest Title
                  </label>
                  <input
                    id="contest-title"
                    type="text"
                    value={contestData.title}
                    onChange={(e) => setContestData({ ...contestData, title: e.target.value })}
                    placeholder="Weekly Coding Challenge #1"
                    required
                    className="w-full px-4 py-3 rounded-lg border border-border-medium focus:border-primary-main focus:ring-2 focus:ring-primary-light focus:ring-opacity-20 outline-none transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="contest-start" className="block text-sm font-medium text-neutral-dark mb-2">
                    Start Time
                  </label>
                  <input
                    id="contest-start"
                    type="datetime-local"
                    value={contestData.startTime}
                    onChange={(e) => setContestData({ ...contestData, startTime: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-border-medium focus:border-primary-main focus:ring-2 focus:ring-primary-light focus:ring-opacity-20 outline-none transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center space-x-2 bg-primary-main text-white py-3 rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-5 h-5" />
                  <span>{loading ? 'Creating...' : 'Create Contest'}</span>
                </button>
              </form>
            )}

            {activeTab === 'challenge' && (
              <form onSubmit={handleCreateChallenge} className="space-y-6">
                <div>
                  <label htmlFor="challenge-title" className="block text-sm font-medium text-neutral-dark mb-2">
                    Challenge Title
                  </label>
                  <input
                    id="challenge-title"
                    type="text"
                    value={challengeData.title}
                    onChange={(e) => setChallengeData({ ...challengeData, title: e.target.value })}
                    placeholder="Two Sum Problem"
                    required
                    className="w-full px-4 py-3 rounded-lg border border-border-medium focus:border-primary-main focus:ring-2 focus:ring-primary-light focus:ring-opacity-20 outline-none transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="notion-doc" className="block text-sm font-medium text-neutral-dark mb-2">
                    Notion Document ID
                  </label>
                  <input
                    id="notion-doc"
                    type="text"
                    value={challengeData.notionDocId}
                    onChange={(e) =>
                      setChallengeData({ ...challengeData, notionDocId: e.target.value })
                    }
                    placeholder="abc123def456"
                    required
                    className="w-full px-4 py-3 rounded-lg border border-border-medium focus:border-primary-main focus:ring-2 focus:ring-primary-light focus:ring-opacity-20 outline-none transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="max-points" className="block text-sm font-medium text-neutral-dark mb-2">
                    Max Points
                  </label>
                  <input
                    id="max-points"
                    type="number"
                    value={challengeData.maxPoints}
                    onChange={(e) =>
                      setChallengeData({ ...challengeData, maxPoints: parseInt(e.target.value) })
                    }
                    min="1"
                    required
                    className="w-full px-4 py-3 rounded-lg border border-border-medium focus:border-primary-main focus:ring-2 focus:ring-primary-light focus:ring-opacity-20 outline-none transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center space-x-2 bg-primary-main text-white py-3 rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-5 h-5" />
                  <span>{loading ? 'Creating...' : 'Create Challenge'}</span>
                </button>
              </form>
            )}

            {activeTab === 'link' && (
              <form onSubmit={handleLinkChallenge} className="space-y-6">
                <div>
                  <label htmlFor="link-contest" className="block text-sm font-medium text-neutral-dark mb-2">
                    Contest ID
                  </label>
                  <input
                    id="link-contest"
                    type="text"
                    value={linkData.contestId}
                    onChange={(e) => setLinkData({ ...linkData, contestId: e.target.value })}
                    placeholder="contest-uuid-here"
                    required
                    className="w-full px-4 py-3 rounded-lg border border-border-medium focus:border-primary-main focus:ring-2 focus:ring-primary-light focus:ring-opacity-20 outline-none transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="link-challenge" className="block text-sm font-medium text-neutral-dark mb-2">
                    Challenge ID
                  </label>
                  <input
                    id="link-challenge"
                    type="text"
                    value={linkData.challengeId}
                    onChange={(e) => setLinkData({ ...linkData, challengeId: e.target.value })}
                    placeholder="challenge-uuid-here"
                    required
                    className="w-full px-4 py-3 rounded-lg border border-border-medium focus:border-primary-main focus:ring-2 focus:ring-primary-light focus:ring-opacity-20 outline-none transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="link-index" className="block text-sm font-medium text-neutral-dark mb-2">
                    Challenge Index (Order)
                  </label>
                  <input
                    id="link-index"
                    type="number"
                    value={linkData.index}
                    onChange={(e) => setLinkData({ ...linkData, index: parseInt(e.target.value) })}
                    min="0"
                    required
                    className="w-full px-4 py-3 rounded-lg border border-border-medium focus:border-primary-main focus:ring-2 focus:ring-primary-light focus:ring-opacity-20 outline-none transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center space-x-2 bg-primary-main text-white py-3 rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <LinkIcon className="w-5 h-5" />
                  <span>{loading ? 'Linking...' : 'Link Challenge to Contest'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
