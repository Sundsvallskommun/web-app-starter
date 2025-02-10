import Head from 'next/head';

interface EmptyLayoutProps {
  title: string;
  children: React.ReactNode;
}

export default function EmptyLayout({ title, children }: EmptyLayoutProps) {
  return (
    <div className="EmptyLayout bg-background-content text-body">
      <Head>
        <title>{title}</title>
      </Head>

      <div className="min-h-screen">{children}</div>
    </div>
  );
}
