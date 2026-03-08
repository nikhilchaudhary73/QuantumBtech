import React, { useState, useEffect } from 'react';
import { X, Lock, CheckCircle, QrCode, Tag, AlertCircle } from 'lucide-react';
import { generateUPILink } from '../utils/payment';
import { savePurchase, getCoupons, type PurchaseItemType } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';
import type { Coupon } from '../data/mockData';

interface PaymentModalProps {
  courseName: string;
  courseId: string;
  itemId: string;
  itemType: PurchaseItemType;
  price: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ 
  courseName, courseId, itemId, itemType, price, isOpen, onClose, onSuccess 
}) => {
  const [transactionId, setTransactionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState('');
  
  const { currentUser: user } = useAuth();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTransactionId('');
      setLoading(false);
      setShowQR(false);
      setCouponCode('');
      setAppliedCoupon(null);
      setCouponError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode) return;
    
    setCouponError('');
    const coupons = getCoupons();
    const coupon = coupons.find(c => c.code.toLowerCase() === couponCode.toLowerCase());

    if (!coupon) {
      setCouponError('Invalid coupon code');
      return;
    }

    if (coupon.applicableItemId && coupon.applicableItemId !== itemId && coupon.applicableItemId !== courseId) {
      setCouponError('This coupon is not valid for this item');
      return;
    }

    setAppliedCoupon(coupon);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  let finalPrice = price;
  if (appliedCoupon) {
    if (appliedCoupon.discountPercent) {
      finalPrice = price - (price * (appliedCoupon.discountPercent / 100));
    } else if (appliedCoupon.discountFlat) {
      finalPrice = price - appliedCoupon.discountFlat;
    }
  }
  
  finalPrice = Math.max(0, Math.floor(finalPrice));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !transactionId) return;

    setLoading(true);
    
    const userEmail = user.email || '';
    const userName = user.name || user.email || user.phoneNumber || 'Unknown';

    // Save purchase immediately — this writes to Firestore so admin sees it instantly
    savePurchase({
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId: user.uid || userEmail,
      userName,
      userEmail,           // MUST be email for useMyPurchases Firestore query
      userMobile: user.phoneNumber || 'N/A',
      courseId,
      courseName,
      itemId,
      itemType,
      amount: finalPrice,
      date: new Date().toISOString(),
      timestamp: Date.now(),
      transactionId: transactionId,
      status: 'Pending'
    });

    setLoading(false);
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white/90 backdrop-blur-md border border-white/20 shadow-lg dark:bg-slate-900/90 dark:border-slate-800/50 w-full max-w-2xl rounded-3xl shadow-2xl relative animate-in fade-in zoom-in duration-300 my-auto">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors z-10"
        >
          <X size={20} />
        </button>

        <div className="p-6 border-b border-slate-200 dark:border-slate-800 text-center">
          <div className="mx-auto w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center mb-3">
             <Lock className="text-indigo-600 dark:text-indigo-400" size={24} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Complete Payment</h2>
          <p className="text-sm text-slate-500 mt-1">{courseName}</p>
        </div>

        <div className="p-6 flex flex-col items-center">
          <div className="w-full flex-col md:flex-row flex gap-6">
            
            {/* Left side: QR Code */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 font-medium text-xs uppercase tracking-wider mb-2">Amount to Pay</span>
              <div className="text-4xl font-extrabold text-slate-900 dark:text-white mb-2 flex items-baseline gap-2">
                ₹{finalPrice}
                {appliedCoupon && (
                   <span className="text-lg text-slate-400 line-through">₹{price}</span>
                )}
              </div>
              
              <div className="bg-white p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center min-h-[160px] w-[160px] mx-auto mt-4">
                {!showQR ? (
                  <button 
                    onClick={() => setShowQR(true)}
                    className="px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-bold rounded-lg text-xs transition-colors text-center w-full"
                  >
                    Generate QR
                  </button>
                ) : (
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(generateUPILink(finalPrice, courseName))}`} 
                    alt="Scan to Pay" 
                    className="w-32 h-32 rounded-lg animate-in fade-in zoom-in"
                  />
                )}
              </div>
              <p className="text-xs text-slate-400 mt-3 text-center flex items-center justify-center gap-1">
                <QrCode size={14}/> Scan via any UPI app
              </p>
            </div>

            {/* Right side: Payment Info & UPI Apps & Coupons */}
            <div className="flex-1 flex flex-col justify-start space-y-6">
              
              {/* Coupon Section */}
              <div className="bg-indigo-50 dark:bg-slate-800/80 rounded-xl p-4 border border-indigo-100 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
                  <Tag size={16} className="text-indigo-500" /> Apply Coupon
                </div>
                
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-3 py-2 rounded-lg border border-green-200 dark:border-green-800/50">
                     <span className="font-bold tracking-wider">{appliedCoupon.code.toUpperCase()} Applied!</span>
                     <button onClick={removeCoupon} className="hover:text-red-500 p-1"><X size={16}/></button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter Code"
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value)}
                    />
                    <button type="submit" className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-bold hover:bg-indigo-600 dark:hover:bg-indigo-50 transition-colors">
                      Apply
                    </button>
                  </form>
                )}
                {couponError && <p className="text-red-500 text-xs mt-2 flex items-center gap-1"><AlertCircle size={12}/> {couponError}</p>}
              </div>

              {/* UPI Links */}
              <div className="space-y-3">
                <a 
                  href={generateUPILink(finalPrice, `Payment for ${courseName}`)}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-[#5f259f] hover:bg-[#4a1c7c] text-white rounded-xl font-bold transition-transform active:scale-95 shadow-md shadow-[#5f259f]/30"
                >
                  <img src="https://download.logo.wine/logo/PhonePe/PhonePe-Logo.wine.png" alt="PhonePe" className="h-6 object-contain" onError={(e) => e.currentTarget.style.display='none'}/>
                  Pay with PhonePe
                </a>
                <a 
                  href={generateUPILink(finalPrice, `Payment for ${courseName}`)}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-[#00baf2] hover:bg-[#0099c7] text-white rounded-xl font-bold transition-transform active:scale-95 shadow-md shadow-[#00baf2]/30"
                >
                  <img src="https://download.logo.wine/logo/Paytm/Paytm-Logo.wine.png" alt="Paytm" className="h-4 object-contain" onError={(e) => e.currentTarget.style.display='none'}/>
                  Pay with Paytm
                </a>
                <a 
                  href={generateUPILink(finalPrice, `Payment for ${courseName}`)}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl font-bold transition-transform active:scale-95 shadow-md"
                >
                  <img src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg" alt="GPay" className="h-4 object-contain" onError={(e) => e.currentTarget.style.display='none'}/>
                  Pay with GPay
                </a>
              </div>
            </div>

          </div>

          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 w-full">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Step 2: Verify Payment</h3>
            <p className="text-xs text-slate-500 mb-4">
              After completing the payment, please enter your Transaction Reference Number (UTR) to securely verify your purchase.
            </p>
            
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input 
                required
                type="text" 
                className="flex-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-inner uppercase"
                placeholder="e.g. Txn ID / UTR"
                value={transactionId}
                onChange={e => setTransactionId(e.target.value.toUpperCase())}
              />
              <button 
                type="submit"
                disabled={loading || !transactionId}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap"
              >
                {loading ? (
                  <span className="animate-pulse">Submitting...</span>
                ) : (
                  <>Submit <CheckCircle size={18} /></>
                )}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PaymentModal;
