import { useState, useEffect } from 'react';
import axios from 'axios';
import { DollarSign, FileText, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Billing() {
  const [invoices, setInvoices] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const res = await axios.get('http://localhost:8001/api/billing/invoices/');
        setInvoices(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchInvoices();
  }, []);

  const totalRevenue = invoices.filter(i => i.status === 'PAID').reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
  const outstanding = invoices.filter(i => i.status !== 'PAID').reduce((acc, curr) => acc + parseFloat(curr.amount), 0);

  const markPaid = async (id) => {
    try {
      await axios.post(`http://localhost:8001/api/billing/invoices/${id}/mark_paid/`);
      setInvoices(invoices.map(i => i.id === id ? { ...i, status: 'PAID' } : i));
    } catch (err) {
      alert("Error marking paid");
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 h-full flex flex-col">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Revenue & Billing</h1>
        <p className="mt-1 text-slate-500">Manage patient accounts and financial analytics.</p>
      </div>

      {['ADMIN', 'DOCTOR'].includes(user.role) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-emerald-100 flex items-center gap-6">
            <div className="p-4 rounded-xl bg-emerald-50 text-emerald-600"><DollarSign className="h-8 w-8" /></div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Revenue Collected</p>
              <p className="mt-1 text-3xl font-semibold text-slate-900">${totalRevenue.toFixed(2)}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-amber-100 flex items-center gap-6">
            <div className="p-4 rounded-xl bg-amber-50 text-amber-600"><Clock className="h-8 w-8" /></div>
            <div>
              <p className="text-sm font-medium text-slate-500">Outstanding A/R</p>
              <p className="mt-1 text-3xl font-semibold text-slate-900">${outstanding.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-4 px-6">Invoice ID</th>
                <th className="py-4 px-6">Patient</th>
                <th className="py-4 px-6">Service</th>
                <th className="py-4 px-6">Amount</th>
                <th className="py-4 px-6">Status</th>
                {['ADMIN', 'DOCTOR'].includes(user.role) && <th className="py-4 px-6 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6 font-medium text-slate-900">INV-{inv.id.toString().padStart(4, '0')}</td>
                  <td className="py-4 px-6 text-slate-700">{inv.patient_name}</td>
                  <td className="py-4 px-6 text-slate-500">{inv.service_type}</td>
                  <td className="py-4 px-6 font-semibold text-slate-900">${parseFloat(inv.amount).toFixed(2)}</td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {inv.status}
                    </span>
                  </td>
                  {['ADMIN', 'DOCTOR'].includes(user.role) && (
                    <td className="py-4 px-6 text-right">
                      {inv.status !== 'PAID' && (
                        <button onClick={() => markPaid(inv.id)} className="text-teal-600 hover:text-teal-900 font-medium text-sm flex items-center justify-end gap-1 ml-auto">
                          <CheckCircle className="h-4 w-4" /> Mark Paid
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
