'use client';

import { useUserStore } from '@services/user-service/user-service';
import { appURL } from '@utils/app-url';
import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';

export const LogoutContent: React.FC = () => {
  const resetUser = useUserStore(useShallow((s) => s.reset));

  useEffect(() => {
    resetUser();
    localStorage.clear();

    const query = new URLSearchParams({
      successRedirect: `${appURL()}/login?loggedout`,
    });
    window.location.assign(`${process.env.NEXT_PUBLIC_API_URL}/saml/logout?${query.toString()}`);
  }, []);

  return <></>;
};
