import { z } from 'zod';
import { insertProfileSchema, insertSoundpackSchema, insertPackageSchema, profiles, soundpacks, packages, GlobalSettings } from './schema';

// Zod schema for global settings validation
const globalSettingsSchema = z.object({
  speechEnabled: z.boolean().optional(),
  speechRate: z.number().optional(),
  speechVoice: z.string().optional(),
  fontScale: z.number().optional(),
  lineHeight: z.number().optional(),
  highContrast: z.boolean().optional(),
  readerMode: z.boolean().optional(),
  showInputEcho: z.boolean().optional(),
  triggersEnabled: z.boolean().optional(),
  aliasesEnabled: z.boolean().optional(),
  autoReconnect: z.boolean().optional(),
  reconnectDelay: z.number().optional(),
  keepAlive: z.boolean().optional(),
  keepAliveInterval: z.number().optional(),
  stripSymbols: z.boolean().optional(),
  gmcpEnabled: z.boolean().optional(),
});

export const api = {
  settings: {
    get: {
      method: 'GET' as const,
      path: '/api/settings',
      responses: {
        200: globalSettingsSchema,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/settings',
      input: globalSettingsSchema.partial(),
      responses: {
        200: globalSettingsSchema,
      },
    },
  },
  profiles: {
    list: {
      method: 'GET' as const,
      path: '/api/profiles',
      responses: {
        200: z.array(z.custom<typeof profiles.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/profiles/:id',
      responses: {
        200: z.custom<typeof profiles.$inferSelect>(),
        404: z.object({ message: z.string() }),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/profiles',
      input: insertProfileSchema,
      responses: {
        201: z.custom<typeof profiles.$inferSelect>(),
        400: z.object({ message: z.string() }),
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/profiles/:id',
      input: insertProfileSchema.partial(),
      responses: {
        200: z.custom<typeof profiles.$inferSelect>(),
        404: z.object({ message: z.string() }),
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/profiles/:id',
      responses: {
        204: z.void(),
        404: z.object({ message: z.string() }),
      },
    },
  },
  soundpacks: {
    list: {
      method: 'GET' as const,
      path: '/api/soundpacks',
      responses: {
        200: z.array(z.custom<typeof soundpacks.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/soundpacks/:id',
      responses: {
        200: z.custom<typeof soundpacks.$inferSelect>(),
        404: z.object({ message: z.string() }),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/soundpacks',
      input: insertSoundpackSchema,
      responses: {
        201: z.custom<typeof soundpacks.$inferSelect>(),
        400: z.object({ message: z.string() }),
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/soundpacks/:id',
      input: insertSoundpackSchema.partial(),
      responses: {
        200: z.custom<typeof soundpacks.$inferSelect>(),
        404: z.object({ message: z.string() }),
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/soundpacks/:id',
      responses: {
        204: z.void(),
        404: z.object({ message: z.string() }),
      },
    },
  },
  packages: {
    list: {
      method: 'GET' as const,
      path: '/api/packages',
      responses: {
        200: z.array(z.custom<typeof packages.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/packages/:id',
      responses: {
        200: z.custom<typeof packages.$inferSelect>(),
        404: z.object({ message: z.string() }),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/packages',
      input: insertPackageSchema,
      responses: {
        201: z.custom<typeof packages.$inferSelect>(),
        400: z.object({ message: z.string() }),
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/packages/:id',
      responses: {
        204: z.void(),
        404: z.object({ message: z.string() }),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
