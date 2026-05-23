import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PatientList from './pages/PatientList';
import PatientDetail from './pages/PatientDetail';
import BookAppointment from './pages/BookAppointment';
import Calendar from './pages/Calendar';
import Billing from './pages/Billing';
import Messaging from './pages/Messaging';
import SidebarLayout from './components/SidebarLayout';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<SidebarLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="patients" element={<PatientList />} />
            <Route path="patients/:id" element={<PatientDetail />} />
            <Route path="book" element={<BookAppointment />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="billing" element={<Billing />} />
            <Route path="messaging" element={<Messaging />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
