import React, { useState, useEffect, useRef } from 'react';
import { Wallet, Check, Copy, LogOut, ShieldCheck, ChevronDown, RefreshCw } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';

export default function WalletConnectButton({ user, onToast, lightTheme = false }) {
  const { walletAddress, isConnecting, connectWallet, switchAccount, disconnectWallet } = useWallet();
  const [copied, setCopied] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const shortAddress = walletAddress 
    ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`
    : '';

  const handleCopy = (e) => {
    e.stopPropagation();
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      if (onToast) onToast('Full wallet address copied to clipboard!', 'info');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative inline-block font-sans text-xs" ref={dropdownRef}>
      {walletAddress ? (
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition flex items-center gap-2 border shadow-sm ${
              lightTheme 
                ? 'bg-slate-100 border-teal-500/50 text-slate-900 hover:bg-slate-200' 
                : 'bg-slate-900/90 border-teal-500/50 text-teal-300 hover:bg-slate-800'
            }`}
            title={`Connected Real Web3 Wallet: ${walletAddress}`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <Wallet size={14} className="text-teal-400" />
            <span>{shortAddress}</span>
            <ChevronDown size={13} className="text-slate-400" />
          </button>

          {dropdownOpen && (
            <div className={`absolute right-0 mt-2 w-72 p-3.5 rounded-2xl border shadow-2xl z-50 space-y-2.5 font-mono text-xs ${
              lightTheme ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
            }`}>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-[10px] text-teal-400 uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck size={13} /> MetaMask / Web3 Active
                </span>
                <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded font-bold">Connected</span>
              </div>

              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Wallet Address</span>
                  <button onClick={handleCopy} className="text-teal-400 hover:text-teal-300 flex items-center gap-1 font-bold">
                    {copied ? <><Check size={12} className="text-emerald-400" /> Copied</> : <><Copy size={12} /> Copy</>}
                  </button>
                </div>
                <div className="text-teal-300 font-bold truncate text-[11px] select-all">{walletAddress}</div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={async () => {
                    setDropdownOpen(false);
                    if (switchAccount) {
                      await switchAccount();
                    } else {
                      await connectWallet();
                    }
                  }}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] flex items-center justify-center gap-1 transition border border-slate-700"
                >
                  <RefreshCw size={12} /> Switch Account
                </button>

                <button
                  onClick={() => {
                    disconnectWallet();
                    setDropdownOpen(false);
                  }}
                  className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 font-bold text-[11px] flex items-center justify-center gap-1 transition border border-rose-500/20"
                >
                  <LogOut size={12} /> Disconnect
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={connectWallet}
          disabled={isConnecting}
          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-teal-600 hover:from-purple-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-500/20 transition flex items-center gap-1.5 border border-purple-400/30 cursor-pointer"
          title="Connect Web3 Wallet (MetaMask / Ethereum Provider)"
        >
          <Wallet size={14} className="text-white" />
          <span>{isConnecting ? 'Opening MetaMask...' : 'Connect Wallet'}</span>
        </button>
      )}
    </div>
  );
}
