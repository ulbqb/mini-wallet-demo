import { Card, Container, Loading, Image } from '@nextui-org/react'
import { ReactNode } from 'react'

/**
 * Types
 */
interface Props {
  initialized: boolean
  children: ReactNode | ReactNode[]
}

/**
 * Container
 */
export default function CustomLayout({ children, initialized }: Props) {
  return (
    <Container
      display="flex"
      justify="center"
      alignItems="center"
      css={{
        width: '100vw',
        height: '100vh',
        paddingLeft: 0,
        paddingRight: 0
      }}
    >
      <Card
        bordered={{ '@initial': false, '@xs': true }}
        borderWeight={{ '@initial': 'light', '@xs': 'light' }}
        css={{
          height: '100%',
          width: '100%',
          justifyContent: initialized ? 'normal' : 'center',
          alignItems: initialized ? 'normal' : 'center',
          borderRadius: 0,
          paddingBottom: 0,
          '@xs': {
            borderRadius: '$lg',
            height: '95vh',
            maxWidth: '450px'
          }
        }}
      >
        {initialized ? (
          <Card.Body
            css={{
              display: 'block',
              height: '100%',
              width: '100%',
              padding: 0,
              margin: 0
            }}
          >
            {children}
          </Card.Body>
        ) : (
          <Loading />
        )}
      </Card>
    </Container>
  )
}
