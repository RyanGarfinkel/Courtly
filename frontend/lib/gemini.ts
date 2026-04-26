import { GoogleGenerativeAI } from '@google/generative-ai';

const MAX_RETRIES = 3;
const MODEL = 'gemini-3.1-flash-lite-preview';

export async function generateText(prompt: string): Promise<string>
{
	const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
	const model = genAI.getGenerativeModel({ model: MODEL });

	for(let attempt = 0; attempt < MAX_RETRIES; attempt++)
	{
		try
		{
			const result = await model.generateContent(prompt);
			return result.response.text();
		}
		catch(e: any)
		{
			if(attempt < MAX_RETRIES - 1 && e?.status === 503)
			{
				await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
				continue;
			}
			throw e;
		}
	}
	throw new Error('Max retries exceeded');
}
