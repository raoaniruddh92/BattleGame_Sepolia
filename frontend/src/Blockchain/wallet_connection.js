import Onboard from '@web3-onboard/core';
import metamaskSDK from '@web3-onboard/metamask';
import logo from '../logo.svg';
const INFURA_ID = 'e58130da3dee4d6c9f1ab1df59cbe8aa';

export const chains = [
  {
    id: 11155111,
    token: 'ETH',
    label: 'Sepolia',
    rpcUrl: `https://sepolia.infura.io/v3/${INFURA_ID}`
  }
];

export const metamaskSDKWallet = metamaskSDK({
  options: {
    extensionOnly: true,
    dappMetadata: { name: 'Demo Web3Onboard' }
  }
});

export const onboard = Onboard({
  wallets: [metamaskSDKWallet],
  chains,
  appMetadata: {
    name: 'Web3-Onboard Demo',
    icon: logo,
    description: 'Web3-Onboard Demo Application',
    recommendedInjectedWallets: [
      { name: 'MetaMask', url: 'https://metamask.io' }
    ]
  },
  connect:{ // <-- CORRECT KEY
   autoConnectLastWallet: true
    },
  accountCenter: {
      desktop: {
        enabled: true,
        position: 'topRight'
      },}
});