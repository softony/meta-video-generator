import { useMemo, useState } from 'react';
import type { ProjectFile, QueueItem } from '@/lib/types';
import { DEFAULT_PROMPT_PREFIX } from '@/lib/types';
import {
  pickProjectDirectory,
  readProjectFile,
  readImageAsDataUrl,
  saveVideoBlob,
  extensionForMime,
} from '@/lib/file-system';
import { ensureMetaTab, requestVideo } from '@/lib/meta-tab';

export function App() {
  const [dir, setDir] = useState<FileSystemDirectoryHandle | null>(null);
  const [project, setProject] = useState<ProjectFile | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const done = useMemo(
    () => queue.filter((q) => q.status === 'downloaded').length,
    [queue],
  );

  /** Paso 1: el usuario selecciona la carpeta del proyecto. */
  async function handlePickFolder() {
    setError(null);
    try {
      const handle = await pickProjectDirectory();
      const data = await readProjectFile(handle);
      const items: QueueItem[] = data.scenes.map((scene, index) => ({
        index,
        sceneId: scene.id,
        prompt: scene.prompt,
        imageName: scene.image,
        status: 'pending',
      }));
      setDir(handle);
      setProject(data);
      setQueue(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  /** Actualiza un item de la cola por indice. */
  function updateItem(index: number, patch: Partial<QueueItem>) {
    setQueue((prev) =>
      prev.map((it) => (it.index === index ? { ...it, ...patch } : it)),
    );
  }

  /** Paso 2: generar todos los videos en cola, UNO TRAS OTRO. */
  async function handleGenerate() {
    if (!dir || queue.length === 0) return;
    setRunning(true);
    setError(null);

    try {
      const tabId = await ensureMetaTab();

      // Instruccion que garantiza que Meta AI genere un VIDEO (no una imagen).
      const prefix =
        project?.promptPrefix !== undefined
          ? project.promptPrefix
          : DEFAULT_PROMPT_PREFIX;

      for (const item of queue) {
        if (item.status === 'downloaded') continue;
        updateItem(item.index, { status: 'generating', error: undefined });

        try {
          // Leer la imagen de referencia de la escena.
          const imageDataUrl = await readImageAsDataUrl(dir, item.imageName);

          // Combinar el prefijo de animacion con el prompt de la escena.
          const finalPrompt = prefix ? `${prefix} ${item.prompt}` : item.prompt;

          // Pedir al content script que genere el video y esperar su URL.
          // (El content script abre un chat nuevo por su cuenta.)
          const res = await requestVideo(tabId, {
            prompt: finalPrompt,
            imageDataUrl,
            imageName: item.imageName,
          });

          if (!res.ok) throw new Error(res.error);
          if (res.type !== 'VIDEO_READY') throw new Error('Respuesta inesperada.');

          // Descargar el video desde su URL (la extension tiene permiso para fbcdn).
          const resp = await fetch(res.videoUrl);
          if (!resp.ok) {
            throw new Error(`No se pudo descargar el video (HTTP ${resp.status}).`);
          }
          const blob = await resp.blob();

          // Guardar el video en la subcarpeta de salida.
          const ext = extensionForMime(blob.type || 'video/mp4');
          const num = String(item.index + 1).padStart(2, '0');
          const filename = `${num}_${item.sceneId}.${ext}`;
          await saveVideoBlob(dir, filename, blob);

          updateItem(item.index, { status: 'downloaded', outputName: filename });
        } catch (err) {
          updateItem(item.index, {
            status: 'error',
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
    }
  }

  return (
    <main className="app">
      <header className="header">
        <h1>🎬 Meta Video Generator</h1>
        <p className="subtitle">
          Genera videos en Meta AI de forma automatica a partir de una carpeta
          de proyecto (JSON + imagenes).
        </p>
      </header>

      <section className="controls">
        <button onClick={handlePickFolder} disabled={running}>
          📁 Seleccionar carpeta del proyecto
        </button>
        <button
          className="primary"
          onClick={handleGenerate}
          disabled={running || queue.length === 0}
        >
          {running ? '⏳ Generando...' : '▶️ Generar videos'}
        </button>
      </section>

      {error && <div className="alert error">⚠️ {error}</div>}

      {project && (
        <section className="project-info">
          <h2>{project.title ?? 'Proyecto'}</h2>
          <p>
            {queue.length} escena(s) detectada(s) · {done}/{queue.length}{' '}
            completada(s)
          </p>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: queue.length ? `${(done / queue.length) * 100}%` : '0%',
              }}
            />
          </div>
        </section>
      )}

      {queue.length > 0 && (
        <ol className="queue">
          {queue.map((item) => (
            <li key={item.index} className={`queue-item ${item.status}`}>
              <span className="badge">{statusLabel(item.status)}</span>
              <div className="queue-body">
                <strong>
                  #{item.index + 1} · {item.sceneId}
                </strong>
                <p className="prompt">{item.prompt}</p>
                <small className="meta">🖼️ {item.imageName}</small>
                {item.outputName && (
                  <small className="meta ok">💾 {item.outputName}</small>
                )}
                {item.error && <small className="meta err">{item.error}</small>}
              </div>
            </li>
          ))}
        </ol>
      )}

      {queue.length === 0 && !error && (
        <p className="hint">
          Selecciona una carpeta que contenga <code>project.json</code> y una
          subcarpeta <code>images/</code>. Mira el ejemplo en{' '}
          <code>example-project/</code>.
        </p>
      )}
    </main>
  );
}

function statusLabel(status: QueueItem['status']): string {
  switch (status) {
    case 'pending':
      return '⏸️';
    case 'generating':
      return '⏳';
    case 'downloaded':
      return '✅';
    case 'error':
      return '❌';
  }
}
