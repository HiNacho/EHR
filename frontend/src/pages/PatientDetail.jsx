import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { User, Activity, FileText, Calendar, Link as LinkIcon, Folder, Shield, X, Bot } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function PatientDetail() {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [vitals, setVitals] = useState([]);
  const [notes, setNotes] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState('vitals');
  const [aiLoading, setAiLoading] = useState(false);
  const [rawAiInput, setRawAiInput] = useState('');
  
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [vitalsForm, setVitalsForm] = useState({ temperature: '', pulse: '', blood_pressure: '', respiratory_rate: '', oxygen_saturation: '' });
  const [noteForm, setNoteForm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const { user } = useAuth();

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const pRes = await axios.get(`http://localhost:8001/api/patients/list/${id}/`);
        setPatient(pRes.data);
        const vRes = await axios.get('http://localhost:8001/api/patients/vitals/');
        setVitals(vRes.data.filter(v => v.patient === parseInt(id)).sort((a,b) => new Date(a.recorded_at) - new Date(b.recorded_at)));
        const nRes = await axios.get('http://localhost:8001/api/clinical/notes/');
        setNotes(nRes.data.filter(n => n.patient === parseInt(id)));
        const aRes = await axios.get('http://localhost:8001/api/appointments/list/');
        setAppointments(aRes.data.filter(a => a.patient === parseInt(id)));
      } catch (err) {
        console.error(err);
      }
    };
    fetchAll();
  }, [id]);

  const handleAddVitals = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { patient: parseInt(id), ...vitalsForm };
      const res = await axios.post('http://localhost:8001/api/patients/vitals/', payload);
      setVitals([...vitals, res.data].sort((a,b) => new Date(a.recorded_at) - new Date(b.recorded_at)));
      setShowVitalsModal(false);
      setVitalsForm({ temperature: '', pulse: '', blood_pressure: '', respiratory_rate: '', oxygen_saturation: '' });
    } catch (err) {
      alert("Error adding vitals");
    } finally {
       setSubmitting(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { patient: parseInt(id), note_text: noteForm };
      const res = await axios.post('http://localhost:8001/api/clinical/notes/', payload);
      setNotes([...notes, res.data]);
      setShowNoteModal(false);
      setNoteForm('');
    } catch (err) {
      alert("Error adding note");
    } finally {
       setSubmitting(false);
    }
  };

  const generateAISOAP = async () => {
    if (!rawAiInput.trim()) return;
    setAiLoading(true);
    try {
       const res = await axios.post('http://localhost:8001/api/clinical/notes/generate_ai_soap/', { raw_text: rawAiInput });
       setNoteForm(res.data.structured_note);
    } catch(err) {
       alert("Error generating AI note");
    } finally {
       setAiLoading(false);
    }
  };

  if (!patient) return <div className="p-8">Loading...</div>;

  const chartData = vitals.map(v => ({
    time: new Date(v.recorded_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
    temperature: parseFloat(v.temperature),
    pulse: v.pulse,
    spO2: parseFloat(v.oxygen_saturation),
    systolic: parseInt(v.blood_pressure.split('/')[0]),
    diastolic: parseInt(v.blood_pressure.split('/')[1])
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl text-xs border border-slate-700">
          <p className="font-semibold mb-2">{label}</p>
          {payload.map((p, i) => (
            <div key={i} className="flex items-center justify-between gap-4 mb-1">
              <span className="opacity-80" style={{color: p.color}}>{p.name}:</span>
              <span className="font-bold">{p.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const tabs = [
    { id: 'personal', icon: User, label: 'Personal Info' },
    { id: 'vitals', icon: Activity, label: 'Vitals Timeline' },
    { id: 'notes', icon: FileText, label: 'Clinical Notes' },
    { id: 'appointments', icon: Calendar, label: 'Appointments' },
    { id: 'history', icon: Shield, label: 'Medical History' },
    { id: 'family', icon: LinkIcon, label: 'Relationships' },
    { id: 'docs', icon: Folder, label: 'Documents' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col space-y-6">
      {/* Header Profile Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="h-20 w-20 bg-blue-50 rounded-2xl flex items-center justify-center border-2 border-blue-100">
            <User className="h-10 w-10 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              {patient.full_name}
              <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest">Active</span>
            </h1>
            <p className="mt-1 text-slate-500 font-medium tracking-wide">
              DOB: {new Date(patient.date_of_birth).toLocaleDateString()} • Gender: {patient.gender}
            </p>
          </div>
        </div>
        <div className="flex gap-4">
           {['NURSE', 'DOCTOR'].includes(user.role) && (
              <button onClick={() => setShowVitalsModal(true)} className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-semibold transition text-sm flex items-center gap-2">
                <Activity className="h-4 w-4"/> Log Vitals
              </button>
           )}
           {['DOCTOR'].includes(user.role) && (
              <button onClick={() => setShowNoteModal(true)} className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl font-semibold transition text-sm flex items-center gap-2">
                <FileText className="h-4 w-4"/> AI SOAP Note
              </button>
           )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-0 scrollbar-hide border-b border-slate-200">
        {tabs.map(tab => (
           <button 
             key={tab.id} 
             onClick={() => setActiveTab(tab.id)}
             className={`flex animate-in slide-in-from-bottom items-center gap-2 px-6 py-4 font-medium whitespace-nowrap transition-all border-b-2 ${activeTab === tab.id ? 'border-blue-600 text-blue-700 bg-transparent' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
           >
             <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? 'text-blue-600' : 'text-slate-400'}`} />
             {tab.label}
           </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-b-2xl shadow-sm p-8 flex-1 min-h-[500px]">
        {activeTab === 'personal' && (
           <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-900 border-b pb-2">Demographics</h3>
              <div className="grid grid-cols-2 gap-y-6">
                 <div>
                   <p className="text-xs font-semibold text-slate-400 uppercase">Contact Phone</p>
                   <p className="text-slate-800 mt-1 font-medium">{patient.phone_number}</p>
                 </div>
                 <div>
                   <p className="text-xs font-semibold text-slate-400 uppercase">Address</p>
                   <p className="text-slate-800 mt-1 font-medium">{patient.address || 'Not Formally Registered'}</p>
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'vitals' && (
           <div className="h-[400px]">
             {vitals.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                   <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                   <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                   <YAxis yAxisId="right" orientation="right" domain={[90, 100]} axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                   <Tooltip content={<CustomTooltip />} />
                   <Legend iconType="circle" wrapperStyle={{fontSize: '12px', paddingTop: '20px'}} />
                   <Line yAxisId="left" type="monotone" dataKey="systolic" stroke="#ef4444" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} name="Systolic BP" />
                   <Line yAxisId="left" type="monotone" dataKey="diastolic" stroke="#f87171" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} name="Diastolic BP" />
                   <Line yAxisId="left" type="monotone" dataKey="pulse" stroke="#f59e0b" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} name="Heart Rate" />
                   <Line yAxisId="left" type="monotone" dataKey="temperature" stroke="#3b82f6" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} name="Temperature °C" />
                   <Line yAxisId="right" type="monotone" dataKey="spO2" stroke="#10b981" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} name="SpO2 %" />
                 </LineChart>
               </ResponsiveContainer>
             ) : (
                <div className="h-full flex items-center justify-center text-slate-400">No Vitals Tracked Yet</div>
             )}
           </div>
        )}

        {activeTab === 'notes' && (
           <div className="space-y-6">
              {notes.length === 0 ? (
                 <div className="py-12 text-center text-slate-400">No clinical notes recorded.</div>
              ) : (
                 notes.map((note) => (
                    <div key={note.id} className="bg-white border shadow-sm border-slate-200 rounded-xl p-5 relative overflow-hidden group">
                       <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
                       <div className="flex justify-between items-start mb-3 pl-2">
                          <span className="text-sm font-bold text-slate-700">{new Date(note.created_at).toLocaleString([], {dateStyle:'medium', timeStyle:'short'})}</span>
                          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-bold">{note.author_name}</span>
                       </div>
                       <p className="text-slate-600 whitespace-pre-wrap leading-relaxed text-sm pl-2">{note.note_text}</p>
                    </div>
                 ))
              )}
           </div>
        )}

        {activeTab === 'appointments' && (
           <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="border-b text-xs font-semibold text-slate-500 uppercase">
                    <th className="py-4 px-4">Date & Time</th>
                    <th className="py-4 px-4">Department / Doctor</th>
                    <th className="py-4 px-4">Status</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {appointments.map(a => (
                    <tr key={a.id} className="hover:bg-slate-50">
                       <td className="py-4 px-4 font-medium text-slate-800">{a.date} @ {a.time_slot.substring(0,5)}</td>
                       <td className="py-4 px-4 text-slate-600">Dr. {a.doctor_name}</td>
                       <td className="py-4 px-4">
                          <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full text-xs font-bold">{a.status}</span>
                       </td>
                    </tr>
                 ))}
               </tbody>
             </table>
           </div>
        )}

        {['history', 'family', 'docs'].includes(activeTab) && (
           <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 pt-12">
              <Folder className="h-16 w-16 opacity-20" />
              <p>This module contains no external records.</p>
           </div>
        )}
      </div>

      {showNoteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Mock OS Window Header */}
            <div className="px-4 py-3 bg-[#0f172a] flex justify-between items-center text-white select-none">
               <div className="flex items-center gap-3">
                 {/* Traffic Lights */}
                 <div className="flex gap-1.5">
                   <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                   <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                   <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                 </div>
                 <h3 className="text-sm font-semibold text-slate-200">{patient.full_name} - AI Session Notes</h3>
               </div>
               <button onClick={() => setShowNoteModal(false)} className="text-slate-400 hover:text-white transition"><X className="h-4 w-4"/></button>
            </div>
            
            <div className="p-0 grid grid-cols-[1fr_300px] bg-white h-[600px]">
               <div className="p-6 flex flex-col h-full overflow-y-auto">
                 <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                   <div className="flex items-center gap-3">
                     <span className="p-2 rounded-lg bg-blue-50 text-blue-600"><FileText className="h-5 w-5" /></span>
                     <h4 className="font-bold text-slate-800">Transcribe Scribe</h4>
                   </div>
                   <button onClick={generateAISOAP} disabled={aiLoading || !rawAiInput} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition">
                      {aiLoading ? 'Synthesizing...' : 'Generate Format'}
                   </button>
                 </div>
                 <textarea value={rawAiInput} onChange={e=>setRawAiInput(e.target.value)} className="w-full flex-1 p-0 border-0 focus:ring-0 text-slate-700 resize-none outline-none leading-relaxed" placeholder="Type or paste the raw conversation transcript here...&#10;&#10;e.g. 'Patient came in today complaining about headaches and fatigue for the last 3 days...'"></textarea>
               </div>
               
               <div className="border-l border-slate-200 bg-slate-50 flex flex-col h-full">
                 <div className="p-4 border-b border-slate-200 flex items-center gap-2 bg-white sticky top-0">
                    <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Structured Output</span>
                 </div>
                 <form onSubmit={handleAddNote} className="flex-1 flex flex-col overflow-y-auto p-4 space-y-4">
                   <textarea required value={noteForm} onChange={e=>setNoteForm(e.target.value)} className="w-full flex-1 p-3 rounded-xl border border-slate-200 text-sm leading-relaxed bg-white shadow-sm" placeholder="Subjective:&#10;Objective:&#10;Assessment:&#10;Plan:"></textarea>
                   <button type="submit" disabled={submitting || !noteForm} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-700 hover:shadow-lg transition transform disabled:opacity-50">Complete Session</button>
                 </form>
               </div>
            </div>
          </div>
        </div>
      )}

      {showVitalsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
               <h3 className="text-lg font-bold text-slate-900">Record Vitals</h3>
               <button onClick={() => setShowVitalsModal(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5"/></button>
            </div>
            <form onSubmit={handleAddVitals} className="p-6 space-y-5">
               <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Temp (°C)</label>
                     <input type="number" step="0.1" required value={vitalsForm.temperature} onChange={e=>setVitalsForm({...vitalsForm, temperature: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-200" placeholder="36.5" />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Pulse (bpm)</label>
                     <input type="number" required value={vitalsForm.pulse} onChange={e=>setVitalsForm({...vitalsForm, pulse: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-200" placeholder="72" />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Blood Pressure</label>
                     <input type="text" required value={vitalsForm.blood_pressure} onChange={e=>setVitalsForm({...vitalsForm, blood_pressure: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-200" placeholder="120/80" />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">SpO2 (%)</label>
                     <input type="number" required value={vitalsForm.oxygen_saturation} onChange={e=>setVitalsForm({...vitalsForm, oxygen_saturation: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-200" placeholder="98" />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Resp. Rate</label>
                     <input type="number" required value={vitalsForm.respiratory_rate} onChange={e=>setVitalsForm({...vitalsForm, respiratory_rate: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-200" placeholder="16" />
                   </div>
               </div>
               <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setShowVitalsModal(false)} className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancel</button>
                  <button type="submit" disabled={submitting} className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50">Save Vitals</button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
