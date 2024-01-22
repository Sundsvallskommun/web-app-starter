import DefaultLayout from '@layouts/default-layout/default-layout.component';
import Main from '@layouts/main/main.component';
import { useUserStore } from '@services/user-service/user-service';
import { Link } from '@sk-web-gui/react';
import NextLink from 'next/link';
import { shallow } from 'zustand/shallow';

export const Exempelsida: React.FC = () => {
  const user = useUserStore((s) => s.user, shallow);
  console.log('user', user);
  return (
    <DefaultLayout title={`${process.env.NEXT_PUBLIC_APP_NAME} - Exempelsida`}>
      <Main>
        <div className="text-content">
          <h1>Välkommen{user.name ? ` ${user.name}` : ''}!</h1>
          <p>
            Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa.
            Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis,
            ultricies nec, pellentesque eu, pretium quis, sem.
          </p>
          {user.name ? (
            <NextLink href={`/logout`}>
              <Link as="span" variant="link">
                Logga ut
              </Link>
            </NextLink>
          ) : (
            ''
          )}
        </div>
      </Main>
    </DefaultLayout>
  );
};

export default Exempelsida;
