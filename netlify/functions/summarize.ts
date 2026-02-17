import { Handler } from '@netlify/functions';

interface SummaryRequest {
  messages: string;
  sourceLanguage: string;
  targetLanguage: string;
  totalMessages: number;
  totalWords: number;
  duration: string;
}

interface SummaryResponse {
  summary: string;
  keyPoints: string[];
  errors: string[];
  statistics: {
    totalMessages: number;
    totalWords: number;
    duration: string;
    languagesUsed: string[];
  };
}

const handler: Handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'OpenAI API key not configured' }),
      };
    }

    const body = JSON.parse(event.body || '{}') as SummaryRequest;
    const { messages, sourceLanguage, targetLanguage, totalMessages, totalWords, duration } = body;

    if (!messages) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Messages are required' }),
      };
    }

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a conversation analyst. Analyze the following conversation between two people speaking ${sourceLanguage} and ${targetLanguage}. 
            
            Provide:
            1. A brief summary (2-3 sentences) of the conversation
            2. Key points discussed (as an array of strings)
            3. Any errors or issues detected (as an array of strings)
            
            Return the response as JSON with keys: summary, keyPoints, errors`,
          },
          {
            role: 'user',
            content: `Analyze this conversation:\n\n${messages}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json() as any;
      console.error('OpenAI API error:', errorData);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to generate summary' }),
      };
    }

    const openaiData = await openaiResponse.json() as any;
    const content = openaiData.choices?.[0]?.message?.content;

    if (!content) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'No response from OpenAI' }),
      };
    }

    // Parse the response
    let parsedContent: any;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedContent = JSON.parse(jsonMatch[0]);
      } else {
        parsedContent = {
          summary: content,
          keyPoints: [],
          errors: [],
        };
      }
    } catch {
      parsedContent = {
        summary: content,
        keyPoints: [],
        errors: [],
      };
    }

    const response: SummaryResponse = {
      summary: parsedContent.summary || content,
      keyPoints: Array.isArray(parsedContent.keyPoints) ? parsedContent.keyPoints : [],
      errors: Array.isArray(parsedContent.errors) ? parsedContent.errors : [],
      statistics: {
        totalMessages,
        totalWords,
        duration,
        languagesUsed: [sourceLanguage, targetLanguage],
      },
    };

    return {
      statusCode: 200,
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

export { handler };
