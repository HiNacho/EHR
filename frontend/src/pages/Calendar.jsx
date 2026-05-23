import { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, Video, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Calendar() {
  const [appointments, setAppointments] = useState([]);
  const [date, setDate] = useState(new Date());
  const { user } = useAuth();

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const res = await axios.get('http://localhost:8001/api/appointments/list/');
        setAppointments(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchApps();
  }, [user]);

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const formattedDate = date.toISOString().split('T')[0];
  const todaysApps = appointments.filter(a => a.date === formattedDate).sort((a,b) => a.time_slot.localeCompare(b.time_slot));

  const changeDay = (offset) => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + offset);
    setDate(newDate);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'CONFIRMED': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'PENDING': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'CANCELLED': return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'COMPLETED': return 'bg-slate-100 text-slate-800 border-slate-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col h-full space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Clinical Schema</h1>
          <p className="mt-1 text-slate-500">Manage daily allocations and telehealth queues.</p>
        </div>
        <div className="flex items-center gap-4 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
          <button onClick={() => changeDay(-1)} className="p-2 hover:bg-slate-100 rounded-lg"><ChevronLeft className="h-5 w-5" /></button>
          <div className="font-semibold text-slate-700 min-w-[200px] text-center">
            {days[date.getDay()]}, {date.toLocaleDateString()}
          </div>
          <button onClick={() => changeDay(1)} className="p-2 hover:bg-slate-100 rounded-lg"><ChevronRight className="h-5 w-5" /></button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex-1 min-h-[600px] p-6">
        {todaysApps.length === 0 ? (
           <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
              <CalendarIcon className="h-16 w-16 opacity-20" />
              <p>No appointments requested for this date.</p>
           </div>
        ) : (
           <div className="space-y-4">
             {todaysApps.map(app => (
               <div key={app.id} className={`p-4 rounded-xl border-l-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:shadow-md ${getStatusColor(app.status)}`}>
                 <div className="flex items-center gap-6">
                    <div className="text-center min-w-[100px]">
                      <div className="text-lg font-bold">{app.time_slot.substring(0,5)}</div>
                      <div className="text-xs uppercase tracking-wider font-semibold opacity-70">{app.status}</div>
                    </div>
                    <div>
                      <div className="font-semibold text-lg flex items-center gap-2">
                        {app.patient_name}
                        {app.is_telehealth && <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest font-bold flex items-center gap-1"><Video className="h-3 w-3"/> Telehealth</span>}
                      </div>
                      <div className="text-sm opacity-80 mt-1 flex items-center gap-4">
                        <span className="flex items-center gap-1"><User className="h-4 w-4"/> Dr. {app.doctor_name}</span>
                      </div>
                    </div>
                 </div>
                 <div className="flex gap-3">
                   {app.is_telehealth && app.zoom_link && app.status !== 'CANCELLED' && (
                     <a href={app.zoom_link} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition shadow-sm">
                       <Video className="h-4 w-4" /> Join Zoom
                     </a>
                   )}
                   <button className="px-4 py-2 bg-white/50 hover:bg-white text-slate-800 border rounded-lg font-medium transition text-sm">View Chart</button>
                 </div>
               </div>
             ))}
           </div>
        )}
      </div>
    </div>
  );
}
