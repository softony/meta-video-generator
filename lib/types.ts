/**
 * Tipos compartidos entre el panel de control, el content script y el background.
 */

/**
 * Instruccion que se antepone a cada prompt para que Meta AI genere un VIDEO
 * (animando la imagen) en lugar de una imagen estatica.
 *
 * IMPORTANTE: probando meta.ai se confirmo que un prompt descriptivo produce
 * una IMAGEN, mientras que un prompt que pide "animar la imagen" produce un
 * VIDEO. Por eso anteponemos esta instruccion por defecto.
 *
 * Se puede personalizar (o desactivar con "") en el project.json con el campo
 * "promptPrefix".
 */
export const DEFAULT_PROMPT_PREFIX =
  'Anima esta imagen y conviertela en un video.';

/** Una escena dentro del archivo project.json. */
export interface Scene {
  /** Identificador unico de la escena. Se usa para nombrar el video de salida. */
  id: string;
  /** Prompt de texto que describe el movimiento/video a generar. */
  prompt: string;
  /** Nombre del archivo de imagen de referencia (dentro de la subcarpeta de imagenes). */
  image: string;
}

/** Estructura del archivo project.json que define el proyecto. */
export interface ProjectFile {
  /** Titulo opcional del proyecto. */
  title?: string;
  /**
   * Texto que se antepone a CADA prompt. Si se omite, se usa
   * DEFAULT_PROMPT_PREFIX. Pon "" (cadena vacia) para desactivarlo.
   */
  promptPrefix?: string;
  /** Lista de escenas a generar, en orden. */
  scenes: Scene[];
}

/** Estado de cada elemento dentro de la cola de generacion. */
export type QueueStatus = 'pending' | 'generating' | 'downloaded' | 'error';

/** Un elemento de la cola, derivado de una escena. */
export interface QueueItem {
  index: number;
  sceneId: string;
  prompt: string;
  imageName: string;
  status: QueueStatus;
  error?: string;
  /** Nombre del archivo de video guardado en la carpeta de salida. */
  outputName?: string;
}
