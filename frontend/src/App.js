import './App.css';
// import Onboard from '@web3-onboard/core';
// import metamaskSDK from '@web3-onboard/metamask';
import { useState, useEffect } from 'react';
import logo from './logo.svg'; 
// NOTE: Make sure the paths below are correct based on your project structure
import { onboard } from './Blockchain/wallet_connection'; 
import { deploy_contract } from './Blockchain/deploy';

function App() {
  const [wallet, setWallet] = useState(null);
  const [contractAddress, setContractAddress] = useState(null);
  const [deploying, setDeploying] = useState(false);
  const [error, setError] = useState(null);
  
  // --- NEW STATE for Player 2 Address ---
  const [player2AddressInput, setPlayer2AddressInput] = useState('');

  // --- Wallet Connection Logic (Unchanged) ---
  const connect = async () => {
    try {
      const wallets = await onboard.connectWallet();
      
      if (wallets[0]) {
        setWallet(wallets[0]);
        
        // Request the wallet to switch to the Sepolia chain
        // Sepolia chain ID is 11155111, which should be converted to hex string for setChain
        const SEPOLIA_CHAIN_ID_HEX = '0xaa36a7'; 
        await onboard.setChain({ chainId: SEPOLIA_CHAIN_ID_HEX });
      }
    } catch (err) {
      console.error("Wallet connection failed:", err);
      setError("Failed to connect wallet or switch chain.");
    }
  };

  // --- Contract Deployment Logic (Modified) ---
  const handleDeploy = async () => {
    if (!wallet) {
      alert("Please connect your wallet first.");
      return;
    }
    
    // --- NEW VALIDATION ---
    if (!player2AddressInput) {
        alert("Please enter the second player's address.");
        return;
    }
    // Basic address format check (optional but recommended)
    if (!player2AddressInput.startsWith('0x') || player2AddressInput.length !== 42) {
        alert("Please enter a valid Ethereum address (must be 42 characters long, starting with 0x).");
        return;
    }
    
    setDeploying(true);
    setContractAddress(null);
    setError(null);
    
    try {
      // NOTE: Passing the collected player2AddressInput to the deploy function
      const newContractAddress = await deploy_contract(player2AddressInput); 
      
      setContractAddress(newContractAddress);
      
    } catch (err) {
      console.error("Contract Deployment Error:", err);
      // The deploy_contract function already shows an Onboard error notification,
      // but we update the local state here too.
      setError(err.message || "Contract deployment failed.");
    } finally {
      setDeploying(false);
    }
  };


  // --- Wallet Subscription Effect (Unchanged) ---
  useEffect(() => {
    const initialWallets = onboard.state.get().wallets;
    if (initialWallets.length > 0) {
      setWallet(initialWallets[0]);
    }

    const wallets$ = onboard.state.select('wallets');
    const subscription = wallets$.subscribe((newWallets) => {
      if (newWallets.length > 0) {
        setWallet(newWallets[0]);
      } else {
        // Wallet has disconnected
        setWallet(null);
        setContractAddress(null);
        setDeploying(false);
        setError(null);
        setPlayer2AddressInput(''); // Reset Player 2 input on disconnect
      }
    });

    return () => {
      if (typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, []);

  // --- JSX Rendering (Modified) ---
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Battle an opponent</h1>
      </header>
      
      {/* --- NEW: Input Field for Player 2 --- */}
      <div className="input-group">
        <label htmlFor="player2-address">Player 2 Address:</label>
        <input
          id="player2-address"
          type="text"
          placeholder="Enter Player 2's Ethereum Address (0x...)"
          value={player2AddressInput}
          onChange={(e) => setPlayer2AddressInput(e.target.value)}
          disabled={deploying}
          className="address-input"
        />
      </div>
      <hr/>
      
      <div className="button-group">
        {/* Wallet Connection Button */}
        {!wallet ? (
          <button className="primary-btn" onClick={connect}>
            Connect Wallet
          </button>
        ) : (
          <p className="wallet-connected-text">
            Wallet Connected: **{wallet.accounts[0].address.substring(0, 6)}...** (Player 1)
          </p>
        )}
        
        {/* Deployment Button */}
        <button 
          className="secondary-btn" 
          onClick={handleDeploy} 
          // Disable if not connected, deploying, or Player 2 address is missing
          disabled={!wallet || deploying || !player2AddressInput} 
        >
          {deploying ? 'Deploying...' : 'Deploy Contract'}
        </button>
      </div>

      {/* Deployment Status Display */}
      <div className="status-display">
        {deploying && <p className="status-pending">🚀 Deployment in progress. Check Onboard notifications.</p>}
        
        {contractAddress && (
          <p className="status-success">
            ✅ **Contract Deployed!**
            <br />
            Address: <a 
              href={`https://sepolia.etherscan.io/address/${contractAddress}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="contract-link"
            >
              {contractAddress}
            </a>
          </p>
        )}
        
        {error && (
          <p className="status-error">
            ❌ **Error:** {error}
          </p>
        )}
      </div>
    </div>
  );
}

export default App;