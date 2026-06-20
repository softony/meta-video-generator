/**
 * CONTENT SCRIPT - corre DENTRO de la pagina de Meta AI.
 *
 * Escucha mensajes del panel de control y ejecuta la automatizacion completa
 * para UN video: chat nuevo -> subir imagen -> escribir prompt -> enviar ->
 * esperar -> obtener la URL del video. El panel lo descarga y lo guarda.
 */
import { defineContentScript } from 'wxt/utils/define-content-script';
import { browser } from 'wxt/browser';
import type { RequestMessage, ResponseMessage } from '@/lib/messages';
import {
  startNewChat,
  uploadImage,
  typePrompt,
  clickSend,
  waitForNewVideo,
  dataUrlToFile,
  snapshotExistingVideos,
} from '@/lib/dom-automation';

export default defineContentScript({
  matches: ['*://*.meta.ai/*'],

  main() {
    console.log('[Meta Video Generator] content script cargado.');

    browser.runtime.onMessage.addListener(
      async (message: RequestMessage): Promise<ResponseMessage> => {
        try {
          if (message.type === 'PING') {
            return { ok: true, type: 'PONG' };
          }

          if (message.type === 'GENERATE_VIDEO') {
            const { prompt, imageDataUrl, imageName } = message;

            // 0) Empezar un chat nuevo (sin recargar la pagina).
            await startNewChat();

            // Que videos ya existen ANTES de enviar (para detectar el nuevo).
            const before = snapshotExistingVideos();

            // 1) Subir la imagen de referencia.
            const file = dataUrlToFile(imageDataUrl, imageName);
            await uploadImage(file);

            // 2) Escribir el prompt (ya incluye la instruccion de animar).
            await typePrompt(prompt);

            // 3) Enviar.
            await clickSend();

            // 4) Esperar a que aparezca el NUEVO video y obtener su URL.
            const videoUrl = await waitForNewVideo(before);

            return { ok: true, type: 'VIDEO_READY', videoUrl };
          }

          return { ok: false, error: 'Mensaje no reconocido.' };
        } catch (err) {
          const error = err instanceof Error ? err.message : String(err);
          console.error('[Meta Video Generator] error:', error);
          return { ok: false, error };
        }
      },
    );
  },
});
