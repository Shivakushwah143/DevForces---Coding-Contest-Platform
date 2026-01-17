import { Link } from 'react-router-dom';
import { Trophy, Code2, Users, Zap } from 'lucide-react';
import Layout from '../components/Layout';
import { useRecoilValue } from 'recoil';
import { authState } from '../store/atoms';

export default function Home() {
  const auth = useRecoilValue(authState);

  return (
    <Layout>
      <div className=" mx-auto px-4 sm:px-6 lg:px-8">
        <section className="py-20 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-neutral-black mb-6">
            Compete. Learn. Excel.
          </h1>
          <p className="text-xl text-neutral-medium max-w-2xl mx-auto mb-10">
            Join DevForces to compete in coding challenges, improve your skills, and climb the
            leaderboard with developers worldwide.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {auth.isAuthenticated ? (
              <>
                <Link
                  to="/contests/active"
                  className="px-8 py-4 bg-primary-main text-white rounded-lg font-semibold text-lg hover:bg-primary-dark transition-colors shadow-md"
                >
                  View Active Contests
                </Link>
                <Link
                  to="/contests/finished"
                  className="px-8 py-4 bg-bg-primary text-neutral-dark border-2 border-border-medium rounded-lg font-semibold text-lg hover:bg-bg-tertiary transition-colors"
                >
                  Leaderboard
                </Link>
              </>
            ) : (
              <Link
                to="/signin"
                className="px-8 py-4 bg-primary-main text-white rounded-lg font-semibold text-lg hover:bg-primary-dark transition-colors shadow-md"
              >
                Get Started
              </Link>
            )}
          </div>
        </section>

        <section className="py-16 grid md:grid-cols-3 gap-8">
          <div className="bg-bg-primary rounded-xl p-8 shadow-md border border-border-light">
            <div className="w-14 h-14 bg-primary-main bg-opacity-10 rounded-lg flex items-center justify-center mb-4">
              <Trophy className="w-7 h-7 text-primary-main" />
            </div>
            <h3 className="text-xl font-bold text-neutral-black mb-3">Competitive Contests</h3>
            <p className="text-neutral-medium">
              Participate in timed contests with challenging problems and compete against developers
              worldwide.
            </p>
          </div>

          <div className="bg-bg-primary rounded-xl p-8 shadow-md border border-border-light">
            <div className="w-14 h-14 bg-secondary-main bg-opacity-10 rounded-lg flex items-center justify-center mb-4">
              <Code2 className="w-7 h-7 text-secondary-main" />
            </div>
            <h3 className="text-xl font-bold text-neutral-black mb-3">Real-world Problems</h3>
            <p className="text-neutral-medium">
              Solve practical coding challenges that mirror real-world scenarios and improve your
              problem-solving skills.
            </p>
          </div>

          <div className="bg-bg-primary rounded-xl p-8 shadow-md border border-border-light">
            <div className="w-14 h-14 bg-success bg-opacity-10 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-7 h-7 text-success" />
            </div>
            <h3 className="text-xl font-bold text-neutral-black mb-3">Global Leaderboard</h3>
            <p className="text-neutral-medium">
              Track your progress and rank against other developers on our global leaderboard system.
            </p>
          </div>
        </section>

        <section className="py-16 bg-gradient-to-r from-primary-main to-secondary-main rounded-2xl px-8 text-center mb-16">
          <div className="max-w-3xl mx-auto">
            <Zap className="w-16 h-16 text-white mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Test Your Skills?
            </h2>
            <p className="text-xl text-white text-opacity-90 mb-8">
              Join thousands of developers competing in coding challenges and advancing their careers.
            </p>
            {!auth.isAuthenticated && (
              <Link
                to="/signin"
                className="inline-block px-8 py-4 bg-white text-primary-main rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors shadow-lg"
              >
                Sign In to Start
              </Link>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
}
