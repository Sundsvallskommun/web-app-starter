import LoaderFullScreen from '@components/loader/loader-fullscreen';
import { useUserStore } from '@services/user-service/user-service';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

export const LoginGuard: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const user = useUserStore(useShallow((s) => s.user));
  const getMe = useUserStore(useShallow((s) => s.getMe));

  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    getMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!mounted || (!user.name && !router.pathname.includes('/login'))) {
    return <LoaderFullScreen />;
  }

  // Routes by permissions
  // if (
  //   (router.pathname == '/route-by-permission' && !user.permissions.canEditSystemMessages)
  // ) {
  //   router.push('/');
  //   return <LoaderFullScreen />;
  // }

  return <>{children}</>;
};

export default LoginGuard;
