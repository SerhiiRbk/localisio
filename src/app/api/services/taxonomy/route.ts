// ============================================================
// GET /api/services/taxonomy - Get service taxonomy
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServiceTaxonomy } from '@/lib/services/taxonomy';

export const revalidate = 3600; // Cache for 1 hour

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'en';

    const taxonomy = await getServiceTaxonomy(locale);

    return NextResponse.json(taxonomy, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Error fetching service taxonomy:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    );
  }
}
