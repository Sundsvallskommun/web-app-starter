import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { Button, FormErrorMessage } from '@sk-web-gui/react';
import EmptyLayout from '@layouts/empty-layout/empty-layout.component';
import LoaderFullScreen from '@components/loader/loader-fullscreen';
import { appURL } from '@utils/app-url';

export default function Start() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState('');
  const [mounted, setMounted] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const isLoggedOut = params.get('loggedout') === '';
  const failMessage = params.get('failMessage');

  // Turn on/off automatic login
  const autoLogin = true;

  const initalFocus = useRef(null);
  const setInitalFocus = () => {
    setTimeout(() => {
      initalFocus.current && initalFocus.current.focus();
    });
  };

  const onLogin = () => {
    // NOTE: send user to login with SSO
    const path = new URLSearchParams(window.location.search).get('path') || router.query.path || '';
    router.push({
      pathname: `${process.env.NEXT_PUBLIC_API_URL}/saml/login`,
      query: {
        successRedirect: `${appURL()}${path}`,
      },
    });
  };

  useEffect(() => {
    setInitalFocus();
    if (!router.isReady) return;
    setTimeout(() => setMounted(true), 500); // to not flash the login-screen on autologin
    if (isLoggedOut) {
      router.push(
        {
          pathname: '/login',
        },
        '/login',
        { shallow: true }
      );
    } else {
      if (!failMessage && autoLogin) {
        // autologin
        onLogin();
      } else if (failMessage === 'SAML_MISSING_GROUP') {
        setErrorMessage('Användaren saknar rätt grupper');
      } else if (failMessage === 'SAML_MISSING_ATTRIBUTES') {
        setErrorMessage('Användaren saknar rätt attribut');
      } else if (failMessage === 'MISSING_PERMISSIONS') {
        setErrorMessage('Användaren saknar rättigheter');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady]);

  if (!mounted && !failMessage) {
    // to not flash the login-screen on autologin
    return <LoaderFullScreen />;
  }

  return (
    <EmptyLayout title={`${process.env.NEXT_PUBLIC_APP_NAME} - Logga In`}>
      <main>
        <div className="flex items-center justify-center min-h-screen">
          <div className="max-w-5xl w-full flex flex-col text-light-primary bg-inverted-background-content p-20 shadow-lg text-left">
            <div className="mb-14">
              <h1 className="mb-10 text-xl">{process.env.NEXT_PUBLIC_APP_NAME}</h1>
              <p className="my-0">Beskrivning av appen</p>
            </div>

            <Button inverted onClick={() => onLogin()} ref={initalFocus} data-cy="loginButton">
              Logga in
            </Button>

            {errorMessage && <FormErrorMessage className="mt-lg">{errorMessage}</FormErrorMessage>}
          </div>
        </div>
      </main>
    </EmptyLayout>
  );
}
