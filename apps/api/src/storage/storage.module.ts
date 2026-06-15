import { Module } from '@nestjs/common';
import { AvatarStorage } from './avatar-storage';
import { SupabaseAvatarStorage } from './supabase-avatar-storage';

@Module({
  providers: [{ provide: AvatarStorage, useClass: SupabaseAvatarStorage }],
  exports: [AvatarStorage],
})
export class StorageModule {}
