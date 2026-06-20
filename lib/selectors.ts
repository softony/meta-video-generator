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
 * COMO ACTUALIZARLOS:
 *   1. Abre https://www.meta.ai/ e inicia sesion.
 *   2. Abre las DevTools (F12) -> pestana Console.
 *   3. Pega el comando de diagnostico (lista videos, inputs y aria-labels).
 *   4. Copia los nombres/atributos exactos y pegalos aqui.
 *
 * Cada campo acepta VARIOS selectores separados por coma: se probaran en orden
 * y se usara el primero que exista en la pagina.
 *
 * (Valores confirmados inspeccionando meta.ai en 2026.)
 */
export const META_AI_SELECTORS = {
  /**
   * Input <input type="file"> donde se sube la imagen.
   * Preferimos el que acepta video (es el del compositor del chat).
   */
  fileInput: 'input[type="file"][accept*="video"], input[type="file"]',

  /**
   * Boton que abre el selector de archivos / adjuntar imagen.
   * En meta.ai su aria-label es exactamente "Añadir archivo adjunto".
   */
  uploadButton:
    '[aria-label="Añadir archivo adjunto"], [aria-label*="adjunto" i], [aria-label*="Attach" i]',

  /**
   * Campo donde se escribe el prompt (editor enriquecido contenteditable).
   */
  promptInput:
    'div[contenteditable="true"], textarea[placeholder], textarea',

  /**
   * Boton de enviar. En meta.ai su aria-label es exactamente "Enviar".
   */
  sendButton: '[aria-label="Enviar"], [aria-label*="Send" i], button[type="submit"]',

  /**
   * Elemento <video> con el video generado. En meta.ai el video final
   * tiene un src que apunta a fbcdn.net (mp4 descargable).
   */
  videoElement: 'video',

  /**
   * Boton de descarga que aparece junto al video terminado.
   * Sirve como senal adicional de que la generacion ha finalizado.
   */
  downloadButton: '[aria-label="Descargar"]',

  /**
   * Boton "Nuevo chat" de la barra lateral. Se usa para empezar cada escena
   * en un chat limpio SIN recargar la pagina (navegacion interna de la SPA).
   * Como no expone aria-label fiable, el codigo tambien lo busca por texto.
   */
  newChatButton: '[aria-label="Nuevo chat"]',

  /**
   * (Opcional) Indicador de "generando...". Dejar vacio si no se usa.
   */
  generatingIndicator: '',
} as const;

/**
 * Tiempos de espera (en milisegundos). Ajustables segun lo que tarde Meta AI.
 */
export const TIMING = {
  /** Tiempo maximo de espera por un video (la generacion suele tardar 1-3 min). */
  videoTimeoutMs: 6 * 60 * 1000, // 6 minutos
  /** Intervalo de sondeo mientras esperamos el video. */
  pollIntervalMs: 2000,
  /** Pausa tras subir la imagen, para que la web la procese. */
  afterUploadMs: 2000,
  /** Pausa tras escribir el prompt, antes de enviar. */
  afterTypeMs: 500,
  /** Pausa tras pulsar "Nuevo chat". */
  afterNewChatMs: 1500,
} as const;
