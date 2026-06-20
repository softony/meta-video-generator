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
  // querySelector ya soporta varios selectores separados por coma y devuelve
  // el primero del documento; pero recorremos a mano para respetar el ORDEN
  // de prioridad que definimos en selectors.ts.
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

/** Convierte un Blob en un data URL (base64). */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
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

  // Si no esta presente, puede que aparezca tras pulsar el boton de adjuntar.
  if (!input) {
    const btn = queryFirst<HTMLElement>(META_AI_SELECTORS.uploadButton);
    if (btn) {
      btn.click();
      await sleep(500);
    }
    input = await waitForElement<HTMLInputElement>(META_AI_SELECTORS.fileInput);
  }

  assignFileToInput(input, file);
  await sleep(TIMING.afterUploadMs);
}

/**
 * Escribe texto en un input nativo (textarea/input) saltando el setter de React.
 * React intercepta el setter de "value", por eso usamos el setter del prototipo.
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

/** PASO 2: escribir el prompt en el campo del chat (textarea o contenteditable). */
export async function typePrompt(prompt: string): Promise<void> {
  const field = await waitForElement<HTMLElement>(META_AI_SELECTORS.promptInput);
  field.focus();

  if (field instanceof HTMLTextAreaElement || field instanceof HTMLInputElement) {
    setNativeInputValue(field, prompt);
  } else {
    // Caso contenteditable.
    field.textContent = '';
    document.execCommand('insertText', false, prompt);
    // Respaldo por si execCommand esta deshabilitado.
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
  // Esperamos a que el boton este habilitado.
  const start = Date.now();
  while (btn.disabled && Date.now() - start < 5000) {
    await sleep(150);
  }
  btn.click();
}

/** Devuelve el conjunto de URLs de video presentes ahora mismo en la pagina. */
function currentVideoSrcs(): Set<string> {
  const set = new Set<string>();
  document.querySelectorAll<HTMLVideoElement>(META_AI_SELECTORS.videoElement).forEach((v) => {
    const src = v.currentSrc || v.src || v.querySelector('source')?.src || '';
    if (src) set.add(src);
  });
  return set;
}

/**
 * PASO 4: esperar a que aparezca un NUEVO video y devolver su URL.
 *
 * Estrategia: guardamos las URLs de video existentes ANTES de enviar el prompt;
 * luego sondeamos hasta que aparezca una URL nueva (el video recien generado).
 */
export async function waitForNewVideo(previousSrcs: Set<string>): Promise<string> {
  const start = Date.now();

  while (Date.now() - start < TIMING.videoTimeoutMs) {
    // Si hay un indicador de "generando", esperamos a que desaparezca.
    if (META_AI_SELECTORS.generatingIndicator) {
      const spinner = queryFirst(META_AI_SELECTORS.generatingIndicator);
      if (spinner) {
        await sleep(TIMING.pollIntervalMs);
        continue;
      }
    }

    const videos = document.querySelectorAll<HTMLVideoElement>(
      META_AI_SELECTORS.videoElement,
    );
    for (const v of Array.from(videos)) {
      const src = v.currentSrc || v.src || v.querySelector('source')?.src || '';
      if (src && !previousSrcs.has(src)) {
        return src;
      }
    }

    await sleep(TIMING.pollIntervalMs);
  }

  throw new Error('Se agoto el tiempo de espera esperando el video generado.');
}

/** Descarga el video desde su URL y lo devuelve como data URL para transferirlo. */
export async function fetchVideoAsDataUrl(
  url: string,
): Promise<{ dataUrl: string; mimeType: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error al descargar el video (HTTP ${res.status}).`);
  const blob = await res.blob();
  const dataUrl = await blobToDataUrl(blob);
  return { dataUrl, mimeType: blob.type || 'video/mp4' };
}

/** Capturar las URLs de video ANTES de enviar (para detectar el nuevo). */
export const snapshotExistingVideos = currentVideoSrcs;
