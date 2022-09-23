import Head from 'next/head';
import { Link, CookieConsent, Header, Footer, UserMenu } from '@sk-web-gui/react';
import NextLink from 'next/link';
import { useRef } from 'react';
import SK_logo from '../../public/svg/SK_logo.svg';
import Image from 'next/future/image';

export default function Layout({ title, children }) {
  const initialFocus = useRef(null);
  const setInitialFocus = () => {
    setTimeout(() => {
      initialFocus.current && initialFocus.current.focus();
    });
  };
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content="Web app starter" />
      </Head>

      <NextLink href="#content" passHref>
        <a
          onClick={() => setInitialFocus()}
          accessKey="s"
          className="sr-only focus:not-sr-only bg-primary-light border-2 border-black p-4 text-black inline-block focus:absolute focus:top-0 focus:left-0 focus:right-0 focus:m-auto focus:w-80 text-center"
        >
          Hoppa till innehåll
        </a>
      </NextLink>

      <Header title={`Web app starter`} LogoLinkWrapperComponent={<NextLink href={'/'} passHref />} />

      {children}

      <CookieConsent
        title="Kakor på Web app starter"
        body={
          <p>
            Vi använder kakor, cookies, för att ge dig en förbättrad upplevelse, sammanställa statistik och för att viss
            nödvändig funktionalitet ska fungera på webbplatsen.{' '}
            <NextLink href="/kakor" passHref>
              <Link>Läs mer om hur vi använder kakor</Link>
            </NextLink>
          </p>
        }
        cookies={[
          {
            optional: false,
            displayName: 'Nödvändiga kakor',
            description:
              'Dessa kakor är nödvändiga för att webbplatsen ska fungera och kan inte stängas av i våra system.',
            cookieName: 'necessary',
          },
          {
            optional: true,
            displayName: 'Funktionella kakor',
            description: ' Dessa kakor ger förbättrade funktioner på webbplatsen.',
            cookieName: 'func',
          },
          {
            optional: true,
            displayName: 'Kakor för statistik',
            description:
              'Dessa kakor tillåter oss att räkna besök och trafikkällor, så att vi kan mäta och förbättra prestanda på vår webbplats.',
            cookieName: 'stats',
          },
        ]}
        resetConsentOnInit={false}
        onConsent={(cookies) => {
          // FIXME: do stuff with cookies?
        }}
      />

      <Footer color="gray">
        <div className="flex justify-between gap-16 md:gap-32">
          <Image className="h-[42px] w-auto" src={SK_logo} alt="Sundsvalls Kommun logotyp" />
        </div>
      </Footer>
    </>
  );
}
