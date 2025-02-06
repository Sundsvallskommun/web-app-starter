import { Exempelsida } from '@components/pages/exempelsida';
import { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export const Index: React.FC = (props) => {
  return <Exempelsida {...props} />;
};

export const getServerSideProps: GetServerSideProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale, ['common', 'example', 'layout'])),
  },
});

export default Index;
