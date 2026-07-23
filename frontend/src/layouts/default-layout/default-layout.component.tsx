'use client';

import { CookieConsent, Footer, Header, Link } from '@sk-web-gui/react';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface DefaultLayoutProps {
  children: ReactNode;
  headerTitle?: string;
  headerSubtitle?: string;
  preContent?: ReactNode;
  postContent?: ReactNode;
  logoLinkHref?: string;
}

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'Web App Starter';

export default function DefaultLayout({
  headerTitle = appName,
  headerSubtitle = '',
  children,
  preContent,
  postContent,
  logoLinkHref = '/',
}: DefaultLayoutProps) {
  const router = useRouter();
  const { t } = useTranslation();

  const setFocusToMain = () => {
    const contentElement = document.getElementById('content');
    contentElement?.focus();
  };

  const handleLogoClick = () => {
    router.push(logoLinkHref);
  };

  return (
    <div className="DefaultLayout full-page-layout">
      <NextLink href="#content" onClick={setFocusToMain} accessKey="s" className="next-link-a">
        {t('layout:header.goto_content')}
      </NextLink>

      <Header
        title={headerTitle}
        subtitle={headerSubtitle}
        aria-label={`${headerTitle}${headerSubtitle ? ` ${headerSubtitle}` : ''}`}
        logoLinkOnClick={handleLogoClick}
      />

      {preContent}

      <div className="main-container flex-grow relative w-full flex flex-col">
        <div className="main-content-padding">{children}</div>
      </div>

      {postContent}

      <Footer />

      <CookieConsent
        title={t('layout:cookies.title', { app: appName })}
        body={
          <p>
            {t('layout:cookies.description')} <Link href="/kakor">{t('layout:cookies.read_more')}</Link>
          </p>
        }
        cookies={[
          {
            optional: false,
            displayName: t('layout:cookies.necessary.displayName'),
            description: t('layout:cookies.necessary.description'),
            cookieName: 'necessary',
          },
          {
            optional: true,
            displayName: t('layout:cookies.func.displayName'),
            description: t('layout:cookies.func.description'),
            cookieName: 'func',
          },
          {
            optional: true,
            displayName: t('layout:cookies.stats.displayName'),
            description: t('layout:cookies.stats.description'),
            cookieName: 'stats',
          },
        ]}
        resetConsentOnInit={false}
        onConsent={() => undefined}
      />
    </div>
  );
}
