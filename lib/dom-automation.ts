/**
 * Funciones de automatizacion del DOM de Meta AI.
 *
 * Estas funciones son "las manos" de la extension: hacen exactamente lo que
 * harias a mano -> subir una imagen, escribir el prompt, hacer clic en enviar,
 * esperar a que el video se genere y obtener su URL.
 *
 * Se ejecutan dentro del content script (tienen acceso al DOM de la pagina).
 */
import { META_AI_SELECTORS, TIMING } from './selectors';

/** Espera la cantidad de milisegundos indicada. */
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Devuelve el primer elemento que coincida con la lista de selectores (separados por coma). */
function queryFirst<T extends Element = HTMLElement>(
  selectorList: string,
): T | null {
  if (!selectorList) return null;
  for (const sel of selectorList.split(',').map((s) => s.trim())) {
    if (!sel) continue;
    const el = document.querySelector<T>(sel);
    if (el) return el;
  }
  return null;
}

/** Espera hasta que un selector exista en el DOM (o se agote el tiempo). */
async function waitForElement<T extends Element = HTMLElement>(
  selectorList: string,
  timeoutMs = 15000,
): Promise<T> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const el = queryFirst<T>(selectorList);
    if (el) return el;
    await sleep(200);
  }
  throw new Error(`No se encontro ningun elemento para: "${selectorList}"`);
}

/** Convierte un data URL (base64) en un objeto File. */
export function dataUrlToFile(dataUrl: string, filename: string): File {
  const [meta, base64] = dataUrl.split(',');
  const mimeMatch = /data:(.*?);base64/.exec(meta);
  const mime = mimeMatch?.[1] ?? 'image/png';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], filename, { type: mime });
}

/**
 * Devuelve una "clave estable" de una URL de video: origen + ruta, SIN los
 * parametros de consulta. Meta AI cambia parametros firmados (_nc_ohc, oh, oe...)
 * en cada render, asi que comparar la URL completa daria falsos positivos.
 * La ruta del archivo .mp4 si es estable e identifica al video de forma unica.
 */
function stableVideoKey(url: string): string {
  try {
    const u = new URL(url);
    return u.origin + u.pathname;
  } catch {
    return url;
  }
}

/** Devuelve la URL "real" de un elemento <video> (src, currentSrc o <source>). */
function videoUrlOf(v: HTMLVideoElement): string {
  return v.currentSrc || v.src || v.querySelector('source')?.src || '';
}

/** ¿La URL parece un video final descargable de Meta (mp4 en fbcdn)? */
function looksLikeFinalVideo(url: string): boolean {
  if (!url) return false;
  if (url.startsWith('blob:')) return false; // aun no es la URL final descargable
  return url.includes('.mp4') || url.includes('fbcdn');
}

/**
 * Asigna un archivo a un <input type="file"> simulando la seleccion del usuario.
 * Usa DataTransfer porque input.files es de solo lectura por seguridad.
 */
function assignFileToInput(input: HTMLInputElement, file: File) {
  const dt = new DataTransfer();
  dt.items.add(file);
  input.files = dt.files;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

/** PASO 1: subir la imagen de referencia. */
export async function uploadImage(file: File): Promise<void> {
  // Intentamos encontrar el input de archivo directamente.
  let input = queryFirst<HTMLInputElement>(META_AI_SELECTORS.fileInput);

  // Si no esta presente, lo revelamos pulsando el boton "Añadir archivo adjunto".
  if (!input) {
    const btn = queryFirst<HTMLElement>(META_AI_SELECTORS.uploadButton);
    if (btn) {
      btn.click();
      await sleep(600);
    }
    input = await waitForElement<HTMLInputElement>(META_AI_SELECTORS.fileInput);
  }

  assignFileToInput(input, file);
  await sleep(TIMING.afterUploadMs);
}

/**
 * Escribe texto en un input nativo (textarea/input) saltando el setter de React.
 */
function setNativeInputValue(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const proto =
    el instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  setter?.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

/** PASO 2: escribir el prompt en el campo del chat (contenteditable o textarea). */
export async function typePrompt(prompt: string): Promise<void> {
  const field = await waitForElement<HTMLElement>(META_AI_SELECTORS.promptInput);
  field.focus();

  if (field instanceof HTMLTextAreaElement || field instanceof HTMLInputElement) {
    setNativeInputValue(field, prompt);
  } else {
    // Caso contenteditable (editor enriquecido tipo Lexical).
    field.textContent = '';
    document.execCommand('insertText', false, prompt);
    if (!field.textContent) {
      field.textContent = prompt;
      field.dispatchEvent(new InputEvent('input', { bubbles: true, data: prompt }));
    }
  }
  await sleep(TIMING.afterTypeMs);
}

/** PASO 3: hacer clic en el boton de enviar. */
export async function clickSend(): Promise<void> {
  const btn = await waitForElement<HTMLButtonElement>(META_AI_SELECTORS.sendButton);
  const start = Date.now();
  while (btn.disabled && Date.now() - start < 5000) {
    await sleep(150);
  }
  btn.click();
}

/** Devuelve el conjunto de claves estables de los videos presentes ahora mismo. */
export function snapshotExistingVideos(): Set<string> {
  const set = new Set<string>();
  document
    .querySelectorAll<HTMLVideoElement>(META_AI_SELECTORS.videoElement)
    .forEach((v) => {
      const url = videoUrlOf(v);
      if (url) set.add(stableVideoKey(url));
    });
  return set;
}

/**
 * PASO 4: esperar a que aparezca un NUEVO video final y devolver su URL.
 *
 * Comparamos por "clave estable" (ruta sin parametros) contra los videos que
 * ya existian antes de enviar, y exigimos que parezca un mp4 final de fbcdn.
 */
export async function waitForNewVideo(previousKeys: Set<string>): Promise<string> {
  const start = Date.now();

  while (Date.now() - start < TIMING.videoTimeoutMs) {
    const videos = document.querySelectorAll<HTMLVideoElement>(
      META_AI_SELECTORS.videoElement,
    );
    for (const v of Array.from(videos)) {
      const url = videoUrlOf(v);
      if (url && looksLikeFinalVideo(url) && !previousKeys.has(stableVideoKey(url))) {
        return url;
      }
    }
    await sleep(TIMING.pollIntervalMs);
  }

  throw new Error('Se agoto el tiempo de espera esperando el video generado.');
}
