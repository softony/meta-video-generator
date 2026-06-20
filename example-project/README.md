# Carpeta de ejemplo

Esta es la estructura que debe respetar cualquier proyecto que quieras generar:

```
example-project/
├── project.json        # define las escenas (id, prompt, imagen)
├── images/             # imagenes de referencia, una por escena
│   ├── scene-1.png
│   ├── scene-2.png
│   └── scene-3.png
└── videos/             # (se crea solo) aqui se guardan los videos generados
```

## project.json

```json
{
  "title": "Nombre del proyecto",
  "scenes": [
    { "id": "scene-1", "prompt": "Descripcion del video...", "image": "scene-1.png" }
  ]
}
```

- `id`: identificador unico de la escena (se usa para nombrar el video).
- `prompt`: el texto que se enviara a Meta AI para generar el video.
- `image`: nombre del archivo dentro de `images/` que se usara como referencia.

## Como usarla

1. Abre el panel de control de la extension.
2. Pulsa "Seleccionar carpeta del proyecto" y elige ESTA carpeta.
3. Pulsa "Generar videos".
4. Al terminar, los videos apareceran dentro de `videos/`.

> Las imagenes incluidas aqui son placeholders de colores solidos. Reemplazalas
> por tus imagenes reales (puedes generarlas gratis, por ejemplo con Flow + nano
> banana, como menciona el video).
