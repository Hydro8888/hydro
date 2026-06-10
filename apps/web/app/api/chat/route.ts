import { streamText } from 'ai';
import { getModel, isModelAvailable } from '@ai-portal/providers';
import { getModelConfig } from '@ai-portal/shared';
import { getAuthUserId } from '@/lib/auth';
import { memoryStore } from '@/lib/memory-store';
import { z } from 'zod';

const chatRequestSchema = z.object({
  modelId: z.string().min(1).max(100),
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string().min(1).max(100_000, '메시지가 너무 깁니다.'),
      })
    )
    .min(1)
    .max(200, '대화가 너무 깁니다.'),
  conversationId: z.string().uuid().optional(),
});

export async function POST(req: Request) {
  let userId: string;
  try {
    userId = await getAuthUserId();
  } catch {
    return new Response('Unauthorized', { status: 401 });
  }

  let body;
  try { body = await req.json(); } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.issues }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { modelId, messages, conversationId } = parsed.data;

  const modelConfig = getModelConfig(modelId);
  if (!modelConfig) {
    return Response.json({ error: 'Unknown model' }, { status: 400 });
  }
  if (!isModelAvailable(modelId)) {
    return Response.json(
      { error: '선택한 모델의 API 키가 서버에 설정되지 않았습니다. 다른 모델을 선택해주세요.' },
      { status: 503 }
    );
  }

  // If a conversation is referenced, it must exist and belong to the caller.
  // Otherwise auto-create a new one owned by the caller.
  let convId = conversationId;
  if (convId) {
    const existing = memoryStore.getConversation(convId);
    if (!existing) {
      return Response.json({ error: 'Conversation not found' }, { status: 404 });
    }
    if (existing.userId !== userId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
  } else {
    const now = new Date().toISOString();
    const conv = memoryStore.createConversation({
      id: crypto.randomUUID(),
      userId,
      title: 'New Conversation',
      mode: 'single',
      modelIds: [modelId],
      messageCount: 0,
      totalTokens: 0,
      totalCost: 0,
      pinned: false,
      archived: false,
      createdAt: now,
      updatedAt: now,
    });
    convId = conv.id;
  }

  // Save the user message (last one in array)
  const lastUserMsg = messages[messages.length - 1];
  if (lastUserMsg && lastUserMsg.role === 'user') {
    memoryStore.addMessage({
      id: crypto.randomUUID(),
      conversationId: convId,
      role: 'user',
      modelId: null,
      content: lastUserMsg.content,
      inputTokens: 0,
      outputTokens: 0,
      cost: 0,
      createdAt: new Date().toISOString(),
    });
  }

  try {
    const model = getModel(modelId);

    const result = streamText({
      model,
      messages,
      onFinish: async ({ text, usage }) => {
        const inputTokens = usage.promptTokens ?? 0;
        const outputTokens = usage.completionTokens ?? 0;
        const cost =
          (inputTokens * modelConfig.pricing.inputPerMillionTokens +
            outputTokens * modelConfig.pricing.outputPerMillionTokens) /
          1_000_000;

        // Save assistant message
        memoryStore.addMessage({
          id: crypto.randomUUID(),
          conversationId: convId ?? '',
          role: 'assistant',
          modelId,
          content: text,
          inputTokens,
          outputTokens,
          cost,
          createdAt: new Date().toISOString(),
        });

        // Track usage
        memoryStore.trackUsage(userId, modelId, inputTokens, outputTokens, cost);

        console.log(
          `[chat] model=${modelId} user=${userId} tokens=${inputTokens + outputTokens} cost=$${cost.toFixed(4)}`
        );
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
