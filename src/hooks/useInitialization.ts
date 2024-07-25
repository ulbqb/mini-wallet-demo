import SettingsStore from '@/store/SettingsStore'
import { createOrRestoreCosmosWallet } from '@/utils/CosmosWalletUtil'
import { createOrRestoreEIP155Wallet } from '@/utils/EIP155WalletUtil'
import { createOrRestoreSolanaWallet } from '@/utils/SolanaWalletUtil'
import { createOrRestorePolkadotWallet } from '@/utils/PolkadotWalletUtil'
import { createOrRestoreNearWallet } from '@/utils/NearWalletUtil'
import { createOrRestoreMultiversxWallet } from '@/utils/MultiversxWalletUtil'
import { createOrRestoreTronWallet } from '@/utils/TronWalletUtil'
import { createOrRestoreTezosWallet } from '@/utils/TezosWalletUtil'
import { createWeb3Wallet, web3wallet } from '@/utils/WalletConnectUtil'
import { createOrRestoreKadenaWallet } from '@/utils/KadenaWalletUtil'
import { CHAIN_NAMESPACES, IProvider, WALLET_ADAPTERS, UX_MODE, WEB3AUTH_NETWORK } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { Web3AuthNoModal } from "@web3auth/no-modal";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSnapshot } from 'valtio'
import useSmartAccounts from './useSmartAccounts'
import { Liff } from "@line/liff";

const sleep = async (ms: number) => new Promise((res) => setTimeout(res, ms));

export default function useInitialization(liff: Liff | null) {
  const [initialized, setInitialized] = useState(false)
  const prevRelayerURLValue = useRef<string>('')

  const { relayerRegionURL } = useSnapshot(SettingsStore.state)
  const { initializeSmartAccounts } = useSmartAccounts()

  const onInitialize = useCallback(async () => {
    try {
      // Wait for LIFF to initialize
      console.log(new Date)
      await sleep(5000)
      console.log(new Date)

      const clientId = "BAvU0yqzqJ_QoZ0ebPVAwC8wb6g3RDzQAtvRUsBfkofe26S0cAOvOjr-Y4Ofg-FeFql0YTnCEMI-u_qq7PI7S38"; // get from https://dashboard.web3auth.io

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
              clientId: "BAvU0yqzqJ_QoZ0ebPVAwC8wb6g3RDzQAtvRUsBfkofe26S0cAOvOjr-Y4Ofg-FeFql0YTnCEMI-u_qq7PI7S38",
            },
          },
        },
        privateKeyProvider,
      });
      web3auth.configureAdapter(openloginAdapter);

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
      const { eip155Addresses, eip155Wallets } = createOrRestoreEIP155Wallet()
      const { cosmosAddresses } = await createOrRestoreCosmosWallet()
      const { solanaAddresses } = await createOrRestoreSolanaWallet()
      const { polkadotAddresses } = await createOrRestorePolkadotWallet()
      const { nearAddresses } = await createOrRestoreNearWallet()
      const { multiversxAddresses } = await createOrRestoreMultiversxWallet()
      const { tronAddresses } = await createOrRestoreTronWallet()
      const { tezosAddresses } = await createOrRestoreTezosWallet()
      const { kadenaAddresses } = await createOrRestoreKadenaWallet()
      await initializeSmartAccounts(eip155Wallets[eip155Addresses[0]].getPrivateKey())

      SettingsStore.setEIP155Address(eip155Addresses[0])
      SettingsStore.setCosmosAddress(cosmosAddresses[0])
      SettingsStore.setSolanaAddress(solanaAddresses[0])
      SettingsStore.setPolkadotAddress(polkadotAddresses[0])
      SettingsStore.setNearAddress(nearAddresses[0])
      SettingsStore.setMultiversxAddress(multiversxAddresses[0])
      SettingsStore.setTronAddress(tronAddresses[0])
      SettingsStore.setTezosAddress(tezosAddresses[0])
      SettingsStore.setKadenaAddress(kadenaAddresses[0])
      await createWeb3Wallet(relayerRegionURL)
      setInitialized(true)
    } catch (err: unknown) {
      console.error('Initialization failed', err)
      alert(err)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [relayerRegionURL])

  // restart transport if relayer region changes
  const onRelayerRegionChange = useCallback(() => {
    try {
      web3wallet?.core?.relayer.restartTransport(relayerRegionURL)
      prevRelayerURLValue.current = relayerRegionURL
    } catch (err: unknown) {
      alert(err)
    }
  }, [relayerRegionURL])

  useEffect(() => {
    if (!initialized) {
      onInitialize()
    }
    if (prevRelayerURLValue.current !== relayerRegionURL) {
      onRelayerRegionChange()
    }
  }, [initialized, onInitialize, relayerRegionURL, onRelayerRegionChange])

  return initialized
}
