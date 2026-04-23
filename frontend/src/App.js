import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useStore } from './store/useStore';
import Layout      from './components/Layout';
import Login        from './pages/Login';
import Dashboard    from './pages/Dashboard';
import Upload       from './pages/Upload';
import History      from './pages/History';
import Chatbot      from './pages/Chatbot';
import Medications  from './pages/Medications';
import DrugDB       from './pages/DrugDB';
import Interactions from './pages/Interactions';
import Health       from './pages/Health';
import Emergency    from './pages/Emergency';
import Pharmacist   from './pages/Pharmacist';
import Doctor       from './pages/Doctor';
import Admin        from './pages/Admin';

function Private({ children }) {
  const { isAuthenticated } = useStore();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {


  return (
    <BrowserRouter>
      <Toaster position="bottom-right" toastOptions={{
        style: { background:'#0d1220', color:'#e0e6f0', border:'1px solid #1e2a42', fontFamily:'Inter,sans-serif', fontSize:13 },
        duration: 3500,
      }} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Private><Layout /></Private>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"    element={<Dashboard />} />
          <Route path="upload"       element={<Upload />} />
          <Route path="history"      element={<History />} />
          <Route path="chatbot"      element={<Chatbot />} />
          <Route path="medications"  element={<Medications />} />
          <Route path="drugs"        element={<DrugDB />} />
          <Route path="interactions" element={<Interactions />} />
          <Route path="health"       element={<Health />} />
          <Route path="emergency"    element={<Emergency />} />
          <Route path="pharmacist"   element={<Pharmacist />} />
          <Route path="doctor"       element={<Doctor />} />
          <Route path="admin"        element={<Admin />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
