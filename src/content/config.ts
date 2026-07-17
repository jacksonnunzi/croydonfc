import { defineCollection, z } from 'astro:content';

const news = defineCollection({
  type: 'content',
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: z.coerce.date(),
      author: z.string().default('Croydon FNC'),
      hero: image().optional(),
      summary: z.string().optional(),
      category: z.string().default('Club News'),
      draft: z.boolean().default(false),
    }),
});

const players = defineCollection({
  type: 'content',
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      code: z.enum(['football', 'netball']).default('football'),
      position: z.string().optional(),
      number: z.number().int().min(0).max(99).optional(),
      photo: image().optional(),
      joined: z.string().optional(),
      stats: z
        .object({
          games: z.number().int().default(0),
          goals: z.number().int().default(0),
        })
        .optional(),
    }),
});

const events = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    endDate: z.coerce.date().optional(),
    time: z.string().optional(),         // e.g. "7:00 PM"
    location: z.string().optional(),
    category: z.string().default('Club Event'),
    summary: z.string().optional(),
    // Public URL path to the uploaded hero image (e.g. "/images/uploads/event.png").
    hero: z.string().optional(),
    rsvpUrl: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

const team_selections = defineCollection({
  type: 'content',
  schema: z.object({
    team: z.enum(['seniors', 'reserves', 'under-19-5']),
    round: z.number().int().optional(),
    date: z.coerce.date(),
    // Public URL path to the uploaded team sheet image (e.g. "/images/uploads/seniors-r2.jpg").
    photo: z.string(),
    notes: z.string().optional(),
  }),
});

export const collections = { news, players, team_selections, events };
