import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Wallet, ArrowUpRight, CheckCircle2, AlertCircle, ShieldCheck, Copy, Sparkles, Loader2 } from 'lucide-react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { useAppStore } from '../store/useAppStore';
import { GramIcon } from './GramIcon';
import { formatNumber, plushPToPlush } from '../lib/utils';
import { doc, setDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEPOSIT_RECEIVER_ADDRESS = "UQCTZAMbXoN5T43K9gJXH8GYWBmIstXrUrdoV9kv3btN1Ad3";
const FEE_TON = 0.5;
const FEE_NANOTON = "500000000"; // 0.5 TON = 500,000,000 nanoTONs

export function WithdrawalModal({ isOpen, onClose }: WithdrawalModalProps) {
  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();
  const { balance, gramBalance, walletAddress, withdrawFunds, userId } = useAppStore();

  const [selectedCurrency, setSelectedCurrency] = useState<'PLUSH' | 'GRAM'>('PLUSH');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [txSuccess, setTxSuccess] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState(false);

  if (!isOpen) return null;

  const userMax = selectedCurrency === 'PLUSH' ? plushPToPlush(balance) : gramBalance;

  const handleSetMax = () => {
    setAmount(userMax.toString());
  };

  const handleCopyReceiver = () => {
    navigator.clipboard.writeText(DEPOSIT_RECEIVER_ADDRESS);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg('Please enter a valid withdrawal amount');
      return;
    }

    if (selectedCurrency === 'GRAM' && numAmount < 8) {
      setErrorMsg('Minimum withdrawal is 8 GRAM');
      return;
    }

    if (numAmount > userMax) {
      setErrorMsg(`Insufficient ${selectedCurrency} balance. Max available: ${userMax.toLocaleString()}`);
      return;
    }

    if (!recipientAddress || recipientAddress.length < 24) {
      setErrorMsg('Please enter a valid TON recipient wallet address (EQ... or UQ...)');
      return;
    }

    if (!wallet) {
      // Connect TON wallet first
      try {
        await tonConnectUI.openModal();
      } catch (err) {
        setErrorMsg('Failed to open TON Connect wallet selector');
      }
      return;
    }

    setIsProcessing(true);

    try {
      // Prepare 0.5 TON Fee Transfer transaction
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 600, // 10 mins
        messages: [
          {
            address: DEPOSIT_RECEIVER_ADDRESS,
            amount: FEE_NANOTON,
            payload: undefined, // Standard TON transfer
          },
        ],
      };

      const result = await tonConnectUI.sendTransaction(transaction);
      
      // Successfully sent 0.5 TON fee transaction
      const plushPDeduction = selectedCurrency === 'PLUSH' ? numAmount * 10000 : numAmount;
      const successDeducted = await withdrawFunds(selectedCurrency, plushPDeduction);
      
      if (successDeducted) {
        const txBoc = result.boc ? result.boc.slice(0, 16) + '...' : 'TON_TX_' + Date.now();
        setTxSuccess(txBoc);

        // Record withdrawal log in Firestore
        if (userId) {
          try {
            const withdrawRef = doc(collection(db, 'users', userId, 'withdrawals'));
            const globalWithdrawRef = doc(collection(db, 'withdrawal_requests'));
            const username = window.Telegram?.WebApp?.initDataUnsafe?.user?.username 
              ? `@${window.Telegram.WebApp.initDataUnsafe.user.username}` 
              : (walletAddress || 'Player');

            const payload = {
              id: globalWithdrawRef.id,
              userId,
              username,
              currency: selectedCurrency,
              amount: numAmount,
              recipientAddress,
              feePaidTon: FEE_TON,
              status: 'pending',
              createdAt: serverTimestamp()
            };

            await setDoc(withdrawRef, payload);
            await setDoc(globalWithdrawRef, payload);
          } catch (e) {
            console.error('Failed to log withdrawal to Firestore:', e);
          }
        }
      } else {
        setErrorMsg('Failed to deduct balance. Please contact support.');
      }
    } catch (err: any) {
      console.error('TON Transaction failed or rejected:', err);
      if (err?.message?.includes('User rejected')) {
        setErrorMsg('Transaction rejected in your TON Wallet.');
      } else {
        setErrorMsg(err?.message || 'Transaction failed. Make sure you have at least 0.5 TON in your wallet.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-sm sm:max-w-md bg-zinc-900 border border-emerald-500/30 rounded-3xl p-5 sm:p-6 shadow-[0_0_50px_rgba(16,185,129,0.15)] text-white overflow-hidden max-h-[88vh] overflow-y-auto"
        >
          {/* Top Header */}
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <ArrowUpRight className="w-5 h-5 text-zinc-950 font-bold" />
              </div>
              <div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-300 bg-clip-text text-transparent">
                  Withdraw Funds
                </h3>
                <p className="text-xs text-zinc-400">Direct TON Blockchain Payout</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {txSuccess ? (
            /* Success View */
            <div className="py-8 text-center space-y-4">
              <motion.div 
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }} 
                className="w-16 h-16 bg-emerald-500/20 border border-emerald-500 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.4)]"
              >
                <CheckCircle2 className="w-10 h-10" />
              </motion.div>

              <h4 className="text-2xl font-black text-white">Withdrawal Submitted!</h4>
              <div className="text-sm text-zinc-300 max-w-xs mx-auto leading-relaxed">
                Your request to withdraw <span className="font-bold text-emerald-400">{amount} ${selectedCurrency}</span> to address{' '}
                <span className="font-mono text-cyan-300 block text-xs mt-1 break-all bg-zinc-950/80 p-2 rounded-lg border border-zinc-800">
                  {recipientAddress}
                </span>{' '}
                has been recorded.
              </div>

              <div className="bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800/80 text-left text-xs space-y-2">
                <div className="flex justify-between text-zinc-400">
                  <span>Network Gas Fee Paid:</span>
                  <span className="text-emerald-400 font-semibold">{FEE_TON} TON</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Transaction Hash / BOC:</span>
                  <span className="font-mono text-zinc-300">{txSuccess}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Status:</span>
                  <span className="text-cyan-400 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    Processing Blockchain Batch
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setTxSuccess(null);
                  setAmount('');
                  onClose();
                }}
                className="w-full py-3 rounded-2xl font-bold bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-zinc-950 shadow-lg shadow-emerald-500/20 transition-all"
              >
                Done
              </button>
            </div>
          ) : (
            /* Withdrawal Form */
            <form onSubmit={handleWithdraw} className="mt-5 space-y-5">
              {/* Asset Selector */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">
                  Select Currency
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* PLUSH Option */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCurrency('PLUSH');
                      setAmount('');
                    }}
                    className={`p-3.5 rounded-2xl border flex items-center space-x-3 rtl:space-x-reverse transition-all text-left ${
                      selectedCurrency === 'PLUSH'
                        ? 'bg-emerald-500/10 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                        : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-green-600 flex items-center justify-center font-black text-zinc-950 text-sm shadow">
                      $P
                    </div>
                    <div>
                      <div className="text-xs text-zinc-400 font-medium">$PLUSH Balance</div>
                      <div className="text-sm font-black text-white">{formatNumber(plushPToPlush(balance))} $PLUSH</div>
                      <div className="text-[10px] text-zinc-500 font-bold">{formatNumber(balance)} PlushP</div>
                    </div>
                  </button>

                  {/* GRAM Option */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCurrency('GRAM');
                      setAmount('');
                    }}
                    className={`p-3.5 rounded-2xl border flex items-center space-x-3 rtl:space-x-reverse transition-all text-left ${
                      selectedCurrency === 'GRAM'
                        ? 'bg-cyan-500/10 border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
                        : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <GramIcon size={40} className="rounded-xl bg-cyan-950/50 p-1 border border-cyan-500/30" />
                    <div>
                      <div className="text-xs text-zinc-400 font-medium flex items-center gap-1">
                        <span>GRAM Balance</span>
                        <span className="text-[9px] text-cyan-400 font-bold bg-cyan-500/10 px-1 rounded">Min: 8</span>
                      </div>
                      <div className="text-sm font-black text-white">{gramBalance.toLocaleString()} GRAM</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Recipient Address */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">
                  TON Recipient Wallet Address
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    placeholder="Enter TON wallet address (UQ... / EQ...)"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-2xl px-4 py-3.5 text-sm text-white font-mono placeholder:text-zinc-600 focus:outline-none transition-colors"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">
                    <Wallet className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="font-semibold text-zinc-400 uppercase tracking-wider">Amount to Withdraw</span>
                  <span className="text-zinc-400">
                    Max: <span className="text-emerald-400 font-bold">{userMax.toLocaleString()} {selectedCurrency}</span>
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={`Enter ${selectedCurrency} amount`}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-2xl px-4 py-3.5 text-sm text-white font-mono placeholder:text-zinc-600 focus:outline-none transition-colors pr-20"
                  />
                  <button
                    type="button"
                    onClick={handleSetMax}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-zinc-800 hover:bg-zinc-700 text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors"
                  >
                    MAX
                  </button>
                </div>
              </div>

              {/* Fee Notice Box */}
              <div className="bg-gradient-to-r from-cyan-950/50 to-zinc-950/80 border border-cyan-500/30 rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between text-cyan-300 font-bold">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    Blockchain Gas & Network Fee
                  </span>
                  <span className="bg-cyan-500/20 text-cyan-300 px-2.5 py-1 rounded-full border border-cyan-500/40 text-xs font-black">
                    0.5 TON
                  </span>
                </div>
                <p className="text-zinc-400 leading-relaxed text-[11px]">
                  Withdrawal requires paying a network fee of <strong className="text-white">0.5 TON</strong> directly via TON Connect wallet to process on-chain output.
                </p>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-2xl text-xs text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Action Button */}
              <button
                type="submit"
                disabled={isProcessing}
                className={`w-full py-4 rounded-2xl font-black text-sm tracking-wide shadow-xl transition-all flex items-center justify-center space-x-2 rtl:space-x-reverse ${
                  !wallet
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/20'
                    : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-zinc-950 shadow-emerald-500/20'
                }`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Confirming 0.5 TON Fee Transaction...</span>
                  </>
                ) : !wallet ? (
                  <>
                    <Wallet className="w-5 h-5" />
                    <span>Connect TON Wallet & Pay 0.5 TON Fee</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 fill-zinc-950" />
                    <span>Withdraw Now (0.5 TON Fee)</span>
                  </>
                )}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
