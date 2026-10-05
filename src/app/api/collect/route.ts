import { NextResponse } from 'next/server';

/**
 * Manual collection trigger (admin). One run at a time per web process:
 * repeated clicks used to start N concurrent collections (N× translation cost).
 */
let inFlight = false;

export async function POST() {
  if (inFlight) {
    return NextResponse.json({ status: 'already_running' }, { status: 409 });
  }

  try {
    // Dynamically import the collector so it is not bundled into the main edge chunk.
    const { collectAll } = await import('@/workers/collector');

    inFlight = true;
    // Fire-and-forget: do not await so the HTTP response is returned immediately
    collectAll()
      .catch((err) => console.error('[POST /api/collect] collectAll failed', err))
      .finally(() => {
        inFlight = false;
      });

    return NextResponse.json({ status: 'started' }, { status: 202 });
  } catch (err) {
    inFlight = false;
    // If the collector module does not exist yet, surface a clear error
    console.error('[POST /api/collect]', err);
    return NextResponse.json(
      { error: 'Collector module not available' },
      { status: 503 }
    );
  }
}
