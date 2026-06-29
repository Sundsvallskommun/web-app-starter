import { ListResources } from '@components/list-resources/list-resources';
import { ListToolbar } from '@components/list-toolbar/list-toolbar';
import resources from '@config/resources';
import { ResourceName } from '@interfaces/resource-name';
import DefaultLayout from '@layouts/default-layout/default-layout.component';
import { Header } from '@layouts/header/header.component';
import Main from '@layouts/main/main.component';
import { Spinner } from '@sk-web-gui/react';
import { stringToResourceName } from '@utils/stringToResourceName';
import { useResource } from '@utils/use-resource';
import { GetServerSideProps } from 'next';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next/pages';
import { serverSideTranslations } from 'next-i18next/pages/serverSideTranslations';
import { useEffect } from 'react';
import { capitalize } from 'underscore.string';

export const Exempelsida: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();

  const { resource: _resource } = useParams();
  const parsedResource = stringToResourceName(typeof _resource === 'object' ? (_resource[0] ?? '') : (_resource ?? ''));
  const resource: ResourceName = parsedResource ?? (Object.keys(resources)[0] as ResourceName);

  const { data, refresh, loaded, loading } = useResource(resource);

  useEffect(() => {
    if (!parsedResource) {
      router.push('/').catch((error: unknown) => {
        console.error('Failed to redirect from unknown resource.', error);
      });
    }
  }, [parsedResource, router]);

  const getProperties = () => {
    const firstRow = data?.[0];
    return firstRow ?
        Object.keys(firstRow).filter((key) => {
          const type = typeof firstRow[key];
          return type === 'string' || type === 'number' || type === 'boolean';
        })
      : undefined;
  };

  return (
    resource && (
      <DefaultLayout title={`${capitalize(t(`${resource}:name_many`))} - ${process.env.NEXT_PUBLIC_APP_NAME}`}>
        <Main>
          <Header>
            <span className="flex flex-row gap-16">
              <h1 className="leading-h4-sm">{capitalize(t(`${resource}:name_many`))}</h1>
              {loading && <Spinner size={2.5} className="leading-h4-sm" />}
            </span>
            <ListToolbar resource={resource} onRefresh={refresh} properties={getProperties()} />
          </Header>
          {loaded && <ListResources resource={resource} data={data} />}
        </Main>
      </DefaultLayout>
    )
  );
};

export const getServerSideProps: GetServerSideProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale, ['common', 'layout', 'crud', ...Object.keys(resources)])),
  },
});

export default Exempelsida;
