import PageHeader from '@/components/PageHeader'
import type { Liff } from '@line/liff'
import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import { Fragment } from 'react'
import { Button, Container } from '@nextui-org/react'

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
      <Container
        display="flex"
        justify="center"
        alignItems="center"
        css={{
          width: '100%',
          height: '100%',
          paddingLeft: 0,
          paddingRight: 0
        }}
      >
        <Button size="lg" onClick={openDapp}>
          Open
        </Button>
      </Container>
    </Fragment>
  )
}

export default Dapp
