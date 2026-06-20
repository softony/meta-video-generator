import { defineConfig } from 'wxt';

// Documentacion: https://wxt.dev/api/config.html
export default defineConfig({
  // Modulo oficial que habilita React + TypeScript en los entrypoints.
  modules: ['@wxt-dev/module-react'],

  manifest: {
    name: 'Meta Video Generator',
    description:
      'Automatiza la generacion de videos en Meta AI: sube imagen + prompt, espera y descarga, en cola.',
    version: '1.0.0',

    // Permisos necesarios:
    // - tabs: para encontrar/abrir la pestana de Meta AI y enviarle mensajes.
    // - storage: para guardar el progreso/estado de la cola.
    permissions: ['tabs', 'storage'],

    // Permite a la extension actuar sobre el dominio de Meta AI y descargar
    // los videos generados (Meta los sirve desde *.fbcdn.net). El permiso de
    // host evita errores de CORS al descargar el mp4 desde el panel.
    // Si Meta cambia sus dominios, actualiza estos patrones.
    host_permissions: ['*://*.meta.ai/*', '*://*.fbcdn.net/*'],
  },
});
