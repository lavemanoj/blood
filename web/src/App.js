import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getMe } from './store/slices/authSlice';

import Login from './pages/Login';
import Register from './pages/Register';
import DonorDashboard from './pages/dashboards/DonorDashboard';
import RecipientDashboard from './pages/dashboards/RecipientDashboard';
import HospitalDashboard from './pages/dashboards/HospitalDashboard';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import NGODashboard from './pages/dashboards/NGODashboard';
import CreateRequest from './pages/CreateRequest';
import Chatbot from './pages/Chatbot';
import MapView from './pages/MapView';
import Navbar from './components/Navbar';
import BloodBot from './components/BloodBot';
import Profile from './pages/Profile';

const PrivateRoute = ({ children, roles }) => {
  const { token, user } = useSelector(s => s.auth);
  if (!token) return <Navigate to="/login" />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
};

const DashboardRouter = () => {
  const { user } = useSelector(s => s.auth);
  if (!user) return null;
  const dashboards = {
    donor: <DonorDashboard />,
    recipient: <RecipientDashboard />,
    hospital: <HospitalDashboard />,
    admin: <AdminDashboard />,
    ngo: <NGODashboard />
  };
  return dashboards[user.role] || <div>Unknown role</div>;
};

export default function App() {
  const dispatch = useDispatch();
  const { token } = useSelector(s => s.auth);

  useEffect(() => {
    if (token) dispatch(getMe());
  }, [token, dispatch]);

  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<PrivateRoute><DashboardRouter /></PrivateRoute>} />
        <Route path="/request/new" element={<PrivateRoute roles={['recipient']}><CreateRequest /></PrivateRoute>} />
        <Route path="/chatbot" element={<PrivateRoute roles={['donor']}><Chatbot /></PrivateRoute>} />
        <Route path="/map" element={<PrivateRoute><MapView /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
      </Routes>
      <ToastContainer position="top-right" autoClose={4000} />
      <BloodBot />
    </BrowserRouter>
  );
}
