/**
 * Protocolo de mensajes entre el panel de control (manager) y el content script
 * que corre dentro de la pagina de Meta AI.
 *
 * El panel envia una peticion -> el content script ejecuta la automatizacion ->
 * devuelve el resultado (video listo o error).
 */

/** Verifica que el content script este cargado en la pestana de Meta AI. */
export interface PingMessage {
  type: 'PING';
}

/** Pide generar UN video a partir de un prompt + imagen. */
export interface GenerateVideoMessage {
  type: 'GENERATE_VIDEO';
  /** Texto del prompt. */
  prompt: string;
  /** Imagen de referencia codificada como data URL (base64). */
  imageDataUrl: string;
  /** Nombre de archivo original de la imagen (para reconstruir el File). */
  imageName: string;
}

export type RequestMessage = PingMessage | GenerateVideoMessage;

/** Respuesta del content script. */
export type ResponseMessage =
  | { ok: true; type: 'PONG' }
  | { ok: true; type: 'VIDEO_READY'; videoDataUrl: string; mimeType: string }
  | { ok: false; error: string };
