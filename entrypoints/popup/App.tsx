import { browser } from 'wxt/browser';

/**
 * El popup es deliberadamente simple: la generacion de videos puede tardar
 * varios minutos y el popup se cierra al perder el foco. Por eso, el trabajo
 * real ocurre en una PAGINA dedicada (manager) que permanece abierta.
 *
 * Este popup solo abre ese panel de control en una pestana.
 */
export function App() {
  function openManager() {
    browser.tabs.create({ url: browser.runtime.getURL('/manager.html') });
    window.close();
  }

  return (
    <main className="popup">
      <h1>🎬 Meta Video Generator</h1>
      <p>
        Automatiza la generacion de videos en Meta AI a partir de una carpeta
        de proyecto.
      </p>
      <button className="primary" onClick={openManager}>
        Abrir panel de control
      </button>
      <small>
        Recuerda tener una pestana de <b>meta.ai</b> con sesion iniciada.
      </small>
    </main>
  );
}
