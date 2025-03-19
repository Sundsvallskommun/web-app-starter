import '@styles/tailwind.scss';
import { ReactNode } from 'react';
import AppLayout from '@layouts/app/app-layout.component';
import i18nConfig from './i18nConfig';

interface RootLayoutProps {
  children: ReactNode;
  params: { locale: string };
}

export const generateStaticParams = () => i18nConfig.locales.map((locale) => ({ locale }));

const RootLayout = async ({ children, params: { locale } }: RootLayoutProps) => {
  return (
    <html lang={locale}>
      <body>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
};

export default RootLayout;
