/**
 * Utilidades de File System Access API.
 *
 * Permiten al panel de control:
 *   - Elegir la carpeta del proyecto (con permiso de lectura/escritura).
 *   - Leer el project.json y las imagenes de referencia.
 *   - Crear la subcarpeta "videos" y guardar ahi los videos generados.
 *
 * Nota: esta API solo esta disponible en navegadores basados en Chromium
 * (Chrome, Edge, Brave...). Es la misma que usa el video.
 */
import type { ProjectFile } from './types';

/** Nombre del JSON que define el proyecto. */
export const PROJECT_JSON_NAME = 'project.json';
/** Subcarpeta que contiene las imagenes de referencia. */
export const IMAGES_DIR_NAME = 'images';
/** Subcarpeta de salida donde se guardan los videos. */
export const OUTPUT_DIR_NAME = 'videos';

/** Abre el selector de carpeta y pide permiso de lectura/escritura. */
export async function pickProjectDirectory(): Promise<FileSystemDirectoryHandle> {
  // @ts-expect-error showDirectoryPicker existe en Chromium aunque el tipo varie.
  return await window.showDirectoryPicker({ mode: 'readwrite' });
}

/** Lee y parsea el project.json de la carpeta seleccionada. */
export async function readProjectFile(
  dir: FileSystemDirectoryHandle,
): Promise<ProjectFile> {
  const handle = await dir.getFileHandle(PROJECT_JSON_NAME);
  const file = await handle.getFile();
  const text = await file.text();
  const data = JSON.parse(text) as ProjectFile;
  if (!data || !Array.isArray(data.scenes)) {
    throw new Error('El project.json no tiene un arreglo "scenes" valido.');
  }
  return data;
}

/** Convierte un File en data URL (base64). */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** Lee una imagen de la subcarpeta de imagenes y la devuelve como data URL. */
export async function readImageAsDataUrl(
  dir: FileSystemDirectoryHandle,
  imageName: string,
): Promise<string> {
  const imagesDir = await dir.getDirectoryHandle(IMAGES_DIR_NAME);
  const handle = await imagesDir.getFileHandle(imageName);
  const file = await handle.getFile();
  return fileToDataUrl(file);
}

/** Convierte un data URL en Blob. */
export function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, base64] = dataUrl.split(',');
  const mime = /data:(.*?);base64/.exec(meta)?.[1] ?? 'application/octet-stream';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

/** Guarda un video (data URL) en la subcarpeta de salida y devuelve el nombre usado. */
export async function saveVideo(
  dir: FileSystemDirectoryHandle,
  filename: string,
  videoDataUrl: string,
): Promise<string> {
  const outDir = await dir.getDirectoryHandle(OUTPUT_DIR_NAME, { create: true });
  const fileHandle = await outDir.getFileHandle(filename, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(dataUrlToBlob(videoDataUrl));
  await writable.close();
  return filename;
}

/** Deriva la extension de archivo a partir del mime type del video. */
export function extensionForMime(mime: string): string {
  if (mime.includes('mp4')) return 'mp4';
  if (mime.includes('webm')) return 'webm';
  if (mime.includes('quicktime')) return 'mov';
  return 'mp4';
}
