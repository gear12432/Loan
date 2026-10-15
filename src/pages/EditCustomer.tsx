import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { subscribeToCustomerById, updateCustomer } from '../services/customerService';
import { CustomerStatus } from '../types';
import { LoadingIndicator } from '../components/LoadingIndicator';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Tag,
  CheckCircle2,
  AlertCircle,
  Hash,
  Image as ImageIcon
} from 'lucide-react';

import { FloatingInput } from '../components/FloatingInput';
import { FloatingTextarea } from '../components/FloatingTextarea';

export const EditCustomer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [customerName, setCustomerName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [referenceName, setReferenceName] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<CustomerStatus>('pending');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;

    const unsubscribe = subscribeToCustomerById(id, (data) => {
      if (data) {
        setCustomerName(data.customerName || '');
        setMobileNumber(data.mobileNumber || '');
        setEmail(data.email || '');
        setAddress(data.address || '');
        setCustomerId(data.customerId || '');
        setProfileImageUrl(data.profileImageUrl || '');
        setReferenceName(data.referenceName || '');
        setAmount(data.amount?.toString() || '0');
        setDescription(data.description || '');
        setStatus(data.status || 'pending');
        setNotes(data.notes || '');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!id || !user?.uid) {
      setError('Missing authentication session or record ID.');
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

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount < 0) {
      setError('Please enter a valid amount.');
      return;
    }

    try {
      setSaving(true);
      await updateCustomer(id, user.uid, {
        customerName: customerName.trim(),
        mobileNumber: mobileNumber.trim(),
        email: email.trim(),
        address: address.trim(),
        profileImageUrl: profileImageUrl.trim(),
        referenceName: referenceName.trim(),
        amount: numericAmount,
        description: description.trim(),
        status,
        notes: notes.trim(),
      });

      // On success, return to details screen
      navigate(`/customer/${id}`);
    } catch (err: any) {
      console.error('Failed to update customer:', err);
      // Preserve form values and show error
      setError(err.message || 'Failed to update customer in Cloud Firestore.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EDF1F7] pt-12">
        <LoadingIndicator message="Loading customer record from Firestore..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EDF1F7] pb-12">
      {/* Top Bar */}
      <div className="bg-[#079889] text-white pt-6 pb-8 px-4 rounded-b-[24px] shadow-md">
        <div className="max-w-md mx-auto flex items-center space-x-3">
          <button
            onClick={() => navigate(`/customer/${id}`)}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-lg font-bold">Edit Customer Record</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-4">
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200/80">
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start space-x-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Read-Only Customer ID */}
            <FloatingInput
              label="Customer ID (Immutable)"
              readOnly
              value={customerId}
              icon={<Hash className="w-4 h-4" />}
            />

            {/* Customer Name */}
            <FloatingInput
              label="Customer Name"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              icon={<User className="w-4 h-4" />}
            />

            {/* Mobile Number */}
            <FloatingInput
              label="Mobile Number"
              required
              type="tel"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              icon={<Phone className="w-4 h-4" />}
            />

            {/* Finance Amount in Indian Rupee (₹) */}
            <FloatingInput
              label="Finance Amount (₹)"
              required
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              icon={<span className="text-[#079889] font-bold text-sm">₹</span>}
            />

            {/* Status Selection */}
            <div className="pt-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Status *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setStatus('pending')}
                  className={`py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 border transition-all ${
                    status === 'pending'
                      ? 'bg-amber-500 text-white border-amber-500 shadow-md'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-white shrink-0" />
                  <span>Pending</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatus('successful')}
                  className={`py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 border transition-all ${
                    status === 'successful'
                      ? 'bg-[#176B2C] text-white border-[#176B2C] shadow-md'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-white shrink-0" />
                  <span>Successful</span>
                </button>
              </div>
            </div>

            {/* Reference Name */}
            <FloatingInput
              label="Reference / Guarantor"
              value={referenceName}
              onChange={(e) => setReferenceName(e.target.value)}
              icon={<Tag className="w-4 h-4" />}
            />

            {/* Email */}
            <FloatingInput
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
            />

            {/* Address */}
            <FloatingInput
              label="Customer Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              icon={<MapPin className="w-4 h-4" />}
            />

            {/* Profile Image URL */}
            <FloatingInput
              label="Profile Image URL"
              type="url"
              value={profileImageUrl}
              onChange={(e) => setProfileImageUrl(e.target.value)}
              icon={<ImageIcon className="w-4 h-4" />}
            />

            {/* Description */}
            <FloatingInput
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              icon={<FileText className="w-4 h-4" />}
            />

            {/* Notes */}
            <FloatingTextarea
              label="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />

            {/* Buttons */}
            <div className="pt-2 flex space-x-2">
              <button
                type="button"
                onClick={() => navigate(`/customer/${id}`)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-[#079889] hover:bg-[#067f72] text-white font-bold text-xs py-3 rounded-2xl shadow-lg shadow-[#079889]/30 transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
              >
                {saving ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Update Record</span>
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
