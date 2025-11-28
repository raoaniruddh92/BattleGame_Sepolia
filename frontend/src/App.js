import './App.css';
// import Onboard from '@web3-onboard/core'; // Not strictly needed here if imported via wallet_connection
// import metamaskSDK from '@web3-onboard/metamask'; // Not strictly needed here
import { useState, useEffect } from 'react';
import logo from './logo.svg'; 
// NOTE: Make sure the paths below are correct based on your project structure
import { onboard } from './Blockchain/wallet_connection'; 
import { deploy_contract } from './Blockchain/deploy';

function App() {
  const [wallet, setWallet] = useState(null);
  const [contractAddress, setContractAddress] = useState(null);
  const [deploying, setDeploying] = useState(false); // New state for loading
  const [error, setError] = useState(null); // New state for errors
  // You can keep returnValue if you plan to call contract functions later
  // const [returnValue, setReturnValue] = useState(null); 

  // --- Wallet Connection Logic ---
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
      // Optional: Display connection error to the user
      setError("Failed to connect wallet or switch chain.");
    }
  };

  // --- Contract Deployment Logic ---
  const handleDeploy = async () => {
    if (!wallet) {
      alert("Please connect your wallet first.");
      return;
    }

    setDeploying(true); // Start loading state
    setContractAddress(null); // Clear previous result
    setError(null); // Clear previous errors
    
    try {
      // NOTE: The deploy_contract function expects an 'address' argument.
      // Assuming this is the address for the contract's constructor, 
      // we'll use the connected wallet's address as an example.
      const walletAddress = wallet.accounts[0].address;

      // The deploy_contract function includes the onboard notifications
      const newContractAddress = await deploy_contract(walletAddress); 
      
      setContractAddress(newContractAddress);
      
    } catch (err) {
      console.error("Contract Deployment Error:", err);
      // The deploy_contract function already shows an Onboard error notification,
      // but we update the local state here too.
      setError(err.message || "Contract deployment failed.");
    } finally {
      setDeploying(false); // End loading state
    }
  };


  // --- Wallet Subscription Effect ---
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
        // setReturnValue(null); 
      }
    });

    return () => {
      if (typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, []);

  // --- JSX Rendering ---
  return (
    <div className="app-container">
      <header className="app-header">
        <img src={logo} className="App-logo" alt="logo" />
        <h1>Smart Contract Deployment DApp</h1>
      </header>
      
      <div className="button-group">
        {/* Wallet Connection Button */}
        {!wallet ? (
          <button className="primary-btn" onClick={connect}>
            Connect Wallet
          </button>
        ) : (
          <button className="primary-btn wallet-connected" disabled>
            Wallet Connected: {wallet.accounts[0].address.substring(0, 6)}...
          </button>
        )}
        
        {/* Deployment Button */}
        <button 
          className="secondary-btn" 
          onClick={handleDeploy} 
          disabled={!wallet || deploying}
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