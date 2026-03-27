import { MODEL_CATALOG } from '@ai-portal/shared';

export async function GET() {
  return Response.json({ models: MODEL_CATALOG });
}
