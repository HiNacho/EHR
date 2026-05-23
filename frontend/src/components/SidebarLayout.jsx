import { useState, useEffect } from 'react';
import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, Calendar, LogOut, Activity, DollarSign, MessageSquare } from 'lucide-react';

export default function SidebarLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
     if (user) {
        axios.get('http://localhost:8001/api/messaging/threads/unread_count/')
           .then(res => setUnreadCount(res.data.unread_count))
           .catch(() => {});
     }
  }, [user, location.pathname]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const getNavItems = () => {
    const items = [];
    if (user.role !== 'PATIENT') {
      items.push(
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Calendar', path: '/calendar', icon: Calendar },
        { name: 'Patients', path: '/patients', icon: Users },
        { name: 'Billing', path: '/billing', icon: DollarSign },
        { name: 'Messaging', path: '/messaging', icon: MessageSquare },
      );
    } else {
      items.push(
        { name: 'My Portal', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Messaging', path: '/messaging', icon: MessageSquare },
      );
    }
    return items;
  };

  const navItems = getNavItems();

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <div className="w-64 bg-[#0f172a] border-r border-[#1e293b] flex flex-col shadow-xl z-10">
        <div className="p-6 flex items-center gap-3 text-white">
          <div className="bg-blue-600 p-2 rounded-xl"><Activity className="h-6 w-6 text-white" /></div>
          <span className="text-xl font-bold tracking-tight">NachoEHR</span>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center justify-between px-4 py-3 rounded-lg font-medium transition-colors ${
                  active 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-slate-400 hover:bg-[#1e293b] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5" />
                  {item.name}
                </div>
                {item.name.includes('Messaging') && unreadCount > 0 && (
                   <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse shadow-sm">
                     {unreadCount}
                   </span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-[#1e293b]">
          <div className="px-4 py-3 text-sm flex flex-col mb-2">
            <span className="font-semibold text-slate-200">{user.email}</span>
            <span className="text-xs text-blue-400 uppercase font-bold tracking-wider">{user.role}</span>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 rounded-lg transition-colors font-medium"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
