interface FlashCard {
  front_content: string;
  back_content: string;
}

interface GenerateFlashCardsResponse {
  cards: FlashCard[];
  error?: string;
}

interface GenerateCollectionInfoResponse {
  name: string;
  description: string;
  error?: string;
}

interface GenerateNotesResponse {
  notes: string;
  error?: string;
}

interface Collection {
  id: string;
  name: string;
  topics: string[];
  description: string;
}

const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
const BASE_URL = 'https://openrouter.ai/api/v1';
const MAX_RETRIES = 2; // Maximum number of retries for failed requests

const headers = {
  'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
  'Content-Type': 'application/json',
  'HTTP-Referer': 'https://zapcards.app',
  'X-Title': 'ZapCards'
};


export async function generateFlashCards(content: string, topics: string, existingCards: FlashCard[] = [], retryCount = 0): Promise<GenerateFlashCardsResponse> {
  try {
    // Create a context string from existing cards
    const existingCardsContext = existingCards.length > 0
      ? `\nExisting flashcards (DO NOT duplicate these):\n${existingCards.map(card => 
          `- Front: ${card.front_content}\n  Back: ${card.back_content}`
        ).join('\n')}\n`
      : '';

    const prompt = `Generate study flashcards based on the following content and topics. The content is: "${content}"

    Topics: ${topics}

    ${existingCardsContext}

    Instructions:
    1. Generate clear and concise flashcards
    2. Each flashcard should have a front (question/concept) and back (answer/explanation)
    3. Make sure the content is accurate and educational
    4. Focus on key concepts and important details
    5. Include a mix of definition, concept, and relationship cards
    6. Ensure the content is relevant to the specified topics
    7. Format each card as a JSON object with front_content and back_content fields
    8. Return an array of card objects

    Example format:
    [
      {
        "front_content": "What is the capital of France?",
        "back_content": "Paris"
      },
      {
        "front_content": "Define photosynthesis",
        "back_content": "The process by which plants convert light energy into chemical energy"
      }
    ]`;

    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'deepseek/deepseek-r1:free',
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant specialized in generating study flashcards based on user-provided information. Your task is to generate high-quality study flashcards efficiently. You MUST only respond with valid JSON arrays.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      })
    });

    // Check if the response is ok
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as { error?: { message?: string } };
      const errorMessage = errorData.error?.message || `API request failed with status ${response.status}`;
      
      // Implement retry logic for server errors (5xx) or rate limiting (429)
      if ((response.status >= 500 || response.status === 429) && retryCount < MAX_RETRIES) {
        console.log(`Retrying request (${retryCount + 1}/${MAX_RETRIES})...`);
        // Exponential backoff: wait longer between each retry
        const backoffTime = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        return generateFlashCards(content, topics, existingCards, retryCount + 1);
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const generatedContent = data.choices?.[0]?.message?.content;
    if (!generatedContent) {
      throw new Error('No content generated');
    }

    // Clean and normalize the response content
    const cleanedContent = generatedContent.trim();
    
    // Try direct JSON parse first
    try {
      const cards: FlashCard[] = JSON.parse(cleanedContent);
      return { cards };
    } catch (directParseError) {
      // If direct parse fails, try to extract JSON array using regex
      const jsonMatch = cleanedContent.match(/\[\s*{[^]*}\s*\]/);
      if (jsonMatch) {
        try {
          const cards: FlashCard[] = JSON.parse(jsonMatch[0]);
          return { cards };
        } catch (extractedParseError) {
          // If both parsing attempts fail, try to extract individual card objects
          const cardMatches = cleanedContent.match(/{[^}]+}/g);
          if (cardMatches) {
            const cards: FlashCard[] = [];
            for (const cardMatch of cardMatches) {
              try {
                const card = JSON.parse(cardMatch);
                if (card.front_content && card.back_content) {
                  cards.push(card);
                }
              } catch (e) {
                // Skip invalid card objects
                continue;
              }
            }
            if (cards.length > 0) {
              return { cards };
            }
          }
        }
      }
      
      // If all parsing attempts fail, return error
      return {
        cards: [],
        error: 'Failed to parse response as valid flashcards'
      };
    }

  } catch (error: any) {
    console.error('Error generating flashcards:', error);
    return {
      cards: [],
      error: error.message || 'Failed to generate flashcards'
    };
  }
}

export async function generateCollectionInfo(topic: string, topics: string = 'General'): Promise<GenerateCollectionInfoResponse> {
  try {
    // Primero detectamos el idioma del input
    const languageDetectionPrompt = `Detect the language of this text and respond with only the ISO 639-1 language code (e.g., 'es' for Spanish, 'en' for English, 'ja' for Japanese): "${topic}"`;

    const languageResponse = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'deepseek/deepseek-r1:free',
        messages: [
          {
            role: 'system',
            content: 'You are a language detection expert. Respond only with the ISO 639-1 language code.'
          },
          {
            role: 'user',
            content: languageDetectionPrompt
          }
        ],
        temperature: 0.1,
        max_tokens: 10,
      })
    });

    if (!languageResponse.ok) {
      throw new Error('Failed to detect language');
    }

    const languageData = await languageResponse.json() as { choices?: Array<{ message?: { content?: string } }> };
    const detectedLanguage = languageData.choices?.[0]?.message?.content?.trim() || 'en';

    // Ahora generamos el contenido en el idioma detectado
    const prompt = `Based on the following topic or concept, generate a short name and a detailed description that can be used to create flashcards. The topic is: "${topic}"

    Topics: ${topics}

    Specific instructions:
    1. For the name:
       - Must be short (maximum 4-5 words)
       - Must be direct and descriptive
       - You can use emojis to make it more engaging
       - Do not use quotes, asterisks, or any other formatting symbols
       - Example: 📚 World War II History

    2. For the description:
       - Must be comprehensive and detailed enough to generate at least 10-15 flashcards
       - Include specific facts, definitions, concepts, and relationships
       - Structure the content in clear sections:
         * Main concept and its definition
         * Key components or elements
         * Important characteristics and properties
         * Historical context or background (if applicable)
         * Examples and real-world applications
         * Relationships with other concepts
         * Common misconceptions or challenges
         * Practical applications or use cases
       - Include specific numbers, dates, or measurements when relevant
       - Use concrete examples and analogies
       - Avoid vague or general statements
       - Make sure each section has enough detail to generate multiple flashcards
       - DO NOT use any formatting symbols like:
         * Asterisks (*)
         * Hyphens (-)
         * Quotes (' or ")
         * Bold (**)
         * Italics (_)
         * Bullet points or lists with symbols

    IMPORTANT: Generate the response in ${detectedLanguage} language. The description should be detailed enough to create multiple flashcards.

    Response format:
    NAME: [short and direct name]
    DESCRIPTION: [detailed and structured description]`;

    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'deepseek/deepseek-r1:free',
        messages: [
          {
            role: 'system',
            content: `You are an expert in creating structured educational content. Your goal is to generate concise names and detailed descriptions that facilitate the creation of effective flashcards. The description should be comprehensive enough to generate at least 10-15 flashcards. Include specific facts, examples, and relationships between concepts. Make sure each section has enough detail to create multiple flashcards. IMPORTANT: Do not use any formatting symbols in the generated text, except for emojis in the name. Generate the response in ${detectedLanguage} language.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as { error?: { message?: string } };
      const errorMessage = errorData.error?.message || `API request failed with status ${response.status}`;
      throw new Error(errorMessage);
    }

    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const generatedContent = data.choices?.[0]?.message?.content;
    
    if (!generatedContent) {
      throw new Error('No content generated');
    }

    const content = generatedContent.trim();
    const nameMatch = content.match(/NAME:\s*(.*?)(?:\n|$)/);
    const descriptionMatch = content.match(/DESCRIPTION:\s*(.*?)(?:\n|$)/s);

    if (!nameMatch || !descriptionMatch) {
      throw new Error('No se pudo generar el contenido en el formato esperado');
    }

    return {
      name: nameMatch[1].trim(),
      description: descriptionMatch[1].trim()
    };

  } catch (error: any) {
    console.error('Error generating collection info:', error);
    return {
      name: '',
      description: '',
      error: error.message || 'Failed to generate collection info'
    };
  }
}

export async function generateFolderNotes(collections: Collection[], retryCount = 0): Promise<GenerateNotesResponse> {
  try {
    const prompt = `Based on the following collections and their content, generate clear and concise study notes that summarize the key concepts and relationships between them. The collections are:

${collections.map(c => `- ${c.name} (Topics: ${c.topics.join(', ')})
  Content: ${c.description}`).join('\n\n')}

Follow these rules:
1. Create a coherent narrative that connects the topics
2. Highlight key relationships between different collections
3. Keep the notes clear and concise but informative
4. Include important concepts from each collection
5. Structure the notes in a logical way
6. Use simple language that's easy to understand
7. Focus on practical applications and real-world connections
8. Include specific examples and details from the content
9. Show how concepts from different collections complement each other

The notes should be written in a way that helps understand how these topics relate to each other and form a broader knowledge context.`;

    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'deepseek/deepseek-r1:free',
        messages: [
          {
            role: 'system',
            content: 'You are an expert in creating concise and effective study notes. Your goal is to generate clear, structured notes that help students understand relationships between different topics.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as { error?: { message?: string } };
      const errorMessage = errorData.error?.message || `API request failed with status ${response.status}`;
      
      if ((response.status >= 500 || response.status === 429) && retryCount < MAX_RETRIES) {
        console.log(`Retrying request (${retryCount + 1}/${MAX_RETRIES})...`);
        const backoffTime = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        return generateFolderNotes(collections, retryCount + 1);
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const generatedContent = data.choices?.[0]?.message?.content;
    
    if (!generatedContent) {
      throw new Error('No content generated');
    }

    return {
      notes: generatedContent.trim()
    };

  } catch (error: any) {
    console.error('Error generating folder notes:', error);
    return {
      notes: '',
      error: error.message || 'Failed to generate folder notes'
    };
  }
}