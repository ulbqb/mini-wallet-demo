import { Toaster } from 'react-hot-toast'
import { useState, useEffect } from 'react'
import { createTheme, NextUIProvider } from '@nextui-org/react'

import Layout from '@/components/Layout'
import Modal from '@/components/Modal'
import useInitialization from '@/hooks/useInitialization'
import useWalletConnectEventsManager from '@/hooks/useWalletConnectEventsManager'
import { web3wallet } from '@/utils/WalletConnectUtil'
import { RELAYER_EVENTS } from '@walletconnect/core'
import { AppProps } from 'next/app'
import '../../public/main.css'
import { styledToast } from '@/utils/HelperUtil'

import type { Liff } from '@line/liff'

export default function App({ Component, pageProps }: AppProps) {
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
  }, [])

  // Provide `liff` object and `liffError` object
  // to page component as property
  pageProps.liff = liffObject
  pageProps.liffError = liffError

  // Step 1 - Initialize wallets and wallet connect client
  const initialized = useInitialization(liffObject)

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
