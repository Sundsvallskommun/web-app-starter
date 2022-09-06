import Head from "next/head";

export default function EmptyLayout({ title, children }) {
    return (
        <>
            <Head>
                <title>{title}</title>
            </Head>

            <div className="bg-gray-lighter min-h-screen">
                {children}
            </div>
        </>
    )
}