import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Search, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function PatientList() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await axios.get('http://localhost:8001/api/patients/list/');
        setPatients(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchPatients();
  }, []);

  const filtered = patients.filter(p => p.full_name.toLowerCase().includes(search.toLowerCase()) || p.hospital_id.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Patient Directory</h1>
          <p className="mt-2 text-slate-600">View and manage patient records.</p>
        </div>
        {['ADMIN'].includes(user.role) && (
          <button className="bg-teal-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-teal-700 transition">
            + New Patient
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center bg-slate-50/50">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input 
              type="text"
              placeholder="Search by name or ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Patient Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Hospital ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Demographics</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">View</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filtered.map((patient) => (
                <tr key={patient.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-slate-900">{patient.full_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                      {patient.hospital_id}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {patient.age} yrs • {patient.sex}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link to={`/patients/${patient.id}`} className="text-teal-600 hover:text-teal-900 flex items-center justify-end gap-1">
                      View <ChevronRight className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-slate-500">No patients found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
