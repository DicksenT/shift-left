import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { desc } = await req.json();

  const { text } = await generateText({
    model: openai('gpt-4o-mini'),
  system: `
You are a security expert. Explain the vulnerability clearly in one sentence using fewer than 25 words. Avoid repeating phrases or ideas. Do not use formatting or technical jargon.
`.trim(),
    prompt: desc,
  });

  return NextResponse.json({data: text},{status: 200})
}
