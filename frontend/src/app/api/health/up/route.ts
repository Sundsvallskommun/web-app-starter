import axios from 'axios';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

const requireAuth = process.env.HEALTH_AUTH === 'true';
const authUsername = process.env.HEALTH_USERNAME;
const authPassword = process.env.HEALTH_PASSWORD;

export const GET = async () => {
  const headersList = await headers();
  const authorization = headersList.get('authorization');
  const userAuth64 = Buffer.from(`${authUsername}:${authPassword}`).toString('base64');

  if (requireAuth && authorization !== `Basic ${userAuth64}`) {
    return new NextResponse('NOT_AUTHORIZED', { status: 401 });
  }

  try {
    // TLS certificates are validated by default. For a self-signed backend in local dev,
    // start Node with NODE_TLS_REJECT_UNAUTHORIZED=0 rather than disabling it in code.
    const health = await axios.get<unknown>(`${process.env.NEXT_PUBLIC_API_URL}/health/up`).then((res) => res.data);

    return new NextResponse(JSON.stringify(health), { status: 200 });
  } catch (error) {
    return new NextResponse(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
        status: 'ERROR!',
      }),
      { status: 500 }
    );
  }
};
