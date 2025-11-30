import { supabase } from '../src/services/supabase';

interface Collection {
  id: string;
  name: string;
  language: string;
  description: string;
}

export async function generateFolderNotes(collections: Collection[]) {
  try {
    // Construir el prompt con el contenido completo de las colecciones
    const collectionsContent = collections.map(collection => `
      Colección: ${collection.name}
      Idioma: ${collection.language}
      Contenido: ${collection.description}
    `).join('\n\n');

    const prompt = `Genera un resumen detallado y bien estructurado de las siguientes colecciones de tarjetas de memoria:

${collectionsContent}

Por favor, genera un resumen que:
1. Mantenga la estructura y organización de cada colección
2. Incluya ejemplos clave de cada tema
3. Sea fácil de leer y entender
4. Mantenga el formato y estilo de cada colección
5. Incluya notas importantes y puntos clave

El resumen debe ser claro, conciso y útil para repasar el contenido.`;

    const { data, error } = await supabase.functions.invoke('generate-notes', {
      body: { prompt }
    });

    if (error) throw error;

    return {
      notes: data.notes,
      error: null
    };
  } catch (error: any) {
    console.error('Error generating notes:', error);
    return {
      notes: null,
      error: error.message || 'Error al generar los apuntes'
    };
  }
} 