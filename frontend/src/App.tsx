import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { RecoilRoot } from 'recoil';
import Home from './pages/Home';
import SignIn from './pages/SignIn';
import Verify from './pages/Verify';
import ActiveContests from './pages/ActiveContests';
import FinishedContests from './pages/FinishedContests';
import ContestDetail from './pages/ContestDetail';
import Challenge from './pages/Challenge';
import Leaderboard from './pages/Leaderboard';
import Admin from './pages/Admin';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <RecoilRoot>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signin/verify" element={<Verify />} />

          <Route
            path="/contests/active"
            element={
              <ProtectedRoute>
                <ActiveContests />
              </ProtectedRoute>
            }
          />

          <Route
            path="/contests/finished"
            element={
              <ProtectedRoute>
                <FinishedContests />
              </ProtectedRoute>
            }
          />

          <Route
            path="/contest/:contestId"
            element={
              <ProtectedRoute>
                <ContestDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="/contest/:contestId/:challengeId"
            element={
              <ProtectedRoute>
                <Challenge />
              </ProtectedRoute>
            }
          />

          <Route
            path="/contest/:contestId/leaderboard"
            element={
              <ProtectedRoute>
                <Leaderboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <Admin />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </RecoilRoot>
  );
}

export default App;
