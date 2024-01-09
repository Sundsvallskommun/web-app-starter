import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { Button, FormErrorMessage } from '@sk-web-gui/react';
import EmptyLayout from '@layouts/empty-layout/empty-layout.component';
import LoaderFullScreen from '@components/loader/loader-fullscreen';

export default function Start() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState('');
  const params = new URLSearchParams(window.location.search);
  const isLoggedOut = params.get('loggedout') === '';
  const failMessage = params.get('failMessage');

  const initalFocus = useRef(null);
  const setInitalFocus = () => {
    setTimeout(() => {
      initalFocus.current && initalFocus.current.focus();
    });
  };

  const onLogin = () => {
    // NOTE: send user to login with SSO
    const path = new URLSearchParams(window.location.search).get('path') || router.query.path;
    router.push(`${process.env.NEXT_PUBLIC_API_URL}/saml/login?path=${path || ''}`);
  };

  useEffect(() => {
    setInitalFocus();
    if (isLoggedOut) {
      window.history.replaceState(null, '', '/login');
    } else if (!failMessage && router.isReady) {
      onLogin();
    } else if (failMessage === 'SAML_MISSING_GROUP') {
      setErrorMessage('Användaren saknar rätt grupper');
    } else if (failMessage === 'SAML_MISSING_ATTRIBUTES') {
      setErrorMessage('Användaren saknar rätt attribut');
    } else if (failMessage === 'MISSING_PERMISSIONS') {
      setErrorMessage('Användaren saknar rättigheter');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, isLoggedOut, failMessage]);

  if (!failMessage && !isLoggedOut) {
    return <LoaderFullScreen />;
  }

  return (
    <EmptyLayout title={`${process.env.NEXT_PUBLIC_APP_NAME} - Logga In`}>
      <main>
        <div className="flex items-center justify-center min-h-screen">
          <div className="max-w-5xl w-full flex flex-col bg-white p-20 shadow-lg text-left">
            <div className="mb-14">
              <h1 className="mb-10 text-xl">{process.env.NEXT_PUBLIC_APP_NAME}</h1>
              <p className="my-0">Beskrivning av appen</p>
            </div>

            <Button onClick={() => onLogin()} ref={initalFocus} data-cy="loginButton">
              Logga in
            </Button>

            {errorMessage && <FormErrorMessage className="mt-lg">{errorMessage}</FormErrorMessage>}
          </div>
        </div>
      </main>
    </EmptyLayout>
  );
}
