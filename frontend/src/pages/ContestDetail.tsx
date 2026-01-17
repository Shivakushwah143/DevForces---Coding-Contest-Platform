import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Calendar, Clock, Code2, Trophy } from 'lucide-react';
import Layout from '../components/Layout';
import api from '../lib/api';
import { Contest } from '../types';

export default function ContestDetail() {
  const { contestId } = useParams();
  const [contest, setContest] = useState<Contest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContest = async () => {
      try {
        const response = await api.get(`/contest/${contestId}`);
        setContest(response.data.contest);
      } catch (error) {
        console.error('Failed to fetch contest:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContest();
  }, [contestId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeRemaining = (startTime: string) => {
    const start = new Date(startTime).getTime();
    const end = start + 24 * 60 * 60 * 1000;
    const now = Date.now();
    const remaining = end - now;

    if (remaining <= 0) return 'Contest Ended';

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m remaining`;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-main"></div>
        </div>
      </Layout>
    );
  }

  if (!contest) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-2xl font-bold text-neutral-black mb-4">Contest Not Found</h2>
          <Link to="/contests/active" className="text-primary-main hover:text-primary-dark">
            Back to Contests
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-bg-primary rounded-xl p-8 border border-border-light mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-neutral-black mb-4">{contest.title}</h1>
              <div className="flex flex-wrap gap-4 text-neutral-medium">
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  <span>{formatDate(contest.startTime)}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  <span className="font-medium text-success">
                    {getTimeRemaining(contest.startTime)}
                  </span>
                </div>
              </div>
            </div>
            <Link
              to={`/contest/${contestId}/leaderboard`}
              className="flex items-center space-x-2 px-6 py-3 bg-secondary-main text-white rounded-lg font-medium hover:bg-secondary-dark transition-colors"
            >
              <Trophy className="w-5 h-5" />
              <span>Leaderboard</span>
            </Link>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-neutral-black mb-4">Challenges</h2>
          <p className="text-neutral-medium">
            Complete all challenges to maximize your score in this contest
          </p>
        </div>

        {contest.contestToChallengeMapping && contest.contestToChallengeMapping.length > 0 ? (
          <div className="space-y-4">
            {contest.contestToChallengeMapping
              .sort((a, b) => a.index - b.index)
              .map((mapping, idx) => (
                <Link
                  key={mapping.id}
                  to={`/contest/${contestId}/${mapping.challenge.id}`}
                  className="block bg-bg-primary rounded-xl p-6 border border-border-light hover:border-primary-main hover:shadow-md transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 bg-primary-main bg-opacity-10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Code2 className="w-6 h-6 text-primary-main" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-sm font-medium text-neutral-medium">
                            Challenge {idx + 1}
                          </span>
                          <span className="px-2 py-1 bg-success bg-opacity-10 text-success text-xs font-medium rounded">
                            {mapping.challenge.maxPoints} points
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-neutral-black group-hover:text-primary-main transition-colors">
                          {mapping.challenge.title}
                        </h3>
                      </div>
                    </div>
                    <div className="text-primary-main font-medium group-hover:translate-x-1 transition-transform">
                      Solve →
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        ) : (
          <div className="bg-bg-primary rounded-xl p-12 text-center border border-border-light">
            <Code2 className="w-16 h-16 text-neutral-light mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-neutral-black mb-2">No Challenges Yet</h3>
            <p className="text-neutral-medium">Challenges will be added soon</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
