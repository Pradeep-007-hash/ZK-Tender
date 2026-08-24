import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const WalletContext = createContext({
  walletAddress: '',
  isConnecting: false,
  connectWallet: async () => {},
  switchAccount: async () => {},
  disconnectWallet: () => {}
});

export function WalletProvider({ children, user, onToast }) {
  const [walletAddress, setWalletAddress] = useState(() => {
    try {
      // 1. Check window.ethereum.selectedAddress if synchronously available
      if (typeof window !== 'undefined' && window.ethereum && window.ethereum.selectedAddress) {
        return window.ethereum.selectedAddress;
      }
      // 2. Check localStorage
      const saved = localStorage.getItem('zk_wallet_address');
      return (saved && typeof saved === 'string' && saved.startsWith('0x') && saved.length === 42) ? saved : '';
    } catch (e) {
      return '';
    }
  });

  const [isConnecting, setIsConnecting] = useState(false);

  // Stable ref for onToast callback
  const onToastRef = useRef(onToast);
  useEffect(() => {
    onToastRef.current = onToast;
  }, [onToast]);

  // Clean state when user logs out
  useEffect(() => {
    if (!user) {
      setWalletAddress('');
    }
  }, [user]);

  // Real-time listener for MetaMask account changes (switching accounts)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum || !window.ethereum.on) {
      return;
    }

    const handleAccountsChanged = (accounts) => {
      if (accounts && Array.isArray(accounts) && accounts.length > 0 && accounts[0]) {
        const newAddress = accounts[0];
        setWalletAddress((current) => {
          if (!current || current.toLowerCase() !== newAddress.toLowerCase()) {
            localStorage.setItem('zk_wallet_address', newAddress);
            if (onToastRef.current && current) {
              onToastRef.current(`Wallet Account Switched: ${newAddress.slice(0, 6)}...${newAddress.slice(-4)}`, 'info');
            }
            return newAddress;
          }
          return current;
        });
      }
      // Note: We deliberately do NOT clear state on empty [] to prevent intermediate MetaMask state glitches
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);

    return () => {
      if (window.ethereum && window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  // Explicit user-triggered wallet connection
  const connectWallet = useCallback(async () => {
    if (isConnecting) return null;
    setIsConnecting(true);

    if (typeof window === 'undefined' || !window.ethereum) {
      setIsConnecting(false);
      const manual = window.prompt(
        'MetaMask / Web3 extension not detected in this browser.\n\nEnter your Ethereum wallet address (0x...):',
        localStorage.getItem('zk_wallet_address') || '0x71C7656EC7ab88b098defB751B7401B5f6d8976F'
      );
      if (manual && manual.startsWith('0x') && manual.length >= 10) {
        setWalletAddress(manual);
        localStorage.setItem('zk_wallet_address', manual);
        if (onToastRef.current) onToastRef.current(`Wallet Connected: ${manual.slice(0, 6)}...${manual.slice(-4)}`, 'success');
        return manual;
      }
      if (onToastRef.current) onToastRef.current('Please install MetaMask extension to connect your Web3 wallet.', 'error');
      return null;
    }

    try {
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });

      if (accounts && Array.isArray(accounts) && accounts.length > 0 && accounts[0]) {
        const connectedAddr = accounts[0];
        setWalletAddress(connectedAddr);
        localStorage.setItem('zk_wallet_address', connectedAddr);
        if (onToastRef.current) {
          onToastRef.current(`MetaMask Connected: ${connectedAddr.slice(0, 6)}...${connectedAddr.slice(-4)}`, 'success');
        }
        setIsConnecting(false);
        return connectedAddr;
      } else {
        if (onToastRef.current) onToastRef.current('No account selected in MetaMask.', 'warning');
        setIsConnecting(false);
        return null;
      }
    } catch (err) {
      console.error('[WalletContext] User connect error:', err);
      setIsConnecting(false);
      if (err && err.code === 4001) {
        if (onToastRef.current) onToastRef.current('Connection request cancelled in MetaMask.', 'info');
      } else {
        if (onToastRef.current) onToastRef.current(`MetaMask error: ${err.message || 'Failed to connect'}`, 'error');
      }
      return null;
    }
  }, [isConnecting]);

  // Request Account Permission Switch
  const switchAccount = useCallback(async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        await window.ethereum.request({
          method: 'wallet_requestPermissions',
          permissions: [{ eth_accounts: {} }]
        });
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts && accounts.length > 0 && accounts[0]) {
          const newAddr = accounts[0];
          setWalletAddress(newAddr);
          localStorage.setItem('zk_wallet_address', newAddr);
          if (onToastRef.current) onToastRef.current(`Switched to Account: ${newAddr.slice(0, 6)}...${newAddr.slice(-4)}`, 'success');
          return newAddr;
        }
      } catch (err) {
        console.warn('[WalletContext] Switch account request fallback:', err.message);
        return connectWallet();
      }
    }
    return connectWallet();
  }, [connectWallet]);

  // User-Triggered Wallet Disconnection
  const disconnectWallet = useCallback(() => {
    setWalletAddress('');
    localStorage.removeItem('zk_wallet_address');
    if (onToastRef.current) onToastRef.current('Web3 Wallet disconnected.', 'info');
  }, []);

  return (
    <WalletContext.Provider value={{ walletAddress, isConnecting, connectWallet, switchAccount, disconnectWallet }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
