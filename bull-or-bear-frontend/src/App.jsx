import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import { useAuth } from './context/AuthContext';
import ActiveBetsPage from './pages/ActiveBetsPage';
import Bonuses from './pages/Bonuses';
import Home from './pages/Home';
import Leaderboard from './pages/Leaderboard';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Register from './pages/Register';
import Trade from './pages/Trade';
import Verify from './pages/Verify';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/login" replace />;
};

const App = () => (
  <Routes>
    <Route path="/login"    element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/verify"   element={<Verify />} />

    <Route element={<Layout />}>
      <Route path="/home"          element={<PrivateRoute><Home /></PrivateRoute>} />
      <Route path="/trade/:symbol" element={<PrivateRoute><Trade /></PrivateRoute>} />
      <Route path="/active-bets"   element={<PrivateRoute><ActiveBetsPage /></PrivateRoute>} />
      <Route path="/bonuses"       element={<PrivateRoute><Bonuses /></PrivateRoute>} />
      <Route path="/rewards"       element={<Navigate to="/bonuses" replace />} />
      <Route path="/quests"        element={<Navigate to="/bonuses" replace />} />
      <Route path="/leaderboard"   element={<PrivateRoute><Leaderboard /></PrivateRoute>} />
      <Route path="/profile"       element={<PrivateRoute><Profile /></PrivateRoute>} />
    </Route>

    <Route path="*" element={<Navigate to="/home" replace />} />
  </Routes>
);

export default App;
