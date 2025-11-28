import './App.css';
import Onboard from '@web3-onboard/core';
import metamaskSDK from '@web3-onboard/metamask';
import { useState, useEffect } from 'react';
import logo from './logo.svg';
import { chains } from './Blockchain/wallet_connection';
import { metamaskSDKWallet } from './Blockchain/wallet_connection';
import { onboard } from './Blockchain/wallet_connection';
import { deploy_contract } from './Blockchain/deploy';

function App() {
  const [wallet, setWallet] = useState(null);
  const [contractAddress, setContractAddress] = useState(null);
  const [returnValue, setReturnValue] = useState(null);

const connect = async () => {
    const wallets = await onboard.connectWallet();
    
    if (wallets[0]) {
      setWallet(wallets[0]);
      
      // *** ADD THIS PART ***
      try {
        // Sepolia chain ID is 11155111, which should be converted to hex string for setChain
        const SEPOLIA_CHAIN_ID_HEX = '0xaa36a7'; // 11155111 in hex

        // Request the wallet to switch to the Sepolia chain
        await onboard.setChain({ chainId: SEPOLIA_CHAIN_ID_HEX });
      } catch (error) {
        console.error("Failed to switch chain to Sepolia:", error);
      }
    }
  };
useEffect(() => {
  // 1. Initial check
  const initialWallets = onboard.state.get().wallets;
  if (initialWallets.length > 0) {
    setWallet(initialWallets[0]);
  }

  // 2. Subscribe to the 'wallets' state slice
  const wallets$ = onboard.state.select('wallets');
  const subscription = wallets$.subscribe((newWallets) => { // Rename to subscription object
    if (newWallets.length > 0) {
      setWallet(newWallets[0]);
    } else {
      // Wallet has disconnected
      setWallet(null);
      setContractAddress(null);
      setReturnValue(null);
    }
  });

  // 3. Cleanup function to unsubscribe when the component unmounts
  return () => {
    // DEFENSIVE CHECK: Ensure the unsubscribe function exists before calling it.
    if (typeof subscription.unsubscribe === 'function') {
      subscription.unsubscribe();
    }
  };
}, []);
  return (
    <div className="app-container">
{!wallet ? (
  <button className="primary-btn" onClick={connect}>
    Connect Wallet
  </button>
) : (
  <button className="primary-btn" disabled>
    Wallet Connected
  </button>
)}
    </div>
  );
}

export default App;