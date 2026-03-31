import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Dynamically import the collector so it is not bundled into the main edge chunk.
    // collectAll is expected to return void / Promise<void> and handles its own logging.
    const { collectAll } = await import('@/workers/collector');

    // Fire-and-forget: do not await so the HTTP response is returned immediately
    collectAll().catch((err) =>
      console.error('[POST /api/collect] collectAll failed', err)
    );

    return NextResponse.json({ status: 'started' }, { status: 202 });
  } catch (err) {
    // If the collector module does not exist yet, surface a clear error
    console.error('[POST /api/collect]', err);
    return NextResponse.json(
      { error: 'Collector module not available' },
      { status: 503 }
    );
  }
}
