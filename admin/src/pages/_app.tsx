import '@styles/tailwind.scss';
import 'dayjs/locale/sv';

import { MyApp } from '@layouts/app/app-layout.component';
import dayjs from 'dayjs';
import updateLocale from 'dayjs/plugin/updateLocale';
import utc from 'dayjs/plugin/utc';
import { appWithTranslation, UserConfig } from 'next-i18next/pages';

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

const withTranslation = appWithTranslation(MyApp, nextI18NextConfig as UserConfig);

export default withTranslation;
