import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Calendar, Activity, ClipboardList, Check, X } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ patients: 0, appointments: 0 });
  const [appointmentsList, setAppointmentsList] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (['ADMIN', 'DOCTOR', 'NURSE'].includes(user.role)) {
           const pRes = await axios.get('http://localhost:8001/api/patients/list/');
           setStats(prev => ({ ...prev, patients: pRes.data.length }));
        }
        
        const aRes = await axios.get('http://localhost:8001/api/appointments/list/');
        setStats(prev => ({ ...prev, appointments: aRes.data.length }));
        
        if (user.role === 'DOCTOR' || user.role === 'ADMIN') {
           setAppointmentsList(aRes.data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [user]);

  const handleStatusChange = async (id, actionStr) => {
    try {
      await axios.post(`http://localhost:8001/api/appointments/list/${id}/${actionStr}/`);
      // Update local state smoothly
      setAppointmentsList(prev => 
         prev.map(app => 
            app.id === id ? { ...app, status: actionStr === 'accept' ? 'CONFIRMED' : 'CANCELLED' } : app
         )
      );
    } catch (err) {
      alert("Error changing status");
      console.error(err);
    }
  };

  const StatCard = ({ title, value, icon: Icon, colorClass }) => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-6 hover:shadow-md transition-shadow">
      <div className={`p-4 rounded-xl ${colorClass}`}>
        <Icon className="h-8 w-8" />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500 truncate">{title}</p>
        <p className="mt-1 text-3xl font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  );

  const pendingAppointments = appointmentsList.filter(a => a.status === 'PENDING');

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome, {user.first_name || user.email}!</h1>
        <p className="mt-2 text-slate-600">Here's what's happening today in your {user.role.toLowerCase()} dashboard.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {['ADMIN', 'DOCTOR', 'NURSE'].includes(user.role) && (
           <StatCard title="Total Patients" value={stats.patients} icon={Users} colorClass="bg-blue-50 text-blue-600" />
        )}
        <StatCard title={user.role === 'PATIENT' ? 'My Appointments' : "Upcoming Appointments"} value={stats.appointments} icon={Calendar} colorClass="bg-teal-50 text-teal-600" />
        {['ADMIN', 'DOCTOR', 'NURSE'].includes(user.role) && (
           <StatCard title="Recent Notes" value="12" icon={ClipboardList} colorClass="bg-amber-50 text-amber-600" />
        )}
        {['ADMIN'].includes(user.role) && (
           <StatCard title="System Alerts" value="0" icon={Activity} colorClass="bg-rose-50 text-rose-600" />
        )}
      </div>

      {user.role === 'DOCTOR' && pendingAppointments.length > 0 && (
         <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                   Action Required: Pending Appointments
                </h2>
                <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                   {pendingAppointments.length} Pending
                </span>
            </div>
            
            <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="border-b border-slate-100 text-sm font-semibold text-slate-500 uppercase tracking-wider">
                        <th className="pb-3 px-4">Patient</th>
                        <th className="pb-3 px-4">Date & Time</th>
                        <th className="pb-3 px-4">Reason</th>
                        <th className="pb-3 px-4 text-right">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {pendingAppointments.map(app => (
                        <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                           <td className="py-4 px-4 font-medium text-slate-900">{app.patient_name}</td>
                           <td className="py-4 px-4 text-slate-600">{app.date} at {app.time_slot}</td>
                           <td className="py-4 px-4 text-slate-500 italic max-w-xs truncate">{app.reason || 'None provided'}</td>
                           <td className="py-4 px-4 text-right flex justify-end gap-2">
                               <button onClick={() => handleStatusChange(app.id, 'accept')} className="bg-teal-50 text-teal-700 hover:bg-teal-100 p-2 rounded-lg transition" title="Accept">
                                   <Check className="h-5 w-5" />
                               </button>
                               <button onClick={() => handleStatusChange(app.id, 'cancel')} className="bg-red-50 text-red-700 hover:bg-red-100 p-2 rounded-lg transition" title="Cancel">
                                   <X className="h-5 w-5" />
                               </button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
        <h2 className="text-xl font-semibold text-slate-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           {/* Add dummy buttons for aesthetics */}
           <button className="p-4 rounded-xl border border-slate-200 text-left hover:border-teal-500 hover:bg-teal-50 transition-all font-medium text-slate-700">
             + Search Patient
           </button>
           {user.role === 'PATIENT' && (
             <button className="p-4 rounded-xl border border-slate-200 text-left hover:border-teal-500 hover:bg-teal-50 transition-all font-medium text-slate-700" onClick={() => window.location.href='/book'}>
               + Book Appointment
             </button>
           )}
           {['NURSE', 'DOCTOR'].includes(user.role) && (
             <button className="p-4 rounded-xl border border-slate-200 text-left hover:border-teal-500 hover:bg-teal-50 transition-all font-medium text-slate-700">
               + Record Vitals
             </button>
           )}
        </div>
      </div>
    </div>
  );
}
