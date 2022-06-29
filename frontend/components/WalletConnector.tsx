import Fab from "@mui/material/Fab";
import Backdrop from "@mui/material/Backdrop";
import { useEffect, useState } from "react";
import { GameConnection } from "../game/game-connection";

//const testnetChainId = '0x6357d2e0'
const localChainId = "0x7a69"; //31337
const devnetChainId = "0x635ae020"; //1666900000
const testnetChainId = devnetChainId; //because is disabled
const mainnetChainId = "0x63564c40"; // 1666600000

// const testnetConfig = {
//   chainId: testnetChainId,
//   chainName: 'Harmony Testnet',
//   nativeCurrency: {
//     name: 'ONE',
//     symbol: 'ONE',
//     decimals: 18
//   },
//   rpcUrls: ['https://api.s0.b.hmny.io'],
//   blockExplorerUrls: ['https://explorer.pops.one']
// };

const localConfig = {
  chainId: localChainId,
  chainName: "Local",
  nativeCurrency: {
    name: "ONE",
    symbol: "ONE",
    decimals: 18,
  },
  rpcUrls: ["http://localhost:8545"],
  blockExplorerUrls: ["http://localhost:8080"],
};

const devnetConfig = {
  chainId: testnetChainId,
  chainName: "Harmony Devnet",
  nativeCurrency: {
    name: "ONE",
    symbol: "ONE",
    decimals: 18,
  },
  rpcUrls: ["https://api.s0.ps.hmny.io"],
  blockExplorerUrls: ["https://explorer.ps.hmny.io/"],
};

const mainnetConfig = {
  chainId: mainnetChainId,
  chainName: "Harmony Mainnet",
  nativeCurrency: {
    name: "ONE",
    symbol: "ONE",
    decimals: 18,
  },
  // rpcUrls: ['https://api.harmony.one'], // not working
  rpcUrls: ["https://harmony-mainnet.chainstacklabs.com"],
  blockExplorerUrls: ["https://explorer.harmony.one/"],
};

const testnetConfig = devnetConfig; //because is disabled
const chains = [localConfig, devnetConfig, mainnetConfig];

interface IMyProps {
  connectionHandle: () => Promise<void>;
}

// source code form https://github.com/socathie/zkApp
export default function WalletConnector(props: IMyProps) {
  let ethereum: any = undefined;

  const [currentAccount, setCurrentAccount] = useState<string | null>(null);
  const [currentChain, setCurrentChain] = useState<string | null>(null);
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
    const accounts = await ethereum.request({ method: "eth_accounts" });

    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account: ", account);
      setCurrentAccount(account);
    } else {
      console.log("No authorized account found");
    }
  };

  const connectWalletHandler = async () => {
    try {
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      console.log("Found an account! Address: ", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (err) {
      console.log(err);
    }
  };

  function isValidChain(chainId: any) {
    return chainId === testnetChainId || chainId === localChainId || chainId === devnetChainId || chainId === mainnetChainId;
  }

  const checkChainId = async () => {
    let chainId = await ethereum.request({ method: "eth_chainId" });
    console.log("Chain ID:", chainId, parseInt(chainId));
    setCorrectChain(isValidChain(chainId));
    const chainName = chains.find((chain) => chain.chainId === chainId)?.chainName;
    setCurrentChain(chainName?chainName:"Unknown");
  };

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
    let chainId = await ethereum.request({ method: "eth_chainId" });

    if (!isValidChain(chainId)) {
      try {
        await ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [
            {
              chainId: testnetChainId,
            },
          ], // chainId must be in hexadecimal numbers
        });
        chainId = await ethereum.request({ method: "eth_chainId" });
      } catch (error: any) {
        // This error code indicates that the chain has not been added to MetaMask
        // if it is not, then install it into the user MetaMask
        if (error.code === 4902) {
          try {
            await ethereum.request({
              method: "wallet_addEthereumChain",
              params: [testnetConfig],
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
    setCorrectChain(isValidChain(chainId));
  };

  const changeAccount = async () => {
    await ethereum.request({
      method: "wallet_requestPermissions",
      params: [
        {
          eth_accounts: {},
        },
      ],
    });
    window.location.reload();
  };

  useEffect(() => {
    init();
    checkConnection();
  });

  const ConnectWalletFab = () => {
    return (
      <div>
        <Backdrop open={true} />
        <Fab variant="extended" color="primary" onClick={connectWalletHandler}>
          Connect Wallet
        </Fab>
      </div>
    );
  };

  const WrongNetworkFab = () => {
    return (
      <div>
        <Backdrop open={true} />
        <Fab variant="extended" color="secondary" onClick={changeChainId}>
          Wrong Network
        </Fab>
      </div>
    );
  };

  const AccountFab = () => {
    return (
      <Fab color="primary" variant="extended" onClick={changeAccount}>
         {currentChain} | {currentAccount?.slice(0, 8)}...{currentAccount?.slice(-5)}
      </Fab>
    );
  };

  return <div>{currentAccount && correctChain ? <AccountFab /> : currentAccount ? <WrongNetworkFab /> : <ConnectWalletFab />}</div>;
}
