/**
 * Puerto de almacenamiento de avatares. Recibe el valor del avatar; si es un
 * data-URL (foto), lo persiste y devuelve una URL pública. Si no, lo devuelve
 * igual. El dominio no sabe si detrás hay Supabase Storage, S3 o nada.
 */
export abstract class AvatarStorage {
  abstract persist(avatarValue: string): Promise<string>;
}
