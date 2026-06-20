/**
 * Helpers para encontrar (o abrir) la pestana de Meta AI y enviarle mensajes
 * al content script.
 */
import { browser } from 'wxt/browser';
import type { GenerateVideoMessage, ResponseMessage } from './messages';

const META_AI_URL = 'https://www.meta.ai/';
const META_AI_MATCH = '*://*.meta.ai/*';

/** Espera a que el content script de una pestana responda al PING. */
async function waitForContentScript(tabId: number, timeoutMs = 20000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = (await browser.tabs.sendMessage(tabId, { type: 'PING' })) as ResponseMessage;
      if (res && res.ok) return;
    } catch {
      // El content script todavia no esta listo; reintentamos.
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('La pestana de Meta AI no respondio. ¿Iniciaste sesion en meta.ai?');
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
