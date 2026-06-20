/**
 * ============================================================================
 *  SELECTORES DEL DOM DE META AI  ->  EL ARCHIVO MAS IMPORTANTE PARA MANTENER
 * ============================================================================
 *
 * Como Meta AI NO tiene API oficial, la extension automatiza la web imitando
 * lo que harias a mano. Para "decirle" a la maquina donde hacer clic o escribir,
 * usamos selectores CSS que apuntan a los elementos HTML de la pagina.
 *
 * >>> Estos selectores SON FRAGILES: si Meta actualiza su web, dejaran de
 *     funcionar y tendras que actualizarlos aqui (y SOLO aqui).
 *
 * COMO ACTUALIZARLOS (igual que en el video):
 *   1. Abre https://www.meta.ai/ e inicia sesion.
 *   2. Abre las DevTools (F12) y usa la herramienta de seleccion (Ctrl+Shift+C).
 *   3. Haz clic sobre el boton/campo que te interesa (subir archivo, input del
 *      chat, boton enviar, el video generado).
 *   4. Mira el HTML resaltado y copia un selector estable (id, aria-label,
 *      data-*, etc.). Evita clases ofuscadas tipo "x1y2z3" porque cambian.
 *   5. Pega el selector aqui.
 *
 * Cada campo acepta VARIOS selectores separados por coma: se probaran en orden
 * y se usara el primero que exista en la pagina.
 */
export const META_AI_SELECTORS = {
  /**
   * Input <input type="file"> donde se sube la imagen.
   * Normalmente esta oculto y se activa con un boton (ver uploadButton).
   */
  fileInput: 'input[type="file"]',

  /**
   * Boton que abre el selector de archivos / adjuntar imagen.
   * Solo se usa si el fileInput no esta visible directamente.
   */
  uploadButton:
    '[aria-label*="Attach" i], [aria-label*="Adjuntar" i], [aria-label*="image" i], [aria-label*="media" i]',

  /**
   * Campo donde se escribe el prompt. Puede ser un <textarea> o un
   * <div contenteditable="true">. El codigo soporta ambos.
   */
  promptInput:
    'textarea[placeholder], div[contenteditable="true"], textarea',

  /**
   * Boton de enviar el mensaje/prompt.
   */
  sendButton:
    '[aria-label*="Send" i], [aria-label*="Enviar" i], button[type="submit"]',

  /**
   * Elemento <video> donde aparece el video generado.
   * Cuando el src tenga una URL valida, asumimos que el video esta listo.
   */
  videoElement: 'video',

  /**
   * (Opcional) Selector de un indicador de "generando..." (spinner, texto).
   * Si lo defines, la espera tambien comprobara que este indicador desaparezca
   * antes de dar por listo el video. Dejalo vacio si no lo necesitas.
   */
  generatingIndicator: '',
} as const;

/**
 * Tiempos de espera (en milisegundos). Ajustables segun lo que tarde Meta AI.
 */
export const TIMING = {
  /** Tiempo maximo de espera por un video (la generacion puede tardar minutos). */
  videoTimeoutMs: 10 * 60 * 1000, // 10 minutos
  /** Intervalo de sondeo mientras esperamos el video. */
  pollIntervalMs: 2000,
  /** Pausa tras subir la imagen, para que la web la procese. */
  afterUploadMs: 1500,
  /** Pausa tras escribir el prompt, antes de enviar. */
  afterTypeMs: 400,
} as const;
