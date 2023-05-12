import DefaultLayout from '@layouts/default-layout/default-layout.component';
import { useUserStore } from '@services/user-service/user-service';
import ContentCard from '@components/content-card/content-card';
import { Link } from '@sk-web-gui/react';
import NextLink from 'next/link';
import { shallow } from 'zustand/shallow';

export const Exempelsida: React.FC = () => {
  const user = useUserStore((s) => s.user, shallow);

  return (
    <DefaultLayout title={`Web app starter - Exempelsida`}>
      <ContentCard>
        <div className="text-lg text-content mb-11">
          <h1>Välkommen{user.name ? ` ${user.name}` : ''}!</h1>
          <p>
            Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa.
            Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis,
            ultricies nec, pellentesque eu, pretium quis, sem.
          </p>
          {user.name ? (
            <NextLink href={`${process.env.NEXT_PUBLIC_API_URL}/saml/logout`}>
              <Link as="span">Logga ut</Link>
            </NextLink>
          ) : (
            ''
          )}
        </div>
      </ContentCard>
    </DefaultLayout>
  );
};

export default Exempelsida;
