import { default as Link } from 'next/link';
import Layout from '@layouts/layout/layout.component';
import { useAppContext } from '@contexts/app.context';
import { useEffect } from 'react';
import Router from 'next/router';
import { getMe } from '@services/user-service';

export const Exempelsida: React.FC = () => {
  const { user, setUser } = useAppContext();

  //START:/ When SAML details is entered in backend env uncomment this to test
  // useEffect(()=>{
  //   if (!user.name) {
  //     getMe().then((user) => {
  //       setUser(user);
  //     });
  //   }
  // },[user])
  //:END/

  return (
    <>
      <Layout title={`Web app starter - Exempelsida`}>
        <main className="flex-grow bg-gray-lighter pb-20 md:px-lg">
          <div className="container m-auto py-lg mb-lg">
            <div className="text-lg text-content mb-11" style={{ maxWidth: '80rem' }}>
              <h1>Välkommen{user.name ? ` ${user.name}` : ''}!</h1>
              <p>
                Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean
                massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam
                felis, ultricies nec, pellentesque eu, pretium quis, sem.
              </p>
            </div>
          </div>
        </main>
      </Layout>
    </>
  );
};

export default Exempelsida;
