# 🎬 Meta Video Generator

Extension de navegador que **automatiza la generacion de videos en Meta AI**:
sube una imagen + prompt, espera a que el video se genere y lo descarga.
Procesa una carpeta entera de escenas **en cola, una tras otra**, de forma
gratuita, sin API, sin modelos locales y sin suscripciones.

> Recreacion paso a paso del proyecto descrito en el video
> "Asi genero videos con IA: 100% GRATIS, ILIMITADO y AUTOMATICO".

---

## 🧠 Como funciona

Meta AI **no tiene API oficial**, asi que la extension automatiza la web
imitando lo que harias a mano. La logica se reparte asi:

| Pieza | Archivo | Que hace |
|-------|---------|----------|
| **Content script** | `entrypoints/meta-ai.content.ts` | Corre dentro de meta.ai. Sube la imagen, escribe el prompt, hace clic en enviar, espera el video y lo obtiene. |
| **Automatizacion DOM** | `lib/dom-automation.ts` | "Las manos": funciones que manipulan el DOM. |
| **Selectores** | `lib/selectors.ts` | **El archivo clave a mantener.** Apunta a los elementos HTML de Meta AI. |
| **Panel de control** | `entrypoints/manager/` | UI React: elige la carpeta, lee el JSON + imagenes, muestra el progreso y guarda los videos. |
| **Popup** | `entrypoints/popup/` | Boton que abre el panel de control. |

```
Panel de control  ──(mensaje: prompt + imagen)──►  Content script (meta.ai)
       ▲                                                    │
       └──────────(mensaje: video listo)───────────────────┘
       │
   File System Access API  →  lee project.json / imagenes  y  guarda videos/
```

---

## 🚀 Instalacion y uso

### 1. Requisitos
- Node.js 18+ y un navegador Chromium (Chrome, Edge, Brave...).
- Una cuenta de **Meta AI** con sesion iniciada en el navegador.

### 2. Clonar e instalar
```bash
git clone <URL-DE-TU-REPO>
cd meta-video-generator
npm install
```

### 3. Ejecutar en modo desarrollo
```bash
npm run dev
```
Esto abre un navegador con la extension ya instalada.

### 4. Cargar la extension en tu navegador principal
1. Ve al gestor de extensiones (`chrome://extensions`).
2. Activa el **Modo desarrollador**.
3. Clic en **Cargar descomprimida** (*Load unpacked*).
4. Busca la carpeta del proyecto → entra en la carpeta oculta **`.output`**.
5. Selecciona la carpeta **`chrome-mv3`**.

### 5. Generar videos
1. Abre y **inicia sesion en https://www.meta.ai/**.
2. Haz clic en el icono de la extension → **Abrir panel de control**.
3. Pulsa **Seleccionar carpeta del proyecto** y elige una carpeta con la
   estructura del ejemplo (`example-project/`).
4. Pulsa **Generar videos**. La extension procesara cada escena en orden y
   guardara los resultados en la subcarpeta `videos/`.

---

## 📁 Estructura de un proyecto

```
mi-proyecto/
├── project.json     # escenas: { id, prompt, image }
├── images/          # una imagen de referencia por escena
└── videos/          # (se crea solo) salida
```

Mira `example-project/` para un ejemplo completo y funcional.

---

## 🔧 Mantenimiento: actualizar los selectores

Los selectores del DOM de Meta AI **cambian con el tiempo**. Si la extension
deja de funcionar, casi siempre la solucion esta en **`lib/selectors.ts`**:

1. Abre meta.ai e inicia sesion.
2. Abre DevTools (`F12`) y usa la herramienta de seleccion (`Ctrl+Shift+C`).
3. Haz clic sobre el boton de subir archivo, el input del chat, el boton de
   enviar y el video generado.
4. Copia selectores estables (id, `aria-label`, `data-*`) y pegalos en
   `lib/selectors.ts`.

---

## ⚠️ Notas importantes (igual que en el video)

- **Marca de agua:** los videos de Meta AI llevan marca de agua. Quitarla queda
  fuera del alcance de este proyecto.
- **Limites ocultos:** se genera **un video a la vez** para no exceder el rate
  limit (desconocido y posiblemente dinamico) de Meta AI.
- **Sujeto a cambios:** si Meta cambia su web o empieza a cobrar, habra que
  adaptar los selectores o el metodo dejara de ser gratuito.
- **Uso responsable:** respeta los terminos de servicio de Meta AI.

---

## 🛠️ Scripts

| Comando | Descripcion |
|---------|-------------|
| `npm run dev` | Desarrollo con hot-reload (Chrome). |
| `npm run dev:firefox` | Desarrollo en Firefox. |
| `npm run build` | Build de produccion. |
| `npm run zip` | Empaqueta la extension en un .zip. |
| `npm run compile` | Verifica los tipos (TypeScript). |
