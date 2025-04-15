import '@styles/tailwind.scss';
import { ReactNode } from 'react';
import AppLayout from '@layouts/app/app-layout.component';
import i18nConfig from './i18nConfig';
import { headers } from 'next/headers';

interface RootLayoutProps {
  children: ReactNode;
}

export const generateStaticParams = () => i18nConfig.locales.map((locale) => ({ locale }));

const RootLayout = async ({ children }: RootLayoutProps) => {
  const headerList = await headers();
  const path = headerList.get('x-path') ?? '';

  const validLocale = i18nConfig.locales.find(locale => path.startsWith(`/${locale}/`) || path === `/${locale}`);
  const locale = validLocale ?? i18nConfig.defaultLocale;

  return (
    <html lang={locale}>
      <body>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
};

export default RootLayout;
