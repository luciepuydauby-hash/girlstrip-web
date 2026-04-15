import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from './utils/store';
import Welcome from './pages/Welcome';
import Trips from './pages/Trips';
import Layout from './components/Layout';
import Home from './pages/Home';
import Planning from './pages/Planning';
import Budget from './pages/Budget';
import Organisation from './pages/Organisation';
import Discussion from './pages/Discussion';
import Compte from './pages/Compte';

function ProtectedRoute({ children }) {
  const { user, currentTrip } = useAppStore();
  if (!user) return <Navigate to="/" />;
  if (!currentTrip) return <Navigate to="/trips" />;
  return children;
}

function AppRoutes() {
  const { user, currentTrip } = useAppStore();

  return (
    <Routes>
      <Route path="/" element={
        user ? <Navigate to={currentTrip ? "/home" : "/trips"} /> : <Welcome />
      } />
      <Route path="/trips" element={
        user ? <Trips /> : <Navigate to="/" />
      } />
      <Route path="/home" element={
        <ProtectedRoute><Layout><Home /></Layout></ProtectedRoute>
      } />
      <Route path="/planning" element={
        <ProtectedRoute><Layout><Planning /></Layout></ProtectedRoute>
      } />
      <Route path="/budget" element={
        <ProtectedRoute><Layout><Budget /></Layout></ProtectedRoute>
      } />
      <Route path="/organisation" element={
        <ProtectedRoute><Layout><Organisation /></Layout></ProtectedRoute>
      } />
      <Route path="/discussion" element={
        <ProtectedRoute><Layout><Discussion /></Layout></ProtectedRoute>
      } />
      <Route path="/compte" element={
        <ProtectedRoute><Layout><Compte /></Layout></ProtectedRoute>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
