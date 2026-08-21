# 🌱 Rastreador de Hábitos

Aplicación web para llevar el registro diario de hábitos: rachas, objetivo semanal y un mapa de calor con los últimos meses. Sin dependencias, sin build, sin backend — HTML, CSS y JavaScript puros.

**▶️ Probalo en vivo: <https://danielleon21.github.io/rastreador-habitos/>**

## Características

- **Hábitos con objetivo semanal**: al crear un hábito elegís cuántos días por semana querés cumplirlo (1 a 7; por defecto 5). El objetivo se puede editar después desde el botón 🎯 de cada tarjeta.
- **Marcar el día**: el botón ✓ registra o desmarca el día de hoy.
- **Rachas**: racha actual (🔥) y mejor racha histórica (🏆).
- **Progreso semanal**: días cumplidos en la semana en curso (de lunes a hoy), resaltado cuando se alcanza el objetivo.
- **Mapa de calor**: las últimas 18 semanas completas de actividad, con la fecha en el tooltip de cada celda.
- **Búsqueda tolerante**: ignora mayúsculas y acentos, y acepta subsecuencias — escribir `crr` encuentra `Correr`. Los resultados se ordenan por relevancia y la coincidencia se resalta en el nombre.
- **Tema claro y oscuro**: se adapta automáticamente al tema del sistema.
- **Copias de seguridad**: exportá todos tus hábitos a un archivo JSON e importalos en otro navegador o dispositivo.

### Atajos de teclado

| Tecla | Acción |
|---|---|
| `Enter` (en el campo de nuevo hábito) | Abre el diálogo de objetivo semanal |
| `Esc` | Cierra el diálogo abierto; si no hay ninguno, limpia la búsqueda |

## Cómo usarlo

No hace falta instalar nada: la versión publicada corre en <https://danielleon21.github.io/rastreador-habitos/>. Se despliega automáticamente con cada cambio que llega a `main`.

Tené en cuenta que los datos viven en el navegador con el que entres (ver [Almacenamiento de datos](#almacenamiento-de-datos)): abrir el sitio en la compu y en el teléfono te da dos historiales distintos.

## Desarrollo local

No hay proceso de compilación, así que alcanza con abrir `index.html` en el navegador. Aun así conviene servirlo desde un servidor local, porque algunas APIs del navegador (como `crypto.randomUUID`, usada para los IDs) requieren un contexto seguro:

```bash
npx --yes serve -l 8000
```

Si preferís Python, `python -m http.server 8000` hace lo mismo. En cualquier caso, después abrí <http://localhost:8000>.

## Almacenamiento de datos

Todo vive en el navegador: los hábitos se guardan en `localStorage` bajo la clave `habit-tracker-data`. No hay servidor ni cuentas, así que los datos no se sincronizan entre navegadores ni dispositivos, y borrar los datos del sitio los elimina.

### Exportar e importar

Los botones al pie de la página bajan un archivo `rastreador-habitos-AAAA-MM-DD.json` con todo tu historial, y lo vuelven a cargar en cualquier navegador. Es la forma de tener un respaldo y de pasar los datos de un dispositivo a otro.

**Importar reemplaza, no fusiona**: los hábitos que haya en ese navegador se pierden y se quedan solo los del archivo. La app te pide confirmación antes. Fusionar dos historiales que cambiaron por separado es un problema bastante más difícil y corresponde a una sincronización real, no a un archivo que se carga a mano.

## Estructura del proyecto

```
rastreador-habitos/
├── index.html   # Estructura, plantilla de tarjeta y diálogo de objetivo
├── style.css    # Estilos y variables de tema (claro/oscuro)
└── script.js    # Estado, persistencia, rachas, mapa de calor y búsqueda
```
