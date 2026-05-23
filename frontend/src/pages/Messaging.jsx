import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, UserCircle, Clock, Plus, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Messaging() {
  const [threads, setThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [directory, setDirectory] = useState([]);
  const [composeForm, setComposeForm] = useState({ recipient_id: '', subject: '', content: '' });
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchThreads();
  }, []);

  const fetchThreads = async () => {
    try {
      const res = await axios.get('http://localhost:8001/api/messaging/threads/');
      setThreads(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchDirectory = async () => {
    try {
      const res = await axios.get('http://localhost:8001/api/messaging/threads/directory/');
      setDirectory(res.data);
    } catch (err) { console.error(err); }
  };

  const loadThread = async (id) => {
    setActiveThread(threads.find(t => t.id === id));
    try {
      const res = await axios.get(`http://localhost:8001/api/messaging/threads/${id}/messages/`);
      setMessages(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !activeThread) return;
    try {
      const res = await axios.post(`http://localhost:8001/api/messaging/threads/${activeThread.id}/add_message/`, { content: replyText });
      setMessages([...messages, res.data]);
      setReplyText('');
      fetchThreads(); // to bump the thread sorting
    } catch (err) { alert("Error sending message"); }
  };

  const handleComposeSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await axios.post('http://localhost:8001/api/messaging/threads/start_thread/', composeForm);
      setThreads([res.data, ...threads]); // Prepend to inbox
      setShowComposeModal(false);
      setComposeForm({ recipient_id: '', subject: '', content: '' });
      loadThread(res.data.id); // Auto open it
    } catch (err) {
      alert("Error starting thread: " + JSON.stringify(err.response?.data || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const openComposeMenu = () => {
     fetchDirectory();
     setShowComposeModal(true);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-[calc(100vh-2rem)] flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Messaging Secure Portal</h1>
          <p className="mt-1 text-slate-500">HIPAA-compliant encrypted transit logs.</p>
        </div>
        <button onClick={openComposeMenu} className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl font-medium transition flex items-center gap-2 shadow-sm">
           <Plus className="h-5 w-5" /> New Message
        </button>
      </div>

      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 flex overflow-hidden">
        {/* Threads Sidebar */}
        <div className="w-1/3 border-r border-slate-100 bg-slate-50 flex flex-col">
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-700">Active Conversations</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {threads.map(thread => (
              <div 
                key={thread.id} 
                onClick={() => loadThread(thread.id)}
                className={`p-4 border-b border-slate-100 cursor-pointer transition-colors ${activeThread?.id === thread.id ? 'bg-teal-50 border-teal-200' : 'hover:bg-slate-100'}`}
              >
                <div className="font-semibold text-slate-800 truncate">{thread.subject}</div>
                <div className="text-xs text-slate-500 mt-1 truncate">
                   With: {thread.participant_emails.filter(e => e !== user.email).join(', ')}
                </div>
                {thread.recent_message && (
                   <div className="text-sm text-slate-400 mt-2 truncate italic">
                     {thread.recent_message.sender_email === user.email ? 'You: ' : ''}{thread.recent_message.content}
                   </div>
                )}
              </div>
            ))}
            {threads.length === 0 && <div className="p-8 text-center text-slate-400 text-sm">No active threads found.</div>}
          </div>
        </div>

        {/* Chat Pane */}
        <div className="w-2/3 flex flex-col bg-white overflow-hidden">
          {activeThread ? (
            <>
              <div className="p-4 border-b border-slate-100 bg-white shadow-sm z-10 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg text-slate-900">{activeThread.subject}</h3>
                  <div className="text-sm text-slate-500">{activeThread.participant_emails.join(', ')}</div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.is_me ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl p-4 shadow-sm ${msg.is_me ? 'bg-teal-600 text-white rounded-tr-none' : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none'}`}>
                      {!msg.is_me && <div className="text-xs font-semibold text-teal-600 mb-1">{msg.sender_name || msg.sender_email}</div>}
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      <div className={`text-[10px] mt-2 text-right ${msg.is_me ? 'text-teal-100' : 'text-slate-400'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-4 bg-white border-t border-slate-100">
                <form onSubmit={handleSend} className="flex gap-2">
                  <input type="text" value={replyText} onChange={e=>setReplyText(e.target.value)} placeholder="Type a secure message..." className="flex-1 rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500" />
                  <button type="submit" disabled={!replyText.trim()} className="bg-teal-600 text-white px-6 py-3 rounded-xl hover:bg-teal-700 transition disabled:opacity-50"><Send className="h-5 w-5" /></button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <UserCircle className="h-16 w-16 mb-4 opacity-20" />
              <p>Select a thread to view messages.</p>
            </div>
          )}
        </div>
      </div>

      {/* COMPOSE MODAL */}
      {showComposeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
               <h3 className="text-lg font-bold text-slate-900">Compose Secure Message</h3>
               <button onClick={() => setShowComposeModal(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5"/></button>
            </div>
            <form onSubmit={handleComposeSubmit} className="p-6 space-y-4">
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">To: {user.role === 'PATIENT' ? 'Provider' : 'Hospital Staff'}</label>
                  <select required value={composeForm.recipient_id} onChange={e=>setComposeForm({...composeForm, recipient_id: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-200 bg-white">
                     <option value="" disabled>Select a secure contact...</option>
                     {directory.map(u => (
                        <option key={u.id} value={u.id}>{u.name} — {u.role}</option>
                     ))}
                  </select>
               </div>
               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Subject / Thread Name</label>
                 <input type="text" required value={composeForm.subject} onChange={e=>setComposeForm({...composeForm, subject: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-200" placeholder="Medication Refill Request..." />
               </div>
               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Secure Message Payload</label>
                 <textarea required value={composeForm.content} onChange={e=>setComposeForm({...composeForm, content: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 min-h-[120px] text-sm" placeholder="Write your message here..."></textarea>
               </div>
               <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowComposeModal(false)} className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancel</button>
                  <button type="submit" disabled={submitting} className="px-6 py-2 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition disabled:opacity-50">Initialize Thread</button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
