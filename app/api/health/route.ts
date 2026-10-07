import { NextResponse } from 'next/server';
import { getMode } from '@/lib/env';

export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json({
    status: 'ok',
    mode: getMode(),
    timestamp: new Date().toISOString(),
  });
}
