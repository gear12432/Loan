import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bell, User as UserIcon } from 'lucide-react';
import { UserProfile } from '../types';

interface AppHeaderProps {
  profile: UserProfile | null;
  unreadNotificationsCount?: number;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  profile,
  unreadNotificationsCount = 0,
}) => {
  const navigate = useNavigate();

  return (
    <header className="bg-[#079889] text-white pt-6 pb-12 px-4 rounded-b-[28px] shadow-md relative">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Left: Profile Picture & User Name */}
        <Link to="/profile" className="flex items-center space-x-2.5 group">
          <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/40 overflow-hidden flex items-center justify-center shrink-0 group-hover:border-white transition-colors">
            {profile?.profileImageUrl ? (
              <img
                src={profile.profileImageUrl}
                alt={profile.fullName || 'User Profile'}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <UserIcon className="w-5 h-5 text-white" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-teal-100 font-medium">Hello,</span>
            <span className="text-sm font-bold truncate max-w-[110px] sm:max-w-[140px]">
              {profile?.fullName || 'Business Owner'}
            </span>
          </div>
        </Link>

        {/* Center: Business Name */}
        <div className="text-center px-2 flex-1">
          <h1 className="text-base font-extrabold tracking-wide uppercase truncate text-teal-50 max-w-[120px] sm:max-w-[160px] mx-auto">
            {profile?.businessName || 'Small Finance'}
          </h1>
        </div>

        {/* Right: Notification Bell */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => navigate('/notifications')}
            className="relative p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
            title="Notifications"
          >
            <Bell className="w-5 h-5 text-white" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-[#079889] animate-pulse">
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
