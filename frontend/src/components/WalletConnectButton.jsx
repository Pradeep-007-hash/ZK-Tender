import React, { useState, useEffect, useRef } from 'react';
import { Wallet, Check, Copy, LogOut, ShieldCheck, ChevronDown } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';

export default function WalletConnectButton({ user, onToast, lightTheme = false }) {
  const { walletAddress, isConnecting, connectWallet, disconnectWallet } = useWallet();
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
                ? 'bg-white border-teal-500/60 text-slate-900 hover:bg-teal-50/60 shadow-slate-200' 
                : 'bg-slate-900/90 border-teal-500/50 text-teal-300 hover:bg-slate-800'
            }`}
            title={`Connected Real Web3 Wallet: ${walletAddress}`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <Wallet size={14} className={lightTheme ? "text-teal-600" : "text-teal-400"} />
            <span>{shortAddress}</span>
            <ChevronDown size={13} className={lightTheme ? "text-slate-500" : "text-slate-400"} />
          </button>

          {dropdownOpen && (
            <div className={`absolute right-0 mt-2 w-72 p-3.5 rounded-2xl border shadow-2xl z-50 space-y-2.5 font-mono text-xs ${
              lightTheme ? 'bg-white border-slate-200 text-slate-900 shadow-slate-300/50' : 'bg-slate-900 border-slate-800 text-white'
            }`}>
              <div className={`flex items-center justify-between border-b pb-2 ${lightTheme ? 'border-slate-100' : 'border-slate-800'}`}>
                <span className={`font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 ${
                  lightTheme ? 'text-teal-600' : 'text-teal-400'
                }`}>
                  <ShieldCheck size={13} /> MetaMask / Web3 Active
                </span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                  lightTheme ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-emerald-500/20 text-emerald-400'
                }`}>Connected</span>
              </div>

              <div className={`p-2.5 rounded-xl border space-y-1 ${
                lightTheme ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}>
                <div className={`flex items-center justify-between text-[10px] ${lightTheme ? 'text-slate-500' : 'text-slate-400'}`}>
                  <span>Wallet Address</span>
                  <button onClick={handleCopy} className={`flex items-center gap-1 font-bold ${
                    lightTheme ? 'text-teal-600 hover:text-teal-700' : 'text-teal-400 hover:text-teal-300'
                  }`}>
                    {copied ? <><Check size={12} className={lightTheme ? "text-emerald-600" : "text-emerald-400"} /> Copied</> : <><Copy size={12} /> Copy</>}
                  </button>
                </div>
                <div className={`font-bold truncate text-[11px] select-all ${
                  lightTheme ? 'text-teal-800' : 'text-teal-300'
                }`}>{walletAddress}</div>
              </div>

              <div className="pt-1">
                <button
                  onClick={() => {
                    disconnectWallet();
                    setDropdownOpen(false);
                  }}
                  className={`w-full p-2 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1 transition border ${
                    lightTheme
                      ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                      : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border-rose-500/20'
                  }`}
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
          className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition flex items-center gap-1.5 border cursor-pointer ${
            lightTheme
              ? 'bg-gradient-to-r from-teal-600 via-indigo-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white shadow-md shadow-teal-500/20 border-teal-400/40'
              : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-teal-600 hover:from-purple-500 hover:to-teal-500 text-white shadow-lg shadow-indigo-500/20 border-purple-400/30'
          }`}
          title="Connect Web3 Wallet (MetaMask / Ethereum Provider)"
        >
          <Wallet size={14} className="text-white" />
          <span>{isConnecting ? 'Opening MetaMask...' : 'Connect Wallet'}</span>
        </button>
      )}
    </div>
  );
}
