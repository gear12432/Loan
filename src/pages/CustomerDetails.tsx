import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  subscribeToCustomerById,
  updateCustomerStatus,
  deleteCustomer
} from '../services/customerService';
import { Customer } from '../types';
import { LoadingIndicator } from '../components/LoadingIndicator';
import {
  ArrowLeft,
  Phone,
  Edit,
  Trash2,
  Copy,
  Share2,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Check,
  UserCheck,
  Wallet
} from 'lucide-react';

export const CustomerDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [statusUpdating, setStatusUpdating] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  useEffect(() => {
    if (!id || !user?.uid) return;

    setLoading(true);
    const unsubscribeCustomer = subscribeToCustomerById(id, (data) => {
      setCustomer(data);
      setLoading(false);
    });

    return () => {
      unsubscribeCustomer();
    };
  }, [id, user?.uid]);

  const handleCopyId = () => {
    if (!customer?.customerId) return;
    navigator.clipboard.writeText(customer.customerId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (!customer) return;
    const text = `Customer Record: ${customer.customerName}\nID: ${customer.customerId}\nMobile: ${customer.mobileNumber}\nAmount: ₹${customer.amount}\nStatus: ${customer.status.toUpperCase()}`;
    if (navigator.share) {
      navigator.share({ title: `Customer ${customer.customerId}`, text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      setToastMessage('Details copied to clipboard!');
      setTimeout(() => setToastMessage(''), 3000);
    }
  };

  const handleToggleStatus = async () => {
    if (!customer || !id || !user?.uid) return;
    const nextStatus = customer.status === 'pending' ? 'successful' : 'pending';
    try {
      setStatusUpdating(true);
      await updateCustomerStatus(
        id,
        user.uid,
        customer.customerId,
        customer.customerName,
        customer.status,
        nextStatus
      );
      setToastMessage(`Status changed to ${nextStatus.toUpperCase()}`);
      setTimeout(() => setToastMessage(''), 3000);
    } catch (err: any) {
      alert('Failed to update status: ' + err.message);
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!customer || !id || !user?.uid) return;
    try {
      setDeleting(true);
      await deleteCustomer(id, user.uid, customer.customerId, customer.customerName);
      navigate('/');
    } catch (err: any) {
      alert('Failed to delete customer: ' + err.message);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EDF1F7] pt-12">
        <LoadingIndicator message="Fetching live customer record..." />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-[#EDF1F7] p-6 text-center flex flex-col items-center justify-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500" />
        <h2 className="text-lg font-bold text-slate-800">Customer Record Not Found</h2>
        <p className="text-xs text-slate-500 max-w-xs">
          This record may have been deleted or moved on another authorized device.
        </p>
        <button
          onClick={() => navigate('/')}
          className="bg-[#079889] text-white px-5 py-2.5 rounded-full font-bold text-xs shadow"
        >
          Return to Customer List
        </button>
      </div>
    );
  }

  const isPending = customer.status === 'pending';

  return (
    <div className="min-h-screen bg-[#EDF1F7] pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-2xl flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="bg-[#079889] text-white pt-6 pb-12 px-4 rounded-b-[28px] shadow-md relative">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-base font-bold uppercase tracking-wider">Customer Details</h1>
          <button
            onClick={handleShare}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            title="Share Customer Summary"
          >
            <Share2 className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Main Profile Card Overlapping Header */}
      <div className="max-w-md mx-auto px-4 -mt-8 space-y-4">
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200/80 text-center relative overflow-hidden">
          {/* Status Banner */}
          <div
            className={`absolute top-0 left-0 right-0 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white ${
              isPending ? 'bg-[#F39A00]' : 'bg-[#176B2C]'
            }`}
          >
            Status: {customer.status}
          </div>

          {/* Top Profile Info Row: Left Avatar + 2 Line Text (Name & ID), Right Bordered Loan Amount Box */}
          <div className="flex items-center justify-between gap-2 mt-4 text-left">
            {/* Left: Profile Picture + 2 Line Text */}
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="w-14 h-14 rounded-full bg-slate-100 border-2 border-[#079889]/30 shadow-sm overflow-hidden flex items-center justify-center shrink-0">
                {customer.profileImageUrl ? (
                  <img
                    src={customer.profileImageUrl}
                    alt={customer.customerName}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="text-xl font-extrabold text-[#079889]">
                    {customer.customerName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                {/* Line 1: Customer Name */}
                <h2 className="text-base font-extrabold text-slate-900 truncate">
                  {customer.customerName}
                </h2>

                {/* Line 2: Customer ID */}
                <div className="inline-flex items-center space-x-1.5 text-xs font-mono text-slate-600 mt-0.5">
                  <span className="font-semibold">ID: {customer.customerId}</span>
                  <button
                    onClick={handleCopyId}
                    className="p-0.5 text-slate-400 hover:text-black transition-colors"
                    title="Copy Customer ID"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Bordered Loan Amount Box with Wallet Icon & Red Value */}
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-2.5 flex items-center space-x-2 shrink-0 shadow-sm">
              <div className="p-1.5 bg-slate-100 rounded-xl text-black shrink-0">
                <Wallet className="w-5 h-5 text-black" />
              </div>
              <div className="text-right">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                  LOAN AMOUNT
                </span>
                <span className="text-sm sm:text-base font-extrabold text-red-600 font-mono block">
                  ₹{Number(customer.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Primary Quick Action Bar with Black Icons and Black Text */}
          <div className="grid grid-cols-4 gap-2.5 mt-5 pt-4 border-t border-slate-100">
            {/* Call */}
            <a
              href={`tel:${customer.mobileNumber}`}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#F0FDF8] hover:bg-[#E2F9F0] border border-teal-100 text-black transition-all active:scale-95 shadow-xs"
            >
              <Phone className="w-7 h-7 text-black" />
              <span className="text-xs font-bold text-black mt-1.5">Call</span>
            </a>

            {/* Edit */}
            <button
              onClick={() => navigate(`/edit-customer/${id}`)}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#F0FDF8] hover:bg-[#E2F9F0] border border-teal-100 text-black transition-all active:scale-95 shadow-xs"
            >
              <Edit className="w-7 h-7 text-black" />
              <span className="text-xs font-bold text-black mt-1.5">Edit</span>
            </button>

            {/* Change Status */}
            <button
              onClick={handleToggleStatus}
              disabled={statusUpdating}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#F0FDF8] hover:bg-[#E2F9F0] border border-teal-100 text-black transition-all active:scale-95 shadow-xs"
            >
              <UserCheck className="w-7 h-7 text-black" />
              <span className="text-xs font-bold text-black mt-1.5 truncate max-w-full px-0.5">
                {isPending ? 'Mark Done' : 'Set Pending'}
              </span>
            </button>

            {/* Ledger Transactions */}
            <button
              onClick={() => navigate(`/transactions/${id}`)}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#F0FDF8] hover:bg-[#E2F9F0] border border-teal-100 text-black transition-all active:scale-95 shadow-xs"
            >
              <Receipt className="w-7 h-7 text-black" />
              <span className="text-xs font-bold text-black mt-1.5">Ledger</span>
            </button>
          </div>
        </div>

        {/* Delete Record Button */}
        <div className="pt-2">
          <button
            onClick={() => setDeleteModalOpen(true)}
            className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs py-3.5 rounded-2xl border border-red-200 transition-all flex items-center justify-center space-x-2"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
            <span>Delete Customer Record</span>
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">Delete Customer Record?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete <span className="font-bold text-slate-800">{customer.customerName}</span>? This action cannot be undone.
              </p>
            </div>
            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleting}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
