/** Config del frontend leída de las variables VITE_ (con defaults de dev). */
export const env = {
  apiUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  publicUrl: import.meta.env.VITE_PUBLIC_URL ?? window.location.origin,
};
