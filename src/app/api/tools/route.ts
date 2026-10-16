import { NextResponse } from 'next/server';
import { detectTools } from '@/lib/tools';

export async function GET() {
  const tools = await detectTools();
  return NextResponse.json(tools);
}
