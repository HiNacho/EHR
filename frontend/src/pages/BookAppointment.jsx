import { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Clock, User as UserIcon, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function BookAppointment() {
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [reason, setReason] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);
  const [success, setSuccess] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // We would normally have a specific API to get doctors or users by role
    // For now, assume we just show all doctors. But wait, we didn't add an API for that.
    // Let's hardcode the demo doctor for demonstration if we can't fetch them easily,
    // or just assume we have 1 doctor. Actually, let's fetch doctor availabilities.
    const fetchDeps = async () => {
      try {
        const dRes = await axios.get('http://localhost:8001/api/patients/departments/');
        setDepartments(dRes.data);
        
        // Fetch availabilities to extract unique doctors
        const avRes = await axios.get('http://localhost:8001/api/appointments/availability/');
        const uniqueDocs = [];
        const seenDocs = new Set();
        avRes.data.forEach(avail => {
          if (!seenDocs.has(avail.doctor)) {
            seenDocs.add(avail.doctor);
            uniqueDocs.push(avail.doctor_detail);
          }
        });
        setDoctors(uniqueDocs);
      } catch (err) {
        console.error(err);
      }
    };
    fetchDeps();
  }, []);

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      setLoadingSlots(true);
      axios.get(`http://localhost:8001/api/appointments/list/available_slots/?doctor=${selectedDoctor}&date=${selectedDate}`)
        .then(res => {
          setAvailableSlots(res.data.available_slots || []);
        })
        .catch(err => {
          console.error(err);
          setAvailableSlots([]);
        })
        .finally(() => setLoadingSlots(false));
    }
  }, [selectedDoctor, selectedDate]);

  const handleBook = async () => {
    if (!selectedDept || !selectedDoctor || !selectedDate || !selectedSlot) return;
    setBooking(true);
    
    try {
      // Need patient ID. If patient is logged in, fetch their patient profile ID first.
      const pRes = await axios.get('http://localhost:8001/api/patients/list/');
      const patientData = pRes.data[0]; // Assuming user=PATIENT only has 1 patient profile mapped
      
      await axios.post('http://localhost:8001/api/appointments/list/', {
        patient: patientData.id,
        doctor: selectedDoctor,
        department: selectedDept,
        date: selectedDate,
        time_slot: selectedSlot,
        reason: reason
      });
      setSuccess(true);
    } catch (err) {
      alert("Error booking appointment: " + (err.response?.data?.join(',') || ""));
    } finally {
      setBooking(false);
    }
  };

  if (success) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center py-20 flex flex-col items-center">
        <CheckCircle2 className="h-20 w-20 text-teal-500 mb-6" />
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Appointment Confirmed!</h1>
        <p className="text-lg text-slate-600 mb-8">Your appointment has been successfully scheduled.</p>
        <button onClick={() => navigate('/dashboard')} className="bg-teal-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-teal-700 transition">
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Book Appointment</h1>
      <p className="text-slate-600 mb-8">Schedule a new consultation by following the steps below.</p>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 space-y-8">
        
        {/* Step 1 */}
        <div>
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
            <span className="flex items-center justify-center bg-teal-100 text-teal-700 h-6 w-6 rounded-full text-sm">1</span>
            Select Department
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {departments.map((dept) => (
              <button 
                key={dept.id}
                onClick={() => setSelectedDept(dept.id)}
                className={`p-4 rounded-xl border text-left transition ${selectedDept === dept.id ? 'border-teal-500 bg-teal-50 ring-1 ring-teal-500' : 'border-slate-200 hover:border-teal-300'}`}
              >
                <div className="font-semibold text-slate-900">{dept.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2 */}
        {selectedDept && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4 cursor-pointer pt-6 border-t border-slate-100">
              <span className="flex items-center justify-center bg-teal-100 text-teal-700 h-6 w-6 rounded-full text-sm">2</span>
              Choose Doctor
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {doctors.map((doc) => (
                <button 
                  key={doc.id}
                  onClick={() => setSelectedDoctor(doc.id)}
                  className={`p-4 rounded-xl border flex items-center gap-4 transition ${selectedDoctor === doc.id ? 'border-teal-500 bg-teal-50 ring-1 ring-teal-500' : 'border-slate-200 hover:border-teal-300'}`}
                >
                  <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                    <UserIcon className="h-6 w-6" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-slate-900">Dr. {doc.last_name || doc.email.split('@')[0]}</div>
                    <div className="text-sm text-slate-500">Available Mon-Fri</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3 */}
        {selectedDoctor && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4 pt-6 border-t border-slate-100">
              <span className="flex items-center justify-center bg-teal-100 text-teal-700 h-6 w-6 rounded-full text-sm">3</span>
              Date & Time
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Select Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input 
                    type="date"
                    value={selectedDate}
                    onChange={(e) => { setSelectedDate(e.target.value); setSelectedSlot(''); }}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Available Slots</label>
                {loadingSlots ? (
                  <div className="text-slate-500 flex items-center gap-2"><Clock className="animate-spin h-4 w-4" /> Loading...</div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {availableSlots.length > 0 ? availableSlots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2 px-3 text-sm font-medium rounded-lg border transition-all ${
                          selectedSlot === slot ? 'bg-teal-600 text-white border-teal-600' : 'bg-white border-slate-200 text-slate-700 hover:border-teal-500 hover:text-teal-700'
                        }`}
                      >
                        {slot}
                      </button>
                    )) : (
                      selectedDate && <div className="col-span-3 text-red-500 text-sm">No slots available on this date.</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 4 */}
        {selectedSlot && (
           <div className="animate-in fade-in slide-in-from-top-4 duration-500">
             <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4 pt-6 border-t border-slate-100">
              <span className="flex items-center justify-center bg-teal-100 text-teal-700 h-6 w-6 rounded-full text-sm">4</span>
              Reason for Visit (Optional)
            </h3>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Briefly describe your symptoms or reason for appointment..."
              className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 min-h-[100px]"
            ></textarea>
            
            <div className="mt-8 flex justify-end">
              <button 
                onClick={handleBook}
                disabled={booking}
                className="bg-teal-600 text-white px-8 py-3 rounded-xl font-semibold text-lg hover:bg-teal-700 transition shadow-lg shadow-teal-600/30 disabled:opacity-50"
              >
                {booking ? 'Booking...' : 'Confirm Appointment'}
              </button>
            </div>
           </div>
        )}

      </div>
    </div>
  );
}
