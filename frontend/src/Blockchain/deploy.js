import { abi } from "./Abi";
import { bytecode } from "./bytecode";
import { BrowserProvider, ContractFactory } from "ethers";

export async function deploy_contract(address) {
    if (!window.ethereum) {
        throw new Error("MetaMask or other Ethereum provider not found.");
    }
    const provider = new BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []); 
    const signer = await provider.getSigner();  

}