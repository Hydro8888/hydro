import { streamText } from 'ai';
import { auth } from '@clerk/nextjs/server';
import { getModel } from '@ai-portal/providers';
import { getModelConfig } from '@ai-portal/shared';
import { z } from 'zod';

const chatRequestSchema = z.object({
  modelId: z.string(),
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string(),
    })
  ),
  conversationId: z.string().optional(),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const body = await req.json();
  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.issues }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { modelId, messages } = parsed.data;

  const modelConfig = getModelConfig(modelId);
  if (!modelConfig) {
    return new Response(JSON.stringify({ error: 'Unknown model' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const model = getModel(modelId);

    const result = streamText({
      model,
      messages,
      onFinish: async ({ usage }) => {
        // TODO: Persist message to DB and update usage tracking
        console.log(`[chat] model=${modelId} user=${userId} tokens=${usage.totalTokens}`);
      },
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('[chat] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate response' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
