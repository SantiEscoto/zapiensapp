/**
 * Rutas centralizadas para Zapiens.
 * Flashcards = niveles sueltos; Lessons = mundos con niveles (nested).
 */

export const ROUTES = {
  // Auth
  WELCOME: '/(auth)/welcome',
  LOGIN: '/(auth)/login',
  REGISTER: '/(auth)/register',
  FORGOT_PASSWORD: '/forgot-password',
  CALLBACK: '/(auth)/callback',

  // Main tabs
  HOME: '/(main)/home',
  RANKINGS: '/(main)/rankings',
  PROFILE: '/(main)/profile',

  // Subtabs (mundos / flujos)
  LESSONS: '/(subtabs)/lessons',
  LANDS: '/(subtabs)/lands',
  EDIT: '/(subtabs)/edit',
  MANAGE: '/(subtabs)/manage',
  SETTINGS: '/(subtabs)/settings',
  FRIENDS: '/(subtabs)/friends',

  // Juegos (niveles sueltos)
  FLASHCARD: '/(lessons)/flashcard',
  MATCH: '/(lessons)/match',
  SPINNING: '/(lessons)/spinning',
  QUIZ: '/(lessons)/quiz',
  WORDSEARCH: '/(lessons)/wordsearch',
  CROSSWORD: '/(lessons)/crossword',
} as const;

export type RouteKey = keyof typeof ROUTES;

/** Construye URL con query ?id= para web y compatibilidad. */
export function buildUrl(
  route: string,
  params?: { id?: string; [k: string]: string | undefined }
): string {
  if (!params?.id) return route;
  const rest = { ...params };
  delete rest.id;
  const search = new URLSearchParams({ id: params.id, ...rest } as Record<string, string>);
  return `${route}?${search.toString()}`;
}
