import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { addCustomer, generateUniqueCustomerId } from '../services/customerService';
import { CustomerStatus, PaymentFrequency } from '../types';
import { compressImage } from '../utils/imageCompressor';
import {
  ArrowLeft,
  User,
  Phone,
  Hash,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  RefreshCw,
  Camera,
  MapPin,
  Calculator,
  Percent
} from 'lucide-react';

import { FloatingInput } from '../components/FloatingInput';

export const AddCustomer: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form States
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [address, setAddress] = useState('');
  const [loanAmount, setLoanAmount] = useState<string>('');
  const [interestAmount, setInterestAmount] = useState<string>('');
  
  // Date & Time defaults (Auto initialized in background)
  const todayDate = new Date().toISOString().split('T')[0];
  const currentTime = new Date().toTimeString().slice(0, 5);
  const [loanDate] = useState(todayDate);
  const [loanTime] = useState(currentTime);

  // Profile Picture File Upload
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [previewFileName, setPreviewFileName] = useState('');

  // Repayment Frequency (3 Single Line Bordered Boxes)
  const [frequency, setFrequency] = useState<PaymentFrequency>('daily');

  // Status (Default Pending)
  const [status] = useState<CustomerStatus>('pending');

  // UI States
  const [loading, setLoading] = useState(false);
  const [generatingId, setGeneratingId] = useState(true);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Auto-calculated Sub Total Loan Amount (Principal + Interest)
  const numericPrincipal = parseFloat(loanAmount) || 0;
  const numericInterest = parseFloat(interestAmount) || 0;
  const subTotalLoanAmount = numericPrincipal + numericInterest;

  // Auto-generate customer ID on mount (e.g. FG32655)
  useEffect(() => {
    handleGenerateId();
  }, []);

  const handleGenerateId = async () => {
    setGeneratingId(true);
    const id = await generateUniqueCustomerId();
    setCustomerId(id);
    setGeneratingId(false);
  };

  // Handle Image File Selection from Device with Automatic Compression
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, WEBP).');
      return;
    }

    setPreviewFileName(file.name);
    try {
      const compressedDataUrl = await compressImage(file, 200, 200, 0.6);
      setProfileImageUrl(compressedDataUrl);
      setError('');
    } catch (err) {
      console.error('Image compression error:', err);
      setError('Failed to process image file. Please try another photo.');
    }
  };

  const handleRemoveImage = () => {
    setProfileImageUrl('');
    setPreviewFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user?.uid) {
      setError('You must be logged in to create a customer.');
      return;
    }

    if (!customerName.trim()) {
      setError('Customer Name is required.');
      return;
    }

    if (!mobileNumber.trim()) {
      setError('Mobile Number is required.');
      return;
    }

    if (numericPrincipal <= 0) {
      setError('Please enter a valid loan amount.');
      return;
    }

    try {
      setLoading(true);

      const avatarUrl =
        profileImageUrl ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(customerName.trim())}`;

      const finalTotalAmount = subTotalLoanAmount > 0 ? subTotalLoanAmount : numericPrincipal;

      await addCustomer({
        customerId: customerId || `FG${Math.floor(10000 + Math.random() * 90000)}`,
        ownerUid: user.uid,
        customerName: customerName.trim(),
        mobileNumber: mobileNumber.trim(),
        address: address.trim(),
        amount: finalTotalAmount,
        principalAmount: numericPrincipal,
        interestAmount: numericInterest,
        loanDate,
        loanTime,
        frequency,
        status,
        profileImageUrl: avatarUrl,
      });

      // Show Toast Notification
      setToastMessage(`Customer ${customerId} saved successfully!`);

      // Wait brief moment for user to see Toast, then return Home
      setTimeout(() => {
        navigate('/');
      }, 1200);
    } catch (err: any) {
      console.error('Failed to create customer:', err);
      setError(err.message || 'Failed to save customer to Cloud Firestore.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EDF1F7] flex flex-col pb-12">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#079889] text-white px-5 py-3 rounded-full shadow-2xl flex items-center space-x-2 text-sm font-bold animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-teal-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Full-Screen App Header */}
      <div className="bg-[#079889] text-white pt-6 pb-8 px-4 rounded-b-[24px] shadow-md w-full">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-lg font-bold tracking-wide">Add New Customer</h1>
          <div className="w-9" />
        </div>
      </div>

      {/* Full Width Container */}
      <div className="w-full max-w-xl mx-auto px-3 sm:px-6 -mt-4 flex-1">
        <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-xl border border-slate-200/80">
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start space-x-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 1. Customer ID (Auto Generated FG32655) */}
            <div className="relative pt-1">
              <div className="flex justify-end mb-1">
                <button
                  type="button"
                  onClick={handleGenerateId}
                  className="text-[11px] font-bold text-[#079889] hover:underline flex items-center space-x-1"
                >
                  <RefreshCw className={`w-3 h-3 ${generatingId ? 'animate-spin' : ''}`} />
                  <span>Regenerate ID</span>
                </button>
              </div>
              <FloatingInput
                label="Customer ID"
                required
                readOnly
                value={customerId}
                icon={<Hash className="w-4 h-4" />}
              />
            </div>

            {/* 2. Customer Name */}
            <FloatingInput
              label="Customer Name"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              icon={<User className="w-4 h-4" />}
            />

            {/* 3. Customer Mobile Number */}
            <FloatingInput
              label="Customer Mobile Number"
              required
              type="tel"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              placeholder="+91 98765 43210"
              icon={<Phone className="w-4 h-4" />}
            />

            {/* 4. Customer Address */}
            <FloatingInput
              label="Customer Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street, village or shop address"
              icon={<MapPin className="w-4 h-4" />}
            />

            {/* 5. Loan Amount (Principal Amount) in Indian Rupee (₹) */}
            <FloatingInput
              label="Loan Amount (₹)"
              required
              type="number"
              min="1"
              step="1"
              value={loanAmount}
              onChange={(e) => setLoanAmount(e.target.value)}
              placeholder="e.g. 5000"
              icon={<span className="text-[#079889] font-bold text-sm">₹</span>}
            />

            {/* 6. Total Interest Rate Amount (₹) */}
            <FloatingInput
              label="Total Interest Rate Amount (₹)"
              type="number"
              min="0"
              step="1"
              value={interestAmount}
              onChange={(e) => setInterestAmount(e.target.value)}
              placeholder="e.g. 500"
              icon={<Percent className="w-4 h-4 text-[#079889]" />}
            />

            {/* 7. Auto-Calculated Sub Total Loan Amount (Auto Filled) */}
            <div className="p-3.5 bg-teal-50/80 border border-teal-200 rounded-2xl flex items-center justify-between mt-2">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-[#079889] text-white rounded-xl">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-teal-800">
                    Sub Total Loan Amount
                  </span>
                  <span className="text-[10px] text-teal-600 font-medium">
                    Auto-calculated (Loan + Interest)
                  </span>
                </div>
              </div>
              <div className="text-right font-mono font-extrabold text-[#079889] text-base sm:text-lg">
                ₹{subTotalLoanAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>

            {/* 7. Profile Picture Choice File Button */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Profile Picture
              </label>

              {/* Hidden Native File Input */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="flex items-center space-x-3">
                {/* Choose File Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 transition-all flex items-center space-x-2 shrink-0 active:scale-95"
                >
                  <Camera className="w-4 h-4 text-[#079889]" />
                  <span>Choose File</span>
                </button>

                {/* Selected File Status / Preview Avatar */}
                {profileImageUrl ? (
                  <div className="flex items-center space-x-2 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-xl min-w-0 flex-1">
                    <img
                      src={profileImageUrl}
                      alt="Preview"
                      className="w-7 h-7 rounded-full object-cover border border-[#079889] shrink-0"
                    />
                    <span className="text-xs font-medium text-slate-700 truncate">
                      {previewFileName || 'Image selected'}
                    </span>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="p-1 text-slate-400 hover:text-red-500 shrink-0 ml-auto"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 font-medium italic">
                    No file chosen
                  </span>
                )}
              </div>
            </div>

            {/* 8. 3 Single Line Border Boxes for Frequency (Per Day / Per Week / Per Month) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Repayment Frequency *
              </label>

              <div className="grid grid-cols-3 gap-2">
                {/* Per Day */}
                <button
                  type="button"
                  onClick={() => setFrequency('daily')}
                  className={`py-3 px-2 rounded-xl text-xs font-bold text-center border-2 transition-all ${
                    frequency === 'daily'
                      ? 'border-[#079889] bg-teal-50 text-[#079889] shadow-sm ring-2 ring-[#079889]/20'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  Per Day
                </button>

                {/* Per Week */}
                <button
                  type="button"
                  onClick={() => setFrequency('weekly')}
                  className={`py-3 px-2 rounded-xl text-xs font-bold text-center border-2 transition-all ${
                    frequency === 'weekly'
                      ? 'border-[#079889] bg-teal-50 text-[#079889] shadow-sm ring-2 ring-[#079889]/20'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  Per Week
                </button>

                {/* Per Month */}
                <button
                  type="button"
                  onClick={() => setFrequency('monthly')}
                  className={`py-3 px-2 rounded-xl text-xs font-bold text-center border-2 transition-all ${
                    frequency === 'monthly'
                      ? 'border-[#079889] bg-teal-50 text-[#079889] shadow-sm ring-2 ring-[#079889]/20'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  Per Month
                </button>
              </div>
            </div>

            {/* 9. Default Selected Status: Pending */}
            <div className="pt-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Status
              </label>
              <div className="w-full py-2.5 px-4 bg-amber-500 text-white font-bold text-xs rounded-xl flex items-center space-x-2 shadow-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-white shrink-0" />
                <span>Pending (Selected)</span>
              </div>
            </div>

            {/* 10. Save Button with Circular Loading Spinner & Toast */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#079889] hover:bg-[#067f72] text-white font-bold py-3.5 px-4 rounded-2xl shadow-lg shadow-[#079889]/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-75 active:scale-98"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                    <span>Saving Record...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Save Customer</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
