import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const articulos = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/articulos' }),
  schema: z.object({
    /** <title> de la página (≈ 60 caracteres). */
    title: z.string(),
    /** Meta description (≈ 150 caracteres). */
    description: z.string(),
    h1: z.string(),
    /** Párrafo introductorio arriba de la calculadora. */
    intro: z.string(),
    actualizado: z.coerce.date(),
    faq: z.array(z.object({ pregunta: z.string(), respuesta: z.string() })).default([]),
  }),
});

export const collections = { articulos };
