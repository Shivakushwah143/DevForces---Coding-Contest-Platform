import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Trophy } from 'lucide-react';
import Layout from '../components/Layout';
import api from '../lib/api';
import { Contest } from '../types';

export default function ActiveContests() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContests = async () => {
      try {
        const response = await api.get('/contest/active');
        setContests(response.data.contests);
      } catch (error) {
        console.error('Failed to fetch active contests:', error);
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeRemaining = (startTime: string) => {
    const start = new Date(startTime).getTime();
    const end = start + 24 * 60 * 60 * 1000;
    const now = Date.now();
    const remaining = end - now;

    if (remaining <= 0) return 'Ended';

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m remaining`;
  };

  return (
    <Layout>
      <div className=" mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-neutral-black mb-2">Active Contests</h1>
          <p className="text-neutral-medium">
            Compete in live contests and test your coding skills
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-main"></div>
          </div>
        ) : contests.length === 0 ? (
          <div className="bg-bg-primary rounded-xl p-12 text-center border border-border-light">
            <Trophy className="w-16 h-16 text-neutral-light mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-neutral-black mb-2">No Active Contests</h3>
            <p className="text-neutral-medium">Check back soon for new contests!</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {contests.map((contest) => (
              <Link
                key={contest.id}
                to={`/contest/${contest.id}`}
                className="bg-bg-primary rounded-xl p-6 border border-border-light hover:border-primary-main hover:shadow-lg transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-neutral-black group-hover:text-primary-main transition-colors mb-2">
                      {contest.title}
                    </h3>
                  </div>
                  <div className="w-12 h-12 bg-primary-main bg-opacity-10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-6 h-6 text-primary-main" />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center text-neutral-medium text-sm">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>{formatDate(contest.startTime)}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Clock className="w-4 h-4 mr-2" />
                    <span className="font-medium text-success">
                      {getTimeRemaining(contest.startTime)}
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border-light">
                  <button className="w-full py-2 px-4 bg-primary-main text-white rounded-lg font-medium hover:bg-primary-dark transition-colors">
                    Enter Contest
                  </button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
