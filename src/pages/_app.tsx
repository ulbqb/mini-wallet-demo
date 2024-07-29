import { Toaster } from 'react-hot-toast'
import { useState, useEffect } from 'react'
import { createTheme, NextUIProvider } from '@nextui-org/react'

import Layout from '@/components/Layout'
import Modal from '@/components/Modal'
import useInitialization from '@/hooks/useInitialization'
import useWalletConnectEventsManager from '@/hooks/useWalletConnectEventsManager'
import { web3wallet } from '@/utils/WalletConnectUtil'
import { RELAYER_EVENTS } from '@walletconnect/core'
import { CHAIN_NAMESPACES, IProvider, WALLET_ADAPTERS, WEB3AUTH_NETWORK } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { Web3AuthNoModal } from "@web3auth/no-modal";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import { AppProps } from 'next/app'
import '../../public/main.css'
import { styledToast } from '@/utils/HelperUtil'

import type { Liff } from '@line/liff'

const clientId = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID

const chainConfig = {
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    chainId: "0x1", // Please use 0x1 for Mainnet
    rpcTarget: "https://rpc.ankr.com/eth",
    displayName: "Ethereum Mainnet",
    blockExplorerUrl: "https://etherscan.io/",
    ticker: "ETH",
    tickerName: "Ethereum",
    logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
};

const privateKeyProvider = new EthereumPrivateKeyProvider({ config: { chainConfig } });

const web3auth = new Web3AuthNoModal({
    clientId,
    web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
    privateKeyProvider,
});

const openloginAdapter = new OpenloginAdapter({
    adapterSettings: {
        uxMode: "redirect",
        loginConfig: {
            jwt: {
                verifier: "line-liff-jwt-verifier",
                typeOfLogin: "jwt",
                clientId: clientId,
            },
        },
    },
    privateKeyProvider,
});
web3auth.configureAdapter(openloginAdapter);

export default function App({ Component, pageProps }: AppProps) {
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [privKey, setPrivKey] = useState("");
  // LIFF
  const [liffObject, setLiffObject] = useState<Liff | null>(null)
  const [liffError, setLiffError] = useState<string | null>(null)

  // Execute liff.init() when the app is initialized
  useEffect(() => {
    // to avoid `window is not defined` error
    import('@line/liff')
      .then(liff => liff.default)
      .then(liff => {
        console.log('LIFF init...')
        const size = new URLSearchParams(window.location.search).get('size')
        console.log(`Size is ${size}`)
        let liffId = process.env.NEXT_PUBLIC_LIFF_ID_FULL!
        switch (size) {
          case 'tall':
            liffId = process.env.NEXT_PUBLIC_LIFF_ID_TALL!
            break
          case 'compact':
            liffId = process.env.NEXT_PUBLIC_LIFF_ID_COMPACT!
            break
        }
        liff
          .init({ liffId })
          .then(() => {
            console.log('LIFF init succeeded.')
            setLiffObject(liff)
          })
          .catch((error: Error) => {
            console.log('LIFF init failed.')
            setLiffError(error.toString())
          })
      })

    const init = async () => {
      try {
        // IMP START - SDK Initialization
        await web3auth.init();
        // IMP END - SDK Initialization
        setProvider(web3auth.provider);
        console.log(web3auth)

        if (web3auth.connected) {
          setLoggedIn(true);
        } else {
          let web3authProvider
          console.log(web3auth)
          if (liff?.isInClient()) {
            const id_token = liff?.getIDToken()
            web3authProvider = await web3auth.connectTo(WALLET_ADAPTERS.OPENLOGIN, {
              loginProvider: "jwt",
              extraLoginOptions: {
                id_token: id_token, // in JWT Format
                verifierIdField: "sub", // same as your JWT Verifier ID
              },
            });
          }
          web3authProvider = await web3auth.connectTo(WALLET_ADAPTERS.OPENLOGIN, {
            loginProvider: "line",
          });
          setProvider(web3authProvider);
          if (web3auth.connected) {
            setLoggedIn(true);
          }
        }
      } catch (error) {
        console.error(error);
      }
    }
    init()
  }, [])

  useEffect(() => {
    const keyGet = async () => {
      if (!provider) {
        console.log("provider not initialized yet");
        return;
      }
      // get privatekey request
      const privateKey = await provider.request({
        method: "eth_private_key"
      })
      if (typeof privateKey === "string") {
        setPrivKey(privateKey)
      }
    }
    keyGet()
    console.log(privKey)
  }, [provider])

  // Provide `liff` object and `liffError` object
  // to page component as property
  pageProps.liff = liffObject
  pageProps.liffError = liffError

  // Step 1 - Initialize wallets and wallet connect client
  const initialized = useInitialization(privKey)

  // Step 2 - Once initialized, set up wallet connect event manager
  useWalletConnectEventsManager(initialized)
  useEffect(() => {
    if (!initialized) return
    web3wallet?.core.relayer.on(RELAYER_EVENTS.connect, () => {
      styledToast('Network connection is restored!', 'success')
    })

    web3wallet?.core.relayer.on(RELAYER_EVENTS.disconnect, () => {
      styledToast('Network connection lost.', 'error')
    })
  }, [initialized])
  return (
    <NextUIProvider theme={createTheme({ type: 'dark' })}>
      <Layout initialized={initialized}>
        <Toaster />
        <Component {...pageProps} />
      </Layout>

      <Modal />
    </NextUIProvider>
  )
}
