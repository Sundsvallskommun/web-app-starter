import { NextResponse } from 'next/server';

/**
 * Liveness probe for this container. Deliberately makes no outbound call and reads
 * no configuration — not even the health config — so readiness never depends on the
 * backend, WSO2 or a complete environment. `/api/health/up` covers the full chain.
 */
export const GET = () => {
  return NextResponse.json({ status: 'OK' }, { status: 200 });
};
