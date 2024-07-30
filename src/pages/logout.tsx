import PageHeader from '@/components/PageHeader'
import type { Liff } from '@line/liff'
import type { NextPage } from 'next'
import { Fragment } from 'react'
import { Web3AuthNoModal } from '@web3auth/no-modal'

const Logout: NextPage<{ liff: Liff | null; web3auth: Web3AuthNoModal | null }> = ({
  liff,
  web3auth
}) => {
  web3auth?.logout().then(() => {
    liff?.closeWindow
  })
  return (
    <Fragment>
      <PageHeader title="Logout" />
    </Fragment>
  )
}

export default Logout
