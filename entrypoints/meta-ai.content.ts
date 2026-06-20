/**
 * CONTENT SCRIPT - corre DENTRO de la pagina de Meta AI.
 *
 * Escucha mensajes del panel de control y ejecuta la automatizacion completa
 * para UN video: subir imagen -> escribir prompt -> enviar -> esperar -> obtener.
 *
 * El orquestador (panel de control) llama a este content script una vez por
 * escena, de forma secuencial (uno tras otro), tal como se hace en el video
 * para no exceder los limites ocultos de Meta AI.
 */
import { defineContentScript } from 'wxt/utils/define-content-script';
import { browser } from 'wxt/browser';
import type { RequestMessage, ResponseMessage } from '@/lib/messages';
import {
  uploadImage,
  typePrompt,
  clickSend,
  waitForNewVideo,
  fetchVideoAsDataUrl,
  dataUrlToFile,
  snapshotExistingVideos,
} from '@/lib/dom-automation';

export default defineContentScript({
  matches: ['*://*.meta.ai/*'],

  main() {
    console.log('[Meta Video Generator] content script cargado.');

    browser.runtime.onMessage.addListener(
      // Devolver una Promise hace que la respuesta sea asincrona.
      async (message: RequestMessage): Promise<ResponseMessage> => {
        try {
          if (message.type === 'PING') {
            return { ok: true, type: 'PONG' };
          }

          if (message.type === 'GENERATE_VIDEO') {
            const { prompt, imageDataUrl, imageName } = message;

            // 0) Foto del estado actual: que videos ya existen en la pagina.
            const before = snapshotExistingVideos();

            // 1) Subir la imagen de referencia.
            const file = dataUrlToFile(imageDataUrl, imageName);
            await uploadImage(file);

            // 2) Escribir el prompt.
            await typePrompt(prompt);

            // 3) Enviar.
            await clickSend();

            // 4) Esperar a que aparezca el NUEVO video (puede tardar minutos).
            const videoUrl = await waitForNewVideo(before);

            // 5) Descargar el video y devolverlo al panel para guardarlo.
            const { dataUrl, mimeType } = await fetchVideoAsDataUrl(videoUrl);

            return { ok: true, type: 'VIDEO_READY', videoDataUrl: dataUrl, mimeType };
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
