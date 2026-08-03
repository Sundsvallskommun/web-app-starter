'use client';

import LeadButtons from '@layouts/button-groups/lead-buttons';
import { useUserStore } from '@services/user-service/user-service';
import { Button } from '@sk-web-gui/react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';

const Example = () => {
  const router = useRouter();
  const user = useUserStore(useShallow((state) => state.user));
  const { t } = useTranslation();

  const displayName = user.name.trim() || t('example:anonymous_user');

  return (
    <div className="flex flex-col gap-32 text-content max-w-screen-lg">
      <section className="flex flex-col gap-16">
        <h1>{t('example:title')}</h1>
        <p className="text-large">{t('example:description')}</p>
      </section>

      <section className="grid gap-24 md:grid-cols-2">
        <div className="flex flex-col gap-12 rounded-sm border border-divider p-24 bg-background-content">
          <h2 className="text-h4-md">{t('example:layout_heading')}</h2>
          <p>{t('example:layout_body')}</p>
        </div>

        <div className="flex flex-col gap-12 rounded-sm border border-divider p-24 bg-background-content">
          <h2 className="text-h4-md">{t('example:state_heading')}</h2>
          <p>{t('example:state_body', { name: displayName })}</p>
        </div>
      </section>

      <LeadButtons>
        <Button
          onClick={() => {
            router.push('/login');
          }}
        >
          {t('example:primary_action')}
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            router.push('/logout');
          }}
        >
          {t('example:secondary_action')}
        </Button>
      </LeadButtons>
    </div>
  );
};

export default Example;
