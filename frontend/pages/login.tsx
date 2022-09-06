import NextLink from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useAppContext } from '../contexts/app.context';
import EmptyLayout from '../components/empty-layout/empty-layout.component';
import { useRouter } from 'next/router';
import { Link, Button } from '@sk-web-gui/react';

export default function Start() {
    const router = useRouter();

    const initalFocus = useRef(null);
    const setInitalFocus = () => {
        setTimeout(() => {
            initalFocus.current && initalFocus.current.focus();
        });
    };

    const onLogin = () => {
        // NOTE: send user to login with SSO
        router.push(`${process.env.NEXT_PUBLIC_API_URL}/saml/login`);
    };

    useEffect(() => {
        setInitalFocus();
    }, []);

    return (
        <>
            <EmptyLayout title="Web app starter - Logga In">
                <main>
                    <div className="flex items-center justify-center min-h-screen">
                        <div className="max-w-5xl w-full flex flex-col bg-white p-20 shadow-lg text-left">
                            <div className="mb-14">
                                <h1 className="mb-10 text-xl">Web app starter</h1>
                                <p className="my-0">Beskrivning av appen</p>
                            </div>

                            <Button
                                variant="solid"
                                color="primary"
                                onClick={() => onLogin()}
                                ref={initalFocus}
                                data-cy="loginButton"
                            >Logga in</Button>
                        </div>
                    </div>
                </main>
            </EmptyLayout>
        </>
    )
}
