/** Configuración tipada y centralizada (cargada por @nestjs/config). */
export interface AppConfig {
  port: number;
  corsOrigins: string[];
  databaseUrl: string;
  /** Clave que debe enviar el organizador para sortear/limpiar. Vacío = modo abierto. */
  organizerKey: string;
  supabase: {
    url: string;
    serviceRoleKey: string;
    avatarBucket: string;
  };
}

export function configuration(): AppConfig {
  const origins = (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, '')) // sin barra final
    .filter(Boolean);

  return {
    // Railway/Render/Heroku inyectan PORT; en local usamos API_PORT.
    port: parseInt(process.env.PORT ?? process.env.API_PORT ?? '3000', 10),
    corsOrigins: origins,
    databaseUrl: process.env.DATABASE_URL ?? '',
    organizerKey: process.env.ORGANIZER_KEY ?? '',
    supabase: {
      url: process.env.SUPABASE_URL ?? '',
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
      avatarBucket: process.env.AVATAR_BUCKET ?? 'avatars',
    },
  };
}
