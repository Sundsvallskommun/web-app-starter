import DefaultLayout from '@layouts/default-layout/default-layout.component';
import Main from '@layouts/main/main.component';
import { useUserStore } from '@services/user-service/user-service';
import { Link } from '@sk-web-gui/react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import NextLink from 'next/link';
import { capitalize } from 'underscore.string';
import { useShallow } from 'zustand/react/shallow';

export const Exempelsida: React.FC = () => {
  const user = useUserStore(useShallow((s) => s.user));
  const { t } = useTranslation();
  console.log('user', user);
  return (
    <DefaultLayout title={`${process.env.NEXT_PUBLIC_APP_NAME} - ${t('example:title')}`}>
      <Main>
        <div className="text-content">
          <h1>
            {capitalize(`${t('common:welcome')}
            ${user.name ? ` ${user.name}` : ''}!`)}
          </h1>
          <p>{t('example:description')}</p>
          {user.name ?
            <NextLink href={`/logout`}>
              <Link as="span" variant="link">
                {capitalize(t('common:logout'))}
              </Link>
            </NextLink>
          : ''}
        </div>
      </Main>
    </DefaultLayout>
  );
};

export const getServerSideProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale, ['common', 'example', 'layout'])),
  },
});

export default Exempelsida;
