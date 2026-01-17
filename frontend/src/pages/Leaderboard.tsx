import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Trophy, Medal, Award, ArrowLeft } from 'lucide-react';
import Layout from '../components/Layout';
import api from '../lib/api';
import { LeaderboardEntry, Contest } from '../types';

export default function Leaderboard() {
  const { contestId } = useParams();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [contest, setContest] = useState<Contest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const [leaderboardRes, contestRes] = await Promise.all([
          api.get(`/contest/leaderboard/${contestId}`),
          api.get(`/contest/${contestId}`),
        ]);
        setLeaderboard(leaderboardRes.data.leaderboard);
        setContest(contestRes.data.contest);
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [contestId]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-warning" />;
      case 2:
        return <Medal className="w-6 h-6 text-neutral-light" />;
      case 3:
        return <Award className="w-6 h-6 text-warning" />;
      default:
        return <span className="text-lg font-bold text-neutral-medium">#{rank}</span>;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-warning bg-opacity-10 border-warning';
      case 2:
        return 'bg-neutral-light bg-opacity-10 border-neutral-light';
      case 3:
        return 'bg-warning bg-opacity-5 border-warning border-opacity-50';
      default:
        return 'bg-bg-primary border-border-light';
    }
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

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link
            to={`/contest/${contestId}`}
            className="inline-flex items-center text-primary-main hover:text-primary-dark mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Contest
          </Link>
          <div className="flex items-center space-x-4 mb-2">
            <Trophy className="w-10 h-10 text-primary-main" />
            <h1 className="text-4xl font-bold text-neutral-black">Leaderboard</h1>
          </div>
          {contest && (
            <p className="text-neutral-medium text-lg">{contest.title}</p>
          )}
        </div>

        {leaderboard.length === 0 ? (
          <div className="bg-bg-primary rounded-xl p-12 text-center border border-border-light">
            <Trophy className="w-16 h-16 text-neutral-light mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-neutral-black mb-2">No Rankings Yet</h3>
            <p className="text-neutral-medium">Be the first to submit and top the leaderboard!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((entry) => (
              <div
                key={entry.rank}
                className={`rounded-xl p-5 border-2 transition-all ${getRankColor(entry.rank)} ${
                  entry.rank <= 3 ? 'shadow-md' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
                      {getRankIcon(entry.rank)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        className={`font-semibold truncate ${
                          entry.rank <= 3 ? 'text-lg' : 'text-base'
                        } ${entry.rank === 1 ? 'text-warning' : 'text-neutral-black'}`}
                      >
                        {entry.user?.email || 'Anonymous'}
                      </h3>
                      {entry.rank <= 3 && (
                        <p className="text-sm text-neutral-medium">
                          {entry.rank === 1 && '🏆 Champion'}
                          {entry.rank === 2 && '🥈 Runner-up'}
                          {entry.rank === 3 && '🥉 Third Place'}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`font-bold ${entry.rank <= 3 ? 'text-2xl' : 'text-xl'} ${
                        entry.rank === 1 ? 'text-warning' : 'text-primary-main'
                      }`}
                    >
                      {entry.points}
                    </div>
                    <div className="text-sm text-neutral-medium">points</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
