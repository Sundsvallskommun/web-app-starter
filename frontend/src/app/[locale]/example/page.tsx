'use client';

import DefaultLayout from '@layouts/default-layout/default-layout.component';
import Main from '@layouts/main/main.component';
import { useUserStore } from '@services/user-service/user-service';
import { Link } from '@sk-web-gui/react';
import { useTranslation } from 'react-i18next';
import NextLink from 'next/link';
import { capitalize } from 'underscore.string';
import { useShallow } from 'zustand/react/shallow';

const Exempelsida: React.FC = () => {
  const user = useUserStore(useShallow((s) => s.user));
  const { t } = useTranslation();
  console.log('user', user);
  return (
    <DefaultLayout>
      <Main>
        <div className="text-content">
          <h1>{`${capitalize(t('example:welcome'))}${user.name ? ` ${user.name}` : ''}!`}</h1>
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

export default Exempelsida;
