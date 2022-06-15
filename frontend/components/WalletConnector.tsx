import Fab from '@mui/material/Fab';
import Backdrop from '@mui/material/Backdrop';
import { useEffect, useState } from 'react';
import { GameConnection } from '../game/game-connection';

const testnetChainId = '0x6357d2e0'
const localChainId = '0x7a69' //31337
const devnetChainId = '0x635ae020' //1666900000

interface IMyProps {
  connectionHandle: () => Promise<void>;
}

// source code form https://github.com/socathie/zkApp
export default function WalletConnector(props: IMyProps) {
  let ethereum:any = undefined;

  const [currentAccount, setCurrentAccount] = useState<string | null>(null);
  const [correctChain, setCorrectChain] = useState<boolean | null>(null);


  function init() {
    ethereum = window.ethereum as any;
    if (!ethereum) {
      alert("Make sure you have Metamask installed!");
    } else {
      ethereum.on("chainChanged", () => {
        window.location.reload();
      });
      ethereum.on("accountsChanged", () => {
        window.location.reload();
      });
    }
  }


  const checkWalletIsConnected = async () => {

    const accounts = await ethereum.request({ method: 'eth_accounts' });

    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account: ", account);
      setCurrentAccount(account);
    } else {
      console.log("No authorized account found");
    }
  }

  const connectWalletHandler = async () => {
    try {
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      console.log("Found an account! Address: ", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (err) {
      console.log(err)
    }
  }

  const checkChainId = async () => {
    let chainId = await ethereum.request({ method: 'eth_chainId' });
    console.log("Chain ID:", chainId, parseInt(chainId));

    setCorrectChain(chainId === testnetChainId || chainId === localChainId || chainId === devnetChainId); ;
  }

  const checkConnection = async () => {
   await checkWalletIsConnected();
   await checkChainId();
   if (currentAccount && correctChain) {
    try {
      await props.connectionHandle();
    } catch (err) {
      console.log(err);
    }
   }
  };

  const changeChainId = async () => {
    let chainId = await ethereum.request({ method: 'eth_chainId' });

    if (chainId !== testnetChainId) {
      try {
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{
            chainId: testnetChainId
          }], // chainId must be in hexadecimal numbers
        });
        chainId = await ethereum.request({ method: 'eth_chainId' });
      } catch (error:any) {
        // This error code indicates that the chain has not been added to MetaMask
        // if it is not, then install it into the user MetaMask
        if (error.code === 4902) {
          try {
            await ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: testnetChainId,
                  chainName: 'Harmony Testnet',
                  nativeCurrency: {
                    name: 'ONE',
                    symbol: 'ONE',
                    decimals: 18
                  },
                  rpcUrls: ['https://api.s0.b.hmny.io'],
                  blockExplorerUrls: ['https://explorer.pops.one']
                },
              ],
            });
          } catch (addError) {
            console.error(addError);
          }
        }
        console.error(error);
      }
      window.location.reload();
    }
    console.log(chainId);
    setCorrectChain(chainId === testnetChainId);
  }

  const changeAccount = async () => {
    await ethereum.request({
      method: 'wallet_requestPermissions',
      params: [{
        eth_accounts: {},
      }]
    });
    window.location.reload();
  }

  useEffect(() => {
    init();
    checkConnection();
  })


  const ConnectWalletFab = () => {
    return (
      <div>
        <Backdrop open={true} />
        <Fab variant="extended" color="primary" onClick={connectWalletHandler}>
          Connect Wallet
        </Fab>
      </div>
    )
  }

  const WrongNetworkFab = () => {
    return (
      <div>
        <Backdrop open={true} />
        <Fab variant="extended" color="secondary" onClick={changeChainId} >
          Wrong Network
        </Fab>
      </div>
    )
  }

  const AccountFab = () => {
    return (
      <Fab variant="extended" onClick={changeAccount}>
        {currentAccount?.slice(0, 8)}...{currentAccount?.slice(-5)}
      </Fab>
    )
  }

  return (
    <div>
      {(currentAccount && correctChain) ? <AccountFab /> : (currentAccount ? <WrongNetworkFab /> : <ConnectWalletFab />)}
    </div>
  )
}
