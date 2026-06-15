import { randomUUID } from 'node:crypto';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppConfig } from '../config/configuration';
import { AvatarStorage } from './avatar-storage';

/**
 * Adaptador de Supabase Storage (service role, lado servidor).
 * Degrada con elegancia: si no está configurado o si la subida falla, devuelve
 * el data-URL original para no romper el registro.
 */
@Injectable()
export class SupabaseAvatarStorage extends AvatarStorage implements OnModuleInit {
  private readonly logger = new Logger(SupabaseAvatarStorage.name);
  private readonly client: SupabaseClient | null;
  private readonly bucket: string;

  constructor(config: ConfigService<AppConfig, true>) {
    super();
    const { url, serviceRoleKey, avatarBucket } = config.get('supabase', { infer: true });
    this.bucket = avatarBucket;
    this.client =
      url && serviceRoleKey
        ? createClient(url, serviceRoleKey, { auth: { persistSession: false } })
        : null;
    if (!this.client) {
      this.logger.warn('Supabase Storage no configurado: las fotos se guardarán como data-URL.');
    }
  }

  /** Garantiza que el bucket público exista (idempotente). */
  async onModuleInit(): Promise<void> {
    if (!this.client) return;
    const { data } = await this.client.storage.getBucket(this.bucket);
    if (data) return;
    const { error } = await this.client.storage.createBucket(this.bucket, {
      public: true,
      fileSizeLimit: '2MB',
    });
    if (error && !/exist/i.test(error.message)) {
      this.logger.error(`No pude crear el bucket "${this.bucket}": ${error.message}`);
    } else {
      this.logger.log(`Bucket de avatares "${this.bucket}" listo.`);
    }
  }

  async persist(value: string): Promise<string> {
    if (!this.client || !value.startsWith('data:')) return value;

    const match = /^data:(.+?);base64,(.*)$/s.exec(value);
    if (!match) return value;

    const [, mime, b64] = match;
    const buffer = Buffer.from(b64!, 'base64');
    const ext = (mime!.split('/')[1] ?? 'jpg').replace(/[^a-z0-9]/gi, '') || 'jpg';
    const path = `${randomUUID()}.${ext}`;

    const { error } = await this.client.storage
      .from(this.bucket)
      .upload(path, buffer, { contentType: mime, upsert: false });
    if (error) {
      this.logger.error(`Subida de avatar falló, uso data-URL: ${error.message}`);
      return value;
    }
    return this.client.storage.from(this.bucket).getPublicUrl(path).data.publicUrl;
  }
}
