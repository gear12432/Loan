import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import { LoadingIndicator } from '../components/LoadingIndicator';
import {
  ArrowLeft,
  Bell,
  CheckCheck,
  Check,
  Clock,
  Inbox
} from 'lucide-react';

export const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications(user?.uid);

  return (
    <div className="min-h-screen bg-[#EDF1F7] pb-12">
      {/* Header */}
      <div className="bg-[#079889] text-white pt-6 pb-12 px-4 rounded-b-[28px] shadow-md">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-base font-bold uppercase tracking-wider">Notifications</h1>
          {unreadCount > 0 ? (
            <button
              onClick={markAllAsRead}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-xs font-bold flex items-center space-x-1"
              title="Mark all as read"
            >
              <CheckCheck className="w-4 h-4 text-white" />
            </button>
          ) : (
            <div className="w-9" />
          )}
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-6 space-y-4">
        {/* Unread Bar */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-teal-50 rounded-xl text-[#079889]">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900">Notifications Desk</h2>
              <p className="text-[11px] text-slate-500">
                {unreadCount === 0 ? 'All caught up!' : `${unreadCount} unread message(s)`}
              </p>
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="bg-teal-50 hover:bg-teal-100 text-[#079889] text-xs font-bold px-3 py-1.5 rounded-xl transition-colors flex items-center space-x-1"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark All Read</span>
            </button>
          )}
        </div>

        {/* List */}
        {loading ? (
          <LoadingIndicator message="Syncing notifications from Firestore..." />
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-200/80 shadow-sm space-y-3">
            <Inbox className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No Notifications</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Real-time customer status changes and updates will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {notifications.map((notif) => (
              <div
                key={notif.id || notif.notificationId}
                onClick={() => notif.id && !notif.isRead && markAsRead(notif.id)}
                className={`p-4 rounded-2xl border transition-all ${
                  notif.isRead
                    ? 'bg-white border-slate-200/60 opacity-80'
                    : 'bg-white border-[#079889]/30 shadow-md ring-1 ring-[#079889]/20 cursor-pointer'
                }`}
              >
                <div className="flex items-start justify-between space-x-3">
                  <div className="flex items-start space-x-3">
                    <div
                      className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                        notif.isRead ? 'bg-slate-300' : 'bg-[#079889] animate-pulse'
                      }`}
                    />
                    <div>
                      <h3
                        className={`text-xs font-bold ${
                          notif.isRead ? 'text-slate-700' : 'text-slate-900'
                        }`}
                      >
                        {notif.title}
                      </h3>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                        {notif.message}
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1 flex items-center space-x-1 font-mono">
                        <Clock className="w-3 h-3" />
                        <span>
                          {notif.createdAt
                            ? new Date(
                                (notif.createdAt as any)?.seconds * 1000 || Date.now()
                              ).toLocaleString()
                            : 'Just now'}
                        </span>
                      </span>
                    </div>
                  </div>

                  {!notif.isRead && notif.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (notif.id) markAsRead(notif.id);
                      }}
                      className="p-1.5 rounded-full bg-slate-100 hover:bg-teal-50 text-slate-400 hover:text-[#079889] transition-colors shrink-0"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
