import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { updateUserProfile, subscribeToBusinessSettings } from '../services/userService';
import { compressImage } from '../utils/imageCompressor';
import {
  ArrowLeft,
  User,
  Building2,
  Phone,
  Mail,
  MapPin,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Camera,
  Loader2
} from 'lucide-react';

import { FloatingInput } from '../components/FloatingInput';

export const ProfileSettings: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, logout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState('');

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || '');
      setBusinessName(profile.businessName || '');
      setMobileNumber(profile.mobileNumber || '');
      setProfileImageUrl(profile.profileImageUrl || '');
    }
  }, [profile]);

  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribe = subscribeToBusinessSettings(user.uid, (settings) => {
      if (settings?.businessAddress) {
        setBusinessAddress(settings.businessAddress);
      }
    });
    return () => unsubscribe();
  }, [user?.uid]);

  // Handle Image File Selection from device with lightweight JPEG compression
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, WEBP).');
      return;
    }

    try {
      const compressedDataUrl = await compressImage(file, 200, 200, 0.6);
      setProfileImageUrl(compressedDataUrl);
      setError('');
    } catch (err) {
      console.error('Image compression error:', err);
      setError('Failed to process image file. Please try another photo.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!user?.uid) return;

    if (!fullName.trim() || !businessName.trim() || !mobileNumber.trim()) {
      setError('Full Name, Business Name, and Mobile Number are required.');
      return;
    }

    try {
      setSaving(true);

      // Wait 3 seconds with round progress spinner as requested
      await new Promise((resolve) => setTimeout(resolve, 3000));

      await updateUserProfile(user.uid, {
        fullName: fullName.trim(),
        businessName: businessName.trim(),
        mobileNumber: mobileNumber.trim(),
        profileImageUrl: profileImageUrl.trim(),
      });

      setSuccess('Profile and Business settings updated successfully in Cloud Firestore!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#EDF1F7] pb-12">
      {/* Toast Notification Banner */}
      {success && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#079889] text-white px-5 py-3 rounded-full shadow-2xl flex items-center space-x-2 text-xs font-bold animate-bounce max-w-sm text-center">
          <CheckCircle2 className="w-5 h-5 text-teal-200 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-[#079889] text-white pt-6 pb-12 px-4 rounded-b-[28px] shadow-md">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-base font-bold uppercase tracking-wider">Business Profile</h1>
          <button
            onClick={handleLogout}
            className="p-2 rounded-full bg-white/10 hover:bg-red-500/80 transition-colors"
            title="Log Out"
          >
            <LogOut className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-8 space-y-4">
        {/* Hidden File Input for Native Photo Selector */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleImageFileChange}
          className="hidden"
        />

        {/* Profile Card Header with Left Avatar, Camera Icon, 2 Line Text (Name & Email), and Right Business Name */}
        <div className="bg-white rounded-3xl p-5 shadow-xl border border-slate-200/80">
          <div className="flex items-center justify-between gap-3 text-left">
            {/* Left: Profile Picture + Camera Overlay + Two Line Text */}
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              {/* Profile Picture Container with Camera Icon Overlay */}
              <div className="relative shrink-0">
                <div className="w-16 h-16 rounded-full bg-teal-50 border-2 border-[#079889]/30 overflow-hidden flex items-center justify-center shadow-sm">
                  {profileImageUrl ? (
                    <img
                      src={profileImageUrl}
                      alt={fullName || 'Profile'}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <User className="w-8 h-8 text-[#079889]" />
                  )}
                </div>

                {/* Camera Icon Overlay Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 bg-[#079889] hover:bg-[#067f72] text-white p-1.5 rounded-full shadow-md border-2 border-white transition-transform active:scale-90"
                  title="Choose Profile Picture"
                >
                  <Camera className="w-3.5 h-3.5 text-white" />
                </button>
              </div>

              {/* Two Line Text: Name & Gmail ID */}
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-extrabold text-slate-900 truncate">
                  {fullName || 'Business Owner'}
                </h2>
                <p className="text-xs font-mono text-slate-500 truncate mt-0.5">
                  {user?.email || 'email@example.com'}
                </p>
              </div>
            </div>

            {/* Right Side: Business Name */}
            <div className="text-right shrink-0 max-w-[130px] sm:max-w-[160px]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                BUSINESS
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-[#079889] uppercase tracking-wide truncate block mt-0.5">
                {businessName || 'Small Finance'}
              </span>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <FloatingInput
              label="Full Name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              icon={<User className="w-4 h-4" />}
            />

            <FloatingInput
              label="Business Name"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              icon={<Building2 className="w-4 h-4" />}
            />

            <FloatingInput
              label="Mobile Number"
              required
              type="tel"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              icon={<Phone className="w-4 h-4" />}
            />

            <FloatingInput
              label="Business Address"
              value={businessAddress}
              onChange={(e) => setBusinessAddress(e.target.value)}
              placeholder="Official office/shop address"
              icon={<MapPin className="w-4 h-4" />}
            />

            <FloatingInput
              label="Profile Image URL"
              type="url"
              value={profileImageUrl}
              onChange={(e) => setProfileImageUrl(e.target.value)}
              placeholder="https://example.com/logo.jpg"
              icon={<ImageIcon className="w-4 h-4" />}
            />

            <FloatingInput
              label="Account Email (Read-Only)"
              readOnly
              type="email"
              value={user?.email || ''}
              icon={<Mail className="w-4 h-4" />}
            />

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-[#079889] hover:bg-[#067f72] text-white font-bold text-xs py-3.5 rounded-2xl shadow-lg shadow-[#079889]/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 active:scale-98"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                    <span>Saving Profile Changes...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save Profile Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Security & Logout Button */}
        <div className="pt-2">
          <button
            onClick={handleLogout}
            className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs py-3 rounded-2xl border border-red-200 transition-all flex items-center justify-center space-x-2"
          >
            <LogOut className="w-4 h-4 text-red-600" />
            <span>Sign Out of Account</span>
          </button>
        </div>
      </div>
    </div>
  );
};
