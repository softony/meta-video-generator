/**
 * Tipos compartidos entre el panel de control, el content script y el background.
 */

/** Una escena dentro del archivo project.json. */
export interface Scene {
  /** Identificador unico de la escena. Se usa para nombrar el video de salida. */
  id: string;
  /** Prompt de texto que describe el video a generar. */
  prompt: string;
  /** Nombre del archivo de imagen de referencia (dentro de la subcarpeta de imagenes). */
  image: string;
}

/** Estructura del archivo project.json que define el proyecto. */
export interface ProjectFile {
  /** Titulo opcional del proyecto. */
  title?: string;
  /** Lista de escenas a generar, en orden. */
  scenes: Scene[];
}

/** Estado de cada elemento dentro de la cola de generacion. */
export type QueueStatus =
  | 'pending'
  | 'generating'
  | 'downloaded'
  | 'error';

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
