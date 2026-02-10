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
const REQUEST_TIMEOUT_MS = 5000;

/** Modelos FREE en orden de preferencia: fallback automático si uno falla (No endpoints, 429, timeout) */
export const OPENROUTER_FALLBACK_MODELS = [
  'arcee-ai/trinity-large-preview:free',
  'stepfun/step-3.5-flash:free',
  'nvidia/nemotron-3-nano-30b-a3b:free',
] as const;

const OPENROUTER_MODEL =
  process.env.EXPO_PUBLIC_OPENROUTER_MODEL ?? OPENROUTER_FALLBACK_MODELS[0];

const headers = {
  'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
  'Content-Type': 'application/json',
  'HTTP-Referer': 'https://zapiens.app',
  'X-Title': 'Zapiens',
};

/** Mensaje amigable cuando OpenRouter rechaza por política de privacidad (modelos free) */
const DATA_POLICY_ERROR_USER_MESSAGE =
  'Los modelos gratuitos requieren permitir "Model Training" en tu cuenta. Entra en https://openrouter.ai/settings/privacy y activa la opción de entrenamiento para modelos free, luego vuelve a intentar.';

function normalizeOpenRouterError(message: string): string {
  if (/data policy|No endpoints found|Free model training/i.test(message)) {
    return DATA_POLICY_ERROR_USER_MESSAGE;
  }
  return message;
}

export interface OpenRouterFallbackResult {
  content: string;
  modelUsed: string;
}

/** Cuerpo de request sin model (se inyecta por intento) */
type OpenRouterBody = {
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  max_tokens?: number;
};

/**
 * Llama a OpenRouter probando cada modelo en orden. Timeout 5s por intento.
 * Maneja "No endpoints found", 429, timeouts y errores de red.
 */
export async function callOpenRouterWithFallback(
  body: OpenRouterBody,
  options: { timeoutMs?: number } = {}
): Promise<OpenRouterFallbackResult> {
  const timeoutMs = options.timeoutMs ?? REQUEST_TIMEOUT_MS;
  const models = [...OPENROUTER_FALLBACK_MODELS];
  let lastError: Error | null = null;

  for (let i = 0; i < models.length; i++) {
    const model = models[i];

    try {
      const requestPromise = fetch(`${BASE_URL}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model,
          messages: body.messages,
          temperature: body.temperature ?? 0.7,
          max_tokens: body.max_tokens ?? 2000,
        }),
      });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
      );
      const response = await Promise.race([requestPromise, timeoutPromise]);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as { error?: { message?: string } };
        const rawMsg = errorData.error?.message || `HTTP ${response.status}`;
        throw new Error(normalizeOpenRouterError(rawMsg));
      }

      const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
      const content = data.choices?.[0]?.message?.content;
      if (content == null || content === '') {
        throw new Error('No content generated');
      }

      console.log(`✅ ZAPIENS IA: modelo usado "${model}"`);
      return { content: content.trim(), modelUsed: model };
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const message = lastError.message || 'Unknown error';
      console.warn(`❌ Modelo ${model} falló:`, message);
      if (i === models.length - 1) {
        const friendlyMessage = normalizeOpenRouterError(message);
        throw new Error(friendlyMessage);
      }
    }
  }

  const finalMessage = lastError?.message ?? 'No endpoints available';
  throw new Error(normalizeOpenRouterError(finalMessage));
}

// ——— Cache en memoria para lecciones (evita re-generar mismo topic en la sesión) ———
const lessonCache = new Map<string, string>();

export interface GenerateLessonResponse {
  content: string;
  modelUsed?: string;
  error?: string;
}

const PROMPT_TEMPLATE_LESSON = (topic: string) =>
  `Genera una lección gamificada sobre "${topic}".

REQUIREMENTS:
- Estructura clara: introducción, conceptos clave, ejemplos, resumen.
- Tono didáctico y ameno, apto para estudiar con flashcards después.
- Incluye 1-2 preguntas de autoevaluación al final.
- Responde en el mismo idioma que el tema.`;

/**
 * Genera contenido de lección gamificada para un tema. Usa Trinity → StepFun → Nemotron con fallback.
 * Cache en memoria por topic para no re-generar en la misma sesión.
 */
export async function generateLesson(topic: string, _maxRetries = 3): Promise<GenerateLessonResponse> {
  const cacheKey = topic.trim().toLowerCase();
  const cached = lessonCache.get(cacheKey);
  if (cached) {
    return { content: cached };
  }

  try {
    const { content, modelUsed } = await callOpenRouterWithFallback({
      messages: [
        {
          role: 'system',
          content:
            'You are an expert educator. Generate engaging, gamified lesson content that is clear and suitable for turning into flashcards. Use the same language as the topic.',
        },
        { role: 'user', content: PROMPT_TEMPLATE_LESSON(topic) },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });
    lessonCache.set(cacheKey, content);
    return { content, modelUsed };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate lesson';
    console.error('generateLesson error:', message);
    return { content: '', error: message };
  }
}

export async function generateFlashCards(content: string, topics: string, existingCards: FlashCard[] = [], retryCount = 0): Promise<GenerateFlashCardsResponse> {
  try {
    const existingCardsContext = existingCards.length > 0
      ? `\nExisting flashcards (DO NOT duplicate these):\n${existingCards.map(card =>
          `- Front: ${card.front_content}\n  Back: ${card.back_content}`
        ).join('\n')}\n`
      : '';

    const prompt = `Generate study flashcards from the following content and topics.

Content: "${content}"

Topics: ${topics}

${existingCardsContext}

Goal: Each card has a term (front) and a definition (back). The term should be a short, scannable label so users can quickly tell cards apart. The definition should be concise and distinctive—enough to explain the concept and differentiate it from other cards.

Instructions:
- front_content: The concept name or label in few words (e.g. "Ajolote", "Jaguar", "Photosynthesis"). Keep it brief and intuitive so it works well when comparing many cards.
- back_content: A short description that captures key traits and distinguishes this concept from others. Use the minimum needed; small distinctions between cards are enough.
- Write term and definition in the same language as the content above.
- Reply with a single JSON array of objects with keys front_content and back_content. No other text before or after the array.

Example structure:
[
  {"front_content": "Ajolote", "back_content": "Anfibio endémico de México, regenera extremidades y mantiene aspecto juvenil."},
  {"front_content": "Jaguar", "back_content": "Felino más grande de América, pelaje amarillo con manchas negras, habita selvas tropicales."}
]`;

    const { content: generatedContent } = await callOpenRouterWithFallback({
      messages: [
        {
          role: 'system',
          content: 'You generate flashcards. front_content is a short concept label (few words). back_content is a concise, distinctive definition. Output only a valid JSON array of objects with "front_content" and "back_content". Use the same language as the user content for the card text.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });
    const cleanedContent = generatedContent;
    
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
    const languageDetectionPrompt = `Detect the language of this text and respond with only the ISO 639-1 language code (e.g., 'es' for Spanish, 'en' for English, 'ja' for Japanese): "${topic}"`;

    const { content: langContent } = await callOpenRouterWithFallback({
      messages: [
        { role: 'system', content: 'You are a language detection expert. Respond only with the ISO 639-1 language code.' },
        { role: 'user', content: languageDetectionPrompt },
      ],
      temperature: 0.1,
      max_tokens: 10,
    });
    const detectedLanguage = langContent.trim() || 'en';

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

    const { content: generatedContent } = await callOpenRouterWithFallback({
      messages: [
        {
          role: 'system',
          content: `You are an expert in creating structured educational content. Your goal is to generate concise names and detailed descriptions that facilitate the creation of effective flashcards. The description should be comprehensive enough to generate at least 10-15 flashcards. Include specific facts, examples, and relationships between concepts. Make sure each section has enough detail to create multiple flashcards. IMPORTANT: Do not use any formatting symbols in the generated text, except for emojis in the name. Generate the response in ${detectedLanguage} language.`,
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });
    const content = generatedContent;
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

export async function generateFolderNotes(collections: Collection[]): Promise<GenerateNotesResponse> {
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

    const { content } = await callOpenRouterWithFallback({
      messages: [
        {
          role: 'system',
          content: 'You are an expert in creating concise and effective study notes. Your goal is to generate clear, structured notes that help students understand relationships between different topics.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    return { notes: content };

  } catch (error: any) {
    console.error('Error generating folder notes:', error);
    return {
      notes: '',
      error: error.message || 'Failed to generate folder notes'
    };
  }
}