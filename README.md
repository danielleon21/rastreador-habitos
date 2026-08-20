# 🌱 Rastreador de Hábitos

Aplicación web para llevar el registro diario de hábitos: rachas, objetivo semanal y un mapa de calor con los últimos meses. Sin dependencias, sin build, sin backend — HTML, CSS y JavaScript puros.

## Características

- **Hábitos con objetivo semanal**: al crear un hábito elegís cuántos días por semana querés cumplirlo (1 a 7; por defecto 5). El objetivo se puede editar después desde el botón 🎯 de cada tarjeta.
- **Marcar el día**: el botón ✓ registra o desmarca el día de hoy.
- **Rachas**: racha actual (🔥) y mejor racha histórica (🏆).
- **Progreso semanal**: días cumplidos en la semana en curso (de lunes a hoy), resaltado cuando se alcanza el objetivo.
- **Mapa de calor**: las últimas 18 semanas de actividad, con la fecha en el tooltip de cada celda.
- **Búsqueda tolerante**: ignora mayúsculas y acentos, y acepta subsecuencias — escribir `crr` encuentra `Correr`. Los resultados se ordenan por relevancia y la coincidencia se resalta en el nombre.
- **Tema claro y oscuro**: se adapta automáticamente al tema del sistema.

### Atajos de teclado

| Tecla | Acción |
|---|---|
| `Enter` (en el campo de nuevo hábito) | Abre el diálogo de objetivo semanal |
| `Esc` | Cierra el diálogo abierto; si no hay ninguno, limpia la búsqueda |

## Cómo ejecutarlo

Al no haber proceso de compilación, alcanza con abrir `index.html` en el navegador. Aun así conviene servirlo desde un servidor local, porque algunas APIs del navegador (como `crypto.randomUUID`, usada para los IDs) requieren un contexto seguro:

```bash
python -m http.server 8000
```

Después abrí <http://localhost:8000> en el navegador.

## Almacenamiento de datos

Todo vive en el navegador: los hábitos se guardan en `localStorage` bajo la clave `habit-tracker-data`. No hay servidor ni cuentas, así que los datos no se sincronizan entre navegadores ni dispositivos, y borrar los datos del sitio los elimina.

## Estructura del proyecto

```
rastreador-habitos/
├── index.html   # Estructura, plantilla de tarjeta y diálogo de objetivo
├── style.css    # Estilos y variables de tema (claro/oscuro)
└── script.js    # Estado, persistencia, rachas, mapa de calor y búsqueda
```
