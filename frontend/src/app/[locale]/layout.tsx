import { ReactNode } from 'react';
import { headers } from 'next/headers';
import LocalizationProvider from '@components/localization-provider/localization-provider';
import initLocalization from '../i18n';

interface LocaleLayoutProps {
  children: ReactNode;
  params: { locale: string };
}

const namespaces = ['common', 'paths', 'layout', 'login', 'example'];

const LocaleLayout = async ({ children, params: { locale } }: LocaleLayoutProps) => {
  const { resources } = await initLocalization(locale, namespaces);

  return <LocalizationProvider {...{ locale, resources, namespaces }}>{children}</LocalizationProvider>;
};

export const generateMetadata = async ({ params: { locale } }: LocaleLayoutProps) => {
  const { t } = await initLocalization(locale, namespaces);
  const path = headers().get('x-path');

  const pathName =
    !path ? null : (
      path
        .replace(/^\/?/, '') // Remove leading slash
        .split('/') // Split into sections
        .map(
          (s) =>
            `${s.substring(0, 1).toUpperCase()}${s.substring(1)}` // Capitalize the first letter
              .replace('-', ' ') // Replace separators
        )
        .join(', ')
    ); // Comma separate sections

  const title =
    path ?
      `${process.env.NEXT_PUBLIC_APP_NAME} - ${t(`paths:${path}.title`, { defaultValue: pathName })}`
    : process.env.NEXT_PUBLIC_APP_NAME;
  const description = t(`paths:${path}.description`, { defaultValue: '' });

  return {
    title,
    description,
  };
};

export default LocaleLayout;
