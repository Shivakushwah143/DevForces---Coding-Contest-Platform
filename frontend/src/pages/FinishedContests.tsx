import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Award, Trophy } from 'lucide-react';
import Layout from '../components/Layout';
import api from '../lib/api';
import { Contest } from '../types';

export default function FinishedContests() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContests = async () => {
      try {
        const response = await api.get('/contest/finished');
        setContests(response.data.contests);
      } catch (error) {
        console.error('Failed to fetch finished contests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContests();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Layout>
      <div className=" mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-neutral-black mb-2">Past Contests</h1>
          <p className="text-neutral-medium">View completed contests and their leaderboards</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-main"></div>
          </div>
        ) : contests.length === 0 ? (
          <div className="bg-bg-primary rounded-xl p-12 text-center border border-border-light">
            <Award className="w-16 h-16 text-neutral-light mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-neutral-black mb-2">No Past Contests</h3>
            <p className="text-neutral-medium">Completed contests will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {contests.map((contest) => (
              <div
                key={contest.id}
                className="bg-bg-primary rounded-xl p-6 border border-border-light hover:border-primary-main hover:shadow-md transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-neutral-lighter rounded-lg flex items-center justify-center flex-shrink-0">
                      <Trophy className="w-7 h-7 text-neutral-medium" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-neutral-black mb-2">{contest.title}</h3>
                      <div className="flex items-center text-neutral-medium text-sm">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>Completed on {formatDate(contest.startTime)}</span>
                      </div>
                    </div>
                  </div>

                  <Link
                    to={`/contest/${contest.id}/leaderboard`}
                    className="px-6 py-2 bg-primary-main text-white rounded-lg font-medium hover:bg-primary-dark transition-colors text-center"
                  >
                    View Leaderboard
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
