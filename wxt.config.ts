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

    // Permite a la extension actuar sobre el dominio de Meta AI.
    // Si Meta cambia su dominio, actualiza estos patrones.
    host_permissions: ['*://*.meta.ai/*'],
  },
});
