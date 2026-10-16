import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { subscribeToCustomerById, recordCustomerPayment } from '../services/customerService';
import {
  addCustomerTransaction,
  subscribeToCustomerTransactions
} from '../services/transactionService';
import { Customer, CustomerTransaction } from '../types';
import { LoadingIndicator } from '../components/LoadingIndicator';
import {
  ArrowLeft,
  Plus,
  Receipt,
  Calendar,
  Clock,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  User,
  CheckCircle2,
  Calculator,
  Loader2,
  X,
  FileText,
  Filter,
  Printer,
  Download,
  RotateCcw
} from 'lucide-react';

import { FloatingInput } from '../components/FloatingInput';
import { FloatingSelect } from '../components/FloatingSelect';
import html2canvas from 'html2canvas';

export const Transactions: React.FC = () => {
  const { customerId: paramDocId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<CustomerTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Form & Screen States
  const [modalOpen, setModalOpen] = useState(false);
  const [paidAmount, setPaidAmount] = useState('');
  const [type, setType] = useState<'payment' | 'charge' | 'credit' | 'debit'>('payment');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Date Filter Modal States
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Print Invoice Modal State
  const [showPrintInvoiceModal, setShowPrintInvoiceModal] = useState(false);

  useEffect(() => {
    if (!paramDocId || !user?.uid) return;

    setLoading(true);
    const unsubscribeCustomer = subscribeToCustomerById(paramDocId, (data) => {
      setCustomer(data);
      setLoading(false);
    });

    const unsubscribeTransactions = subscribeToCustomerTransactions(
      user.uid,
      paramDocId,
      (txList) => {
        setTransactions(txList);
      }
    );

    return () => {
      unsubscribeCustomer();
      unsubscribeTransactions();
    };
  }, [paramDocId, user?.uid]);

  // Filtered transactions by Start Date and End Date
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (startDate && tx.transactionDate < startDate) return false;
      if (endDate && tx.transactionDate > endDate) return false;
      return true;
    });
  }, [transactions, startDate, endDate]);

  const totalPayments = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.transactionType === 'payment' || t.transactionType === 'credit')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [filteredTransactions]);

  const totalCharges = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.transactionType === 'charge' || t.transactionType === 'debit')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [filteredTransactions]);

  // Live Loan Calculation Math
  const currentLoanAmount = Number(customer?.amount || 0);
  const numericPaidAmount = parseFloat(paidAmount) || 0;
  const remainingLoanBalance = Math.max(0, currentLoanAmount - numericPaidAmount);

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!paramDocId || !user?.uid || !customer) {
      setError('Missing customer or user session.');
      return;
    }

    if (numericPaidAmount <= 0) {
      setError('Please enter a valid paid amount greater than 0.');
      return;
    }

    try {
      setSubmitting(true);

      // Show round progress spinner for 3 seconds
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // 1. Record transaction in customerTransactions
      await addCustomerTransaction({
        ownerUid: user.uid,
        customerId: paramDocId,
        amount: numericPaidAmount,
        transactionType: type,
        description: description.trim() || `Payment received (₹${numericPaidAmount})`,
        transactionDate: date,
      });

      // 2. Perform Loan Amount calculation Math & update customer status to Successful in Firestore
      const { remainingAmount } = await recordCustomerPayment(
        paramDocId,
        user.uid,
        customer.customerId,
        customer.customerName,
        currentLoanAmount,
        numericPaidAmount
      );

      // 3. Show Toast Message
      setToastMessage(
        `Payment of ₹${numericPaidAmount} recorded! Remaining Balance: ₹${remainingAmount}. Status set to SUCCESSFUL!`
      );

      // 4. Close form and reset
      setTimeout(() => {
        setModalOpen(false);
        setPaidAmount('');
        setDescription('');
        setToastMessage('');
        setSubmitting(false);
      }, 1500);
    } catch (err: any) {
      console.error('Failed to save transaction:', err);
      setError(err.message || 'Failed to record transaction in Firestore.');
      setSubmitting(false);
    }
  };

  const [downloadingJpg, setDownloadingJpg] = useState(false);

  // Fallback 2D Canvas Generator for Invoice JPG download in Black Table Format
  const generateInvoiceCanvasFallback = (
    cust: Customer,
    txs: CustomerTransaction[],
    totalPaid: number
  ): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = Math.max(1200, 520 + (txs.length || 1) * 45 + 100);
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    // Outer Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Outer Table Border Box
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

    // Top Header Section (Black & Teal Accent Text, White Background)
    ctx.fillStyle = '#079889';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('FINANCIAL LEDGER STATEMENT', 50, 75);

    ctx.fillStyle = '#475569';
    ctx.font = '15px sans-serif';
    ctx.fillText('Official Loan Payment Statement & Invoice Receipt', 50, 105);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`Date: ${new Date().toLocaleDateString('en-IN')}`, canvas.width - 50, 75);
    ctx.fillStyle = '#64748b';
    ctx.font = '13px monospace';
    ctx.fillText(`Invoice ID: INV-${Date.now().toString().slice(-6)}`, canvas.width - 50, 100);
    ctx.textAlign = 'left';

    // Divider Line
    ctx.strokeStyle = '#079889';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(50, 125);
    ctx.lineTo(canvas.width - 50, 125);
    ctx.stroke();

    // Customer Details & Summary Box - Light Gray/White Box with Black Text & Gray Border
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.rect(50, 150, canvas.width - 100, 180);
    ctx.fill();
    ctx.stroke();

    // Left Details
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('CUSTOMER DETAILS', 70, 180);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(cust.customerName || 'N/A', 70, 215);

    ctx.fillStyle = '#334155';
    ctx.font = '15px monospace';
    ctx.fillText(`Customer ID: ${cust.customerId || 'N/A'}`, 70, 248);
    ctx.fillText(`Mobile: ${cust.mobileNumber || 'N/A'}`, 70, 278);
    if (cust.address) {
      ctx.fillText(`Address: ${cust.address}`, 70, 308);
    }

    // Right Summary
    ctx.textAlign = 'right';
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('ACCOUNT SUMMARY', canvas.width - 70, 180);

    ctx.fillStyle = '#0f172a';
    ctx.font = '15px sans-serif';
    ctx.fillText(`Total Loan Amount: ₹${Number(cust.amount || 0).toFixed(2)}`, canvas.width - 70, 215);

    ctx.fillStyle = '#15803d';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(`Total Paid Amount: ₹${totalPaid.toFixed(2)}`, canvas.width - 70, 248);

    ctx.fillStyle = '#0f172a';
    ctx.font = '15px sans-serif';
    ctx.fillText(`Repayment Frequency: ${cust.frequency || 'Weekly'}`, canvas.width - 70, 278);

    ctx.fillStyle = '#079889';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(`Status: ${(cust.status || 'Pending').toUpperCase()}`, canvas.width - 70, 308);
    ctx.textAlign = 'left';

    // Ledger Table Title
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(`LEDGER TRANSACTION ENTRIES (${txs.length})`, 50, 370);

    // Table Format in Black Lines and Black Text
    const startY = 390;

    // Table Header Row - Light Gray Fill, Black Text, Black Line
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(50, startY, canvas.width - 100, 45);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.strokeRect(50, startY, canvas.width - 100, 45);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('Date', 70, startY + 28);
    ctx.fillText('Type', 250, startY + 28);
    ctx.fillText('Description', 420, startY + 28);
    ctx.textAlign = 'right';
    ctx.fillText('Amount (₹)', canvas.width - 70, startY + 28);
    ctx.textAlign = 'left';

    // Table Rows
    let rowY = startY + 45;
    const rowHeight = 42;

    if (txs.length === 0) {
      ctx.fillStyle = '#64748b';
      ctx.font = 'italic 15px sans-serif';
      ctx.fillText('No transactions recorded for this period.', 70, rowY + 28);
    } else {
      txs.forEach((tx, idx) => {
        ctx.fillStyle = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
        ctx.fillRect(50, rowY, canvas.width - 100, rowHeight);
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.strokeRect(50, rowY, canvas.width - 100, rowHeight);

        ctx.fillStyle = '#0f172a';
        ctx.font = '14px monospace';
        ctx.fillText(tx.transactionDate || '-', 70, rowY + 26);

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText((tx.transactionType || 'payment').toUpperCase(), 250, rowY + 26);

        ctx.fillStyle = '#334155';
        ctx.font = '14px sans-serif';
        ctx.fillText((tx.description || '-').slice(0, 40), 420, rowY + 26);

        ctx.textAlign = 'right';
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 15px monospace';
        ctx.fillText(`+₹${Number(tx.amount || 0).toFixed(2)}`, canvas.width - 70, rowY + 26);
        ctx.textAlign = 'left';

        rowY += rowHeight;
      });
    }

    // Footer Line
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(50, canvas.height - 50);
    ctx.lineTo(canvas.width - 50, canvas.height - 50);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '13px sans-serif';
    ctx.fillText('Computer generated official ledger statement invoice.', 50, canvas.height - 30);
    ctx.textAlign = 'right';
    ctx.fillText('Page 1 of 1', canvas.width - 50, canvas.height - 30);
    ctx.textAlign = 'left';

    return canvas;
  };

  const handleDownloadInvoice = async () => {
    if (!customer) {
      alert('Customer record not found. Please try again.');
      return;
    }

    try {
      setDownloadingJpg(true);
      const fileName = `Invoice_${customer.customerId || 'Statement'}_${new Date().toISOString().split('T')[0]}.jpg`;

      const triggerDownload = (dataUrl: string) => {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          if (document.body.contains(link)) {
            document.body.removeChild(link);
          }
        }, 1000);
      };

      const element = document.getElementById('printable-invoice');
      let canvasToUse: HTMLCanvasElement | null = null;

      if (element) {
        try {
          // Dynamic import html2canvas to capture DOM node directly
          const html2canvasModule = await import('html2canvas');
          const html2canvas = html2canvasModule.default;

          canvasToUse = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,
            onclone: (clonedDoc) => {
              // Strip oklch from cloned style tags to prevent html2canvas color parse error
              const styleTags = Array.from(clonedDoc.querySelectorAll('style'));
              styleTags.forEach((tag) => {
                if (tag.textContent) {
                  tag.textContent = tag.textContent.replace(/oklch\([^)]+\)/g, '#0f172a');
                }
              });
              const clonedElement = clonedDoc.getElementById('printable-invoice');
              if (clonedElement) {
                clonedElement.style.display = 'block';
                clonedElement.style.visibility = 'visible';
                clonedElement.style.position = 'static';
                clonedElement.style.width = '800px';
                clonedElement.style.padding = '24px';
                clonedElement.style.backgroundColor = '#ffffff';
                clonedElement.style.color = '#0f172a';
              }
            },
          });
        } catch (h2cErr) {
          console.warn('html2canvas capture warning, using 2D Canvas fallback:', h2cErr);
          canvasToUse = null;
        }
      }

      if (!canvasToUse) {
        // High-resolution 2D Canvas Fallback Generator
        canvasToUse = generateInvoiceCanvasFallback(customer, filteredTransactions, totalPayments);
      }

      // Convert canvas to Data URL for 100% reliable download across webviews, iOS, Android, and GitHub Pages
      const dataUrl = canvasToUse.toDataURL('image/jpeg', 0.95);
      triggerDownload(dataUrl);

      setToastMessage('Invoice JPG image downloaded successfully!');
      setTimeout(() => setToastMessage(''), 3000);
    } catch (err: any) {
      console.error('Failed to generate invoice image:', err);
      alert('Could not download invoice image: ' + (err?.message || 'Unknown error'));
    } finally {
      setDownloadingJpg(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EDF1F7] pt-12">
        <LoadingIndicator message="Fetching transaction history from Firestore..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EDF1F7] pb-12 flex flex-col">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#079889] text-white px-5 py-3 rounded-full shadow-2xl flex items-center space-x-2 text-xs font-bold animate-bounce max-w-sm text-center">
          <CheckCircle2 className="w-5 h-5 text-teal-200 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-[#079889] text-white pt-6 pb-12 px-4 rounded-b-[28px] shadow-md w-full">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(paramDocId ? `/customer/${paramDocId}` : '/')}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>

          <div className="text-center">
            <h1 className="text-base font-bold uppercase tracking-wider">Transaction Ledger</h1>
            <p className="text-[11px] text-teal-100 font-mono">
              {customer?.customerName || 'Customer'} ({customer?.customerId})
            </p>
          </div>

          {/* Action Icons Header: Filter, Print, Plus */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilterModal(!showFilterModal)}
              className={`p-2 rounded-full transition-colors ${
                startDate || endDate
                  ? 'bg-amber-400 text-slate-900 font-bold'
                  : 'bg-white/20 hover:bg-white/30 text-white'
              }`}
              title="Filter by Date Range"
            >
              <Filter className="w-4.5 h-4.5" />
            </button>

            <button
              onClick={() => setShowPrintInvoiceModal(true)}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
              title="Print & Download Customer Invoice"
            >
              <Printer className="w-4.5 h-4.5" />
            </button>

            <button
              onClick={() => setModalOpen(true)}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
              title="Record New Entry"
            >
              <Plus className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto w-full px-3 sm:px-6 -mt-6 space-y-4 flex-1">
        {/* Financial Summary Card (Deleted bottom record payment button) */}
        <div className="bg-white rounded-3xl p-5 shadow-xl border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Current Loan Amount
            </span>
            <span className="text-sm font-mono font-extrabold text-[#079889]">
              ₹{Number(customer?.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div className="bg-emerald-50 border border-emerald-200/80 p-3 rounded-2xl">
              <span className="text-[10px] font-bold text-emerald-700 uppercase flex items-center space-x-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span>Total Paid</span>
              </span>
              <span className="text-lg font-extrabold text-emerald-900 font-mono block mt-1">
                +₹{totalPayments.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="bg-amber-50 border border-amber-200/80 p-3 rounded-2xl">
              <span className="text-[10px] font-bold text-amber-800 uppercase flex items-center space-x-1">
                <TrendingDown className="w-3.5 h-3.5 text-amber-600" />
                <span>Total Charges</span>
              </span>
              <span className="text-lg font-extrabold text-amber-900 font-mono block mt-1">
                -₹{totalCharges.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Filter Indicator Badge if Filter Active */}
        {(startDate || endDate) && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs font-bold text-amber-900">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Filtered Date Range: {startDate || 'Beginning'} to {endDate || 'Today'}
              </span>
            </div>
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="text-[11px] text-amber-700 underline flex items-center space-x-1 hover:text-amber-900"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        )}

        {/* Real-time Transactions Feed */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
              <Receipt className="w-3.5 h-3.5 text-[#079889]" />
              <span>Real-Time Ledger Entries</span>
            </h3>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowFilterModal(true)}
                className="px-2.5 py-1 rounded-xl bg-teal-50 hover:bg-teal-100 text-[#079889] text-xs font-bold flex items-center space-x-1 transition-all"
                title="Filter by Date"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Filter</span>
              </button>

              <button
                onClick={() => setShowPrintInvoiceModal(true)}
                className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center space-x-1 transition-all"
                title="Print Invoice"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>

              <span className="text-[10px] text-slate-400 font-mono">
                {filteredTransactions.length} Entries
              </span>
            </div>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-700">No transactions found</p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                {startDate || endDate
                  ? 'No ledger entries match the selected date range filter.'
                  : 'Click the + button to record a payment or ledger entry.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map((tx) => {
                const isCredit = tx.transactionType === 'payment' || tx.transactionType === 'credit';
                const statusIsPending = customer?.status === 'pending';

                return (
                  <div
                    key={tx.id || tx.transactionId}
                    className="p-3.5 bg-slate-50/90 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3 shadow-xs hover:border-[#079889]/30 transition-all"
                  >
                    {/* Left: Customer Profile Picture Avatar + Details */}
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                        {customer?.profileImageUrl ? (
                          <img
                            src={customer.profileImageUrl}
                            alt={customer.customerName}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <span className="text-xs font-extrabold text-[#079889]">
                            {customer?.customerName?.charAt(0).toUpperCase() || 'C'}
                          </span>
                        )}
                      </div>

                      {/* Name, Status Pill, Date & Time */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {customer?.customerName || 'Customer'}
                          </h4>
                          {/* Transaction / Customer Status Pill */}
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider text-white shrink-0 ${
                              statusIsPending ? 'bg-[#F39A00]' : 'bg-[#176B2C]'
                            }`}
                          >
                            {customer?.status || 'SUCCESSFUL'}
                          </span>
                        </div>

                        {/* Transaction Type, Date & Time */}
                        <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 mt-1 flex-wrap">
                          <span className="font-bold text-slate-700 capitalize bg-slate-200/60 px-1.5 py-0.2 rounded text-[10px]">
                            {tx.transactionType || 'Payment'}
                          </span>
                          <span>•</span>
                          <span className="font-mono text-slate-600">{tx.transactionDate}</span>
                          {customer?.loanTime && (
                            <>
                              <span>•</span>
                              <span className="font-mono text-slate-500 text-[10px]">
                                {customer.loanTime}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Amount */}
                    <div className="text-right shrink-0">
                      <span
                        className={`text-sm font-extrabold font-mono block ${
                          isCredit ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {isCredit ? '+' : '-'}₹{Number(tx.amount).toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Date Filter Box Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 border border-slate-200 my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-teal-50 text-[#079889] rounded-xl">
                  <Filter className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Filter Ledger Entries</h3>
              </div>
              <button
                onClick={() => setShowFilterModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <FloatingInput
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                icon={<Calendar className="w-4 h-4 text-[#079889]" />}
              />

              <FloatingInput
                label="End Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                icon={<Calendar className="w-4 h-4 text-[#079889]" />}
              />
            </div>

            <div className="pt-2 flex space-x-2">
              <button
                type="button"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setShowFilterModal(false);
                }}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                Reset Filter
              </button>
              <button
                type="button"
                onClick={() => setShowFilterModal(false)}
                className="flex-1 py-3 bg-[#079889] hover:bg-[#067f72] text-white font-bold text-xs rounded-xl shadow-md transition-colors"
              >
                Apply Date Range
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print & Download Invoice Screen Modal */}
      {showPrintInvoiceModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-2xl w-full shadow-2xl space-y-6 my-auto border border-slate-200">
            {/* Action Bar (Hidden in Print Mode) */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 print:hidden">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-teal-50 text-[#079889] rounded-xl">
                  <Printer className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Print & Download Invoice</h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-2 bg-[#079889] hover:bg-[#067f72] text-white text-xs font-bold rounded-xl shadow-md flex items-center space-x-1.5 transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Invoice</span>
                </button>
                <button
                  onClick={handleDownloadInvoice}
                  disabled={downloadingJpg}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-md flex items-center space-x-1.5 transition-all disabled:opacity-50"
                  title="Download Invoice Image (.jpg)"
                >
                  {downloadingJpg ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Saving JPG...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Download JPG</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowPrintInvoiceModal(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Print CSS Styling Rule */}
            <style>{`
              @media print {
                body * {
                  visibility: hidden;
                }
                #printable-invoice, #printable-invoice * {
                  visibility: visible;
                }
                #printable-invoice {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 100%;
                  padding: 20px;
                  background: white;
                }
              }
            `}</style>

            {/* Invoice Printable View - Contains All Invoice Details Marked in Red Box */}
            <div id="printable-invoice" className="bg-white text-slate-900 space-y-6 font-sans p-6 rounded-3xl border border-slate-200 shadow-xs">
              {/* Invoice Top Banner */}
              <div className="flex justify-between items-start border-b-2 border-[#079889] pb-4">
                <div>
                  <h2 className="text-xl font-extrabold text-[#079889] uppercase tracking-wide">
                    FINANCIAL LEDGER STATEMENT
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Official Loan Payment Statement & Invoice Receipt
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-800 block">
                    Date: {new Date().toLocaleDateString('en-IN')}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                    Invoice ID: INV-{Date.now().toString().slice(-6)}
                  </span>
                </div>
              </div>

              {/* Customer & Account Details Box (Explicit Inline Styles so no green fill occurs) */}
              <div
                style={{ backgroundColor: '#f8fafc', color: '#0f172a', borderColor: '#cbd5e1' }}
                className="grid grid-cols-2 gap-4 p-4 rounded-2xl border text-xs"
              >
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    CUSTOMER DETAILS
                  </span>
                  <span className="font-extrabold text-slate-900 text-sm block mt-1">
                    {customer?.customerName || 'N/A'}
                  </span>
                  <span className="text-slate-700 block mt-0.5 font-mono">
                    Customer ID: {customer?.customerId || 'N/A'}
                  </span>
                  <span className="text-slate-700 block font-mono">
                    Mobile: {customer?.mobileNumber || 'N/A'}
                  </span>
                  {customer?.address && (
                    <span className="text-slate-600 block">Address: {customer.address}</span>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    ACCOUNT SUMMARY
                  </span>
                  <span className="text-slate-700 block mt-1">
                    Total Loan Amount:{' '}
                    <strong className="text-slate-900">
                      ₹{Number(customer?.amount || 0).toFixed(2)}
                    </strong>
                  </span>
                  <span className="text-slate-700 block">
                    Total Paid Amount:{' '}
                    <strong className="text-emerald-700">₹{totalPayments.toFixed(2)}</strong>
                  </span>
                  <span className="text-slate-700 block">
                    Repayment Frequency:{' '}
                    <strong className="capitalize">{customer?.frequency || 'daily'}</strong>
                  </span>
                  <span className="text-slate-700 block">
                    Status:{' '}
                    <strong className="text-[#079889] uppercase">
                      {customer?.status || 'Pending'}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Transaction History Table */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Ledger Transaction Entries ({filteredTransactions.length})
                </h4>
                <table className="w-full text-left text-xs border-collapse border border-slate-300">
                  <thead>
                    <tr
                      style={{ backgroundColor: '#f1f5f9', color: '#0f172a', borderBottom: '2px solid #0f172a' }}
                      className="font-bold text-slate-900"
                    >
                      <th className="p-2.5 border-r border-slate-300">Date</th>
                      <th className="p-2.5 border-r border-slate-300">Type</th>
                      <th className="p-2.5 border-r border-slate-300">Description</th>
                      <th className="p-2.5 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-slate-400 italic">
                          No transactions recorded for this selected period.
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((tx, idx) => (
                        <tr
                          key={tx.id || idx}
                          className="border-b border-slate-100 hover:bg-slate-50"
                        >
                          <td className="p-2.5 font-mono border-r border-slate-100">
                            {tx.transactionDate}
                          </td>
                          <td className="p-2.5 capitalize font-semibold border-r border-slate-100">
                            {tx.transactionType}
                          </td>
                          <td className="p-2.5 border-r border-slate-100">
                            {tx.description || '-'}
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-emerald-700">
                            +₹{Number(tx.amount).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-400">
                <span>Computer generated official ledger statement invoice.</span>
                <span className="font-mono">Page 1 of 1</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Screen & Full Height Record Payment Screen with No Gaps */}
      {modalOpen && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col p-4 sm:p-6 overflow-y-auto w-full h-full min-h-screen">
          <div className="max-w-xl w-full mx-auto flex-1 flex flex-col justify-between space-y-6">
            <div>
              {/* Modal Top Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-teal-50 text-[#079889] rounded-2xl">
                    <Calculator className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Record Payment & Calculation
                    </h3>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">
                      {customer?.customerName} ({customer?.customerId})
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                  title="Close Screen"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSaveTransaction} className="space-y-5 pt-1">
                {/* Total Loan Amount - RED Border & RED Amount Value */}
                <FloatingInput
                  label="Total Loan Amount"
                  readOnly
                  disabled
                  value={`₹${currentLoanAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                  icon={<span className="text-red-600 font-extrabold text-sm">₹</span>}
                  labelColor="text-red-600"
                  borderColor="border-red-400 bg-red-50/20"
                  inputTextColor="text-red-600 font-mono font-extrabold text-base"
                />

                {/* Paid Amount Input - GREEN Border & GREEN Amount Value */}
                <FloatingInput
                  label="Paid Amount (₹)"
                  required
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  placeholder="e.g. 200"
                  icon={<span className="text-[#079889] font-extrabold text-sm">₹</span>}
                  labelColor="text-[#079889]"
                  borderColor="border-[#079889] ring-2 ring-[#079889]/20 bg-teal-50/20"
                  inputTextColor="text-[#079889] font-mono font-extrabold text-base"
                />

                {/* Description */}
                <FloatingInput
                  label="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Paid installment ₹200"
                  icon={<FileText className="w-4 h-4 text-slate-400" />}
                />

                {/* Save Button with 3-Second Progress Spinner & Toast */}
                <div className="pt-4 flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    disabled={submitting}
                    className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-3.5 bg-[#079889] hover:bg-[#067f72] text-white text-xs font-bold rounded-2xl shadow-lg shadow-[#079889]/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-75 active:scale-98"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                        <span>Calculating & Saving...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Save & Deduct</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
