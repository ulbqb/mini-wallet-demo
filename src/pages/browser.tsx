import PageHeader from '@/components/PageHeader'
import type { Liff } from '@line/liff'
import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import { Fragment, useEffect, useState } from 'react'
import ModalStore from '@/store/ModalStore'
import { parseUri } from '@walletconnect/utils'
import { styledToast } from '@/utils/HelperUtil'
import { web3wallet } from '@/utils/WalletConnectUtil'
import { Input } from '@nextui-org/react'

const Browser: NextPage<{ liff: Liff | null; liffError: string | null }> = ({
  liff,
  liffError
}) => {
  const router = useRouter()
  const { query } = router
  let url = ''
  if (typeof query.url == 'string') {
    url = query.url
  }

  useEffect(() => {
    window.addEventListener('message', (e: MessageEvent) => {
      if (e.data.type == 'display_uri') {
        ModalStore.open('LoadingModal', { loadingMessage: '' })
        const deepLink = e.data.data
        if (deepLink) {
          onConnect(deepLink)
        }
      }
    })
  }, [])

  async function onConnect(deepLink: string) {
    const { topic: pairingTopic } = parseUri(deepLink)
    // if for some reason, the proposal is not received, we need to close the modal when the pairing expires (5mins)
    const pairingExpiredListener = ({ topic }: { topic: string }) => {
      if (pairingTopic === topic) {
        styledToast('Pairing expired. Please try again with new Connection URI', 'error')
        ModalStore.close()
        web3wallet.core.pairing.events.removeListener('pairing_expire', pairingExpiredListener)
      }
    }
    web3wallet.once('session_proposal', () => {
      web3wallet.core.pairing.events.removeListener('pairing_expire', pairingExpiredListener)
    })
    try {
      web3wallet.core.pairing.events.on('pairing_expire', pairingExpiredListener)
      await web3wallet.pair({ uri: deepLink })
    } catch (error) {
      styledToast((error as Error).message, 'error')
      ModalStore.close()
    } finally {
    }
  }

  function setLineFlag(url: string): string {
    const parsedUrl = new URL(url)
    parsedUrl.searchParams.append('is_line', '')
    return parsedUrl.toString()
  }

  return (
    <Fragment>
      <PageHeader title="Browser" />
      <Input css={{ width: '100%' }} disabled readOnly bordered value={url} />
      <iframe
        src={setLineFlag(url)}
        style={{
          position: 'relative',
          top: 10,
          left: 0,
          bottom: 0,
          right: 0,
          width: '100%',
          height: '80%',
          border: 'none',
          margin: 0,
          padding: 0,
          overflow: 'hidden'
        }}
      >
        {"Your browser doesn't support iframes"}
      </iframe>
    </Fragment>
  )
}

export default Browser
