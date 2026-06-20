/**
 * Helpers para encontrar (o abrir) la pestana de Meta AI, llevarla a un chat
 * nuevo por cada escena y enviarle mensajes al content script.
 */
import { browser } from 'wxt/browser';
import type { GenerateVideoMessage, ResponseMessage } from './messages';

const META_AI_URL = 'https://www.meta.ai/';
const META_AI_MATCH = '*://*.meta.ai/*';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Espera a que el content script de una pestana responda al PING. */
async function waitForContentScript(tabId: number, timeoutMs = 25000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = (await browser.tabs.sendMessage(tabId, { type: 'PING' })) as ResponseMessage;
      if (res && res.ok) return;
    } catch {
      // El content script todavia no esta listo; reintentamos.
    }
    await sleep(500);
  }
  throw new Error('La pestana de Meta AI no respondio. ¿Iniciaste sesion en meta.ai?');
}

/** Espera a que la pestana termine de cargar (status "complete"). */
async function waitForTabComplete(tabId: number, timeoutMs = 30000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const tab = await browser.tabs.get(tabId);
    if (tab.status === 'complete' && (tab.url ?? '').includes('meta.ai')) return;
    await sleep(300);
  }
}

/**
 * Devuelve una pestana de Meta AI lista para recibir ordenes.
 * Si no hay ninguna abierta, abre una nueva.
 */
export async function ensureMetaTab(): Promise<number> {
  const tabs = await browser.tabs.query({ url: META_AI_MATCH });
  let tabId = tabs[0]?.id;

  if (tabId == null) {
    const created = await browser.tabs.create({ url: META_AI_URL, active: true });
    tabId = created.id!;
  }

  await waitForContentScript(tabId);
  return tabId;
}

/**
 * Lleva la pestana a un CHAT NUEVO (la raiz de meta.ai). Asi cada escena
 * empieza limpia, con el boton de adjuntar disponible, igual que la primera.
 */
export async function navigateToNewChat(tabId: number): Promise<void> {
  await browser.tabs.update(tabId, { url: META_AI_URL });
  await waitForTabComplete(tabId);
  // Pequena pausa para que la SPA hidrate antes de inyectar de nuevo.
  await sleep(1200);
  await waitForContentScript(tabId);
}

/** Envia una peticion de generacion a la pestana de Meta AI y espera el resultado. */
export async function requestVideo(
  tabId: number,
  payload: Omit<GenerateVideoMessage, 'type'>,
): Promise<ResponseMessage> {
  return (await browser.tabs.sendMessage(tabId, {
    type: 'GENERATE_VIDEO',
    ...payload,
  })) as ResponseMessage;
}
