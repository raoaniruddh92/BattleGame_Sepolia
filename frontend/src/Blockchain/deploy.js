import { abi } from "./data";
import { bytecode } from "./data";
import { BrowserProvider, ContractFactory } from "ethers";
import { onboard } from './wallet_connection';

export async function deploy_contract(address) {
    if (!window.ethereum) {
        throw new Error("MetaMask or other Ethereum provider not found.");
    }

    // 1. Initial 'Pending' Notification for the entire process
    const { update, dismiss } = onboard.state.actions.customNotification({
        type: 'pending',
        message: 'Contract deployment is being initiated...',
        // Set autoDismiss to 0 to keep the notification visible until manually dismissed/updated
        autoDismiss: 0
    });

    try {
        const provider = new BrowserProvider(window.ethereum);
        
        // --- Connection/Signer Setup ---
        update({ message: 'Awaiting wallet connection and signing permissions...' });
        
        await provider.send("eth_requestAccounts", []); 
        const signer = await provider.getSigner();  
        const factory = new ContractFactory(abi, bytecode, signer);

        // --- Deployment Transaction Sent ---
        update({ message: 'Awaiting user confirmation for deployment transaction...' });
        
        const contract = await factory.deploy(address);
        
        // The contract object now has a deploymentTransaction property
        const tx = contract.deploymentTransaction();
        
        // Check if transaction hash is available to display
        if (tx && tx.hash) {
            update({
                message: `Deployment transaction sent! Waiting for confirmation... (Tx Hash: ${tx.hash})`,
                // Optionally add a link to a block explorer
                // link: `https://etherscan.io/tx/${tx.hash}` // Update for the specific network
            });
        } else {
            update({ message: 'Deployment transaction sent! Waiting for confirmation...' });
        }
        
        // --- Waiting for Confirmation ---
        await contract.waitForDeployment();

        // --- Success ---
        // Once waitForDeployment resolves, the contract is mined and deployed
        update({
            type: 'success',
            message: `🎉 Contract successfully deployed! Address: ${contract.target}`,
            // Optional: link to the new contract address on a block explorer
            // link: `https://etherscan.io/address/${contract.target}` 
            autoDismiss: 5000 // Dismiss after 5 seconds
        });

        console.log(tx);
        // Note: contract.target is the deployed address in ethers v6
        return contract.target; 

    } catch (error) {
        // --- Error ---
        console.error("Deployment Error:", error);

        update({
            type: 'error',
            message: `Contract deployment failed: ${error.message || 'Check console for details.'}`,
            autoDismiss: 8000 
        });
        
        throw error;
    }
}