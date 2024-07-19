import PageHeader from '@/components/PageHeader'
import type { Liff } from '@line/liff'
import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import { Fragment } from 'react'
import { Button } from '@nextui-org/react'

const Dapp: NextPage<{ liff: Liff | null; liffError: string | null }> = ({ liff, liffError }) => {
  const router = useRouter()
  const { query } = router
  let url = ''
  if (typeof query.url == 'string') {
    url = query.url
  }

  const openDapp = () => {
    liff?.closeWindow()
    liff?.openWindow({
      url: url,
      external: false
    })
  }
  return (
    <Fragment>
      <PageHeader title="Open dApp" />
      <Button size="lg" onClick={openDapp}>
        Open
      </Button>
    </Fragment>
  )
}

export default Dapp
