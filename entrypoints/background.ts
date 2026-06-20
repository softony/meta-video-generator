/**
 * BACKGROUND (service worker).
 *
 * En esta arquitectura el panel de control habla directamente con el content
 * script, por lo que el background se mantiene minimo. Lo dejamos disponible
 * por dos motivos:
 *   1. WXT lo usa para el ciclo de vida de la extension.
 *   2. Sirve de punto de extension futuro (p. ej. usar la API de descargas,
 *      generar varios videos en paralelo, etc.).
 */
import { defineBackground } from 'wxt/utils/define-background';

export default defineBackground(() => {
  console.log('[Meta Video Generator] background listo.');
});
