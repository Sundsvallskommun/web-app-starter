import LoginGuard from '@components/login-guard/login-guard';
import { GuiProvider } from '@sk-web-gui/react';
import '@styles/tailwind.scss';
import dayjs from 'dayjs';
import 'dayjs/locale/sv';
import updateLocale from 'dayjs/plugin/updateLocale';
import utc from 'dayjs/plugin/utc';
import type { AppProps /*, AppContext */ } from 'next/app';
import { AppWrapper } from '../contexts/app.context';
import { appWithTranslation } from 'next-i18next';
import nextI18NextConfig from '../../next-i18next.config';

dayjs.extend(utc);
dayjs.locale('sv');
dayjs.extend(updateLocale);
dayjs.updateLocale('sv', {
  months: [
    'Januari',
    'Februari',
    'Mars',
    'April',
    'Maj',
    'Juni',
    'Juli',
    'Augusti',
    'September',
    'Oktober',
    'November',
    'December',
  ],
  monthsShort: ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'],
});

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <GuiProvider /** colorScheme="light"**/>
      <AppWrapper>
        <LoginGuard>
          <Component {...pageProps} />
        </LoginGuard>
      </AppWrapper>
    </GuiProvider>
  );
}

export default appWithTranslation(MyApp, nextI18NextConfig);
