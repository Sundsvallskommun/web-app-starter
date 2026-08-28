import { useUserStore } from '@services/user-service/user-service';
import { apiURL } from '@utils/api-url';
import { appURL } from '@utils/app-url';
import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';

export default function Logout() {
  const resetUser = useUserStore(useShallow((s) => s.reset));

  useEffect(() => {
    resetUser();
    localStorage.clear();

    const url = new URL(apiURL('/saml/logout'));
    url.search = new URLSearchParams({
      successRedirect: `${appURL()}/login?loggedout`,
    }).toString();
    globalThis.location.assign(url.toString());
  }, [resetUser]);

  return <></>;
}
