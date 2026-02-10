import { useState, useCallback } from 'react';
import { generateLesson, type GenerateLessonResponse } from '../services/ai/integration/openrouter';

export interface UseLessonGeneratorState {
  content: string;
  modelUsed?: string;
  error: string | null;
  loading: boolean;
}

export function useLessonGenerator() {
  const [state, setState] = useState<UseLessonGeneratorState>({
    content: '',
    modelUsed: undefined,
    error: null,
    loading: false,
  });

  const generate = useCallback(async (topic: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const result: GenerateLessonResponse = await generateLesson(topic);
      if (result.error) {
        setState((s) => ({
          ...s,
          loading: false,
          error: result.error ?? 'Error al generar la lección',
          content: '',
          modelUsed: undefined,
        }));
        return result;
      }
      setState({
        content: result.content,
        modelUsed: result.modelUsed,
        error: null,
        loading: false,
      });
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setState((s) => ({
        ...s,
        loading: false,
        error: message,
        content: '',
        modelUsed: undefined,
      }));
      return { content: '', error: message };
    }
  }, []);

  const reset = useCallback(() => {
    setState({ content: '', modelUsed: undefined, error: null, loading: false });
  }, []);

  return { ...state, generate, reset };
}
