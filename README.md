# 🕹️ GODFINGER ARCADE (Sistema Phaethon)

![Estado](https://img.shields.io/badge/Estado-Completado-00FFEA?style=for-the-badge)
![Tecnología](https://img.shields.io/badge/HTML5_Canvas-Vanilla_JS-FFD400?style=for-the-badge)
![Institución](https://img.shields.io/badge/ITP-Ingeniería_en_Sistemas-A33A36?style=for-the-badge)

**Godfinger Arcade** (internamente conocido como *Sistema Phaethon*) es un simulador interactivo de telemetría y purgado de entidades 2D. Este proyecto fue desarrollado como parte de la **Actividad 2.4** para la carrera de Ingeniería en Sistemas Computacionales en el Instituto Tecnológico de Pachuca.

El sistema demuestra la implementación desde cero de un motor de físicas básico, detección de colisiones y manipulación directa del DOM interactuando con la API nativa de HTML5 Canvas.

## 🚀 Características Principales (Reglas de Negocio)

El proyecto cumple con múltiples reglas de negocio complejas controladas enteramente con Vanilla JavaScript:

1. **Flujo Vectorial Constante:** Las entidades (círculos) se instancian fuera del perímetro inferior y ascienden con una velocidad calculada dinámicamente según el nivel de amenaza.
2. **Motor de Colisiones Elásticas:** Implementación de cálculo de vectores normales para simular el rebote (bounding) entre múltiples entidades cuando sus radios se intersectan.
3. **Raycasting e Intersección:** Detección precisa de las coordenadas del ratón (`mousemove` y `click`) para identificar colisiones entre el puntero y la geometría de las entidades.
4. **Ciclo de Vida de Objetos (Garbage Collection):** Los objetos clickeados inician una animación de desvanecimiento (`opacity`) antes de ser purgados de la memoria del sistema para optimizar el rendimiento.
5. **Máquina de Estados (State Management):** Flujo completo de juego que incluye transiciones fluidas entre: *Menú Principal -> Jugando -> Pausa -> Game Over / Game Won*.
6. **Sistema de Dificultad Dinámico (QoL):** Selectores en tiempo real que modifican la escala (radio) y velocidad de las entidades, pausando el sistema inteligentemente para evitar desbordamientos durante el cambio.

## 💻 Tecnologías Utilizadas

* **HTML5 Canvas:** Para el renderizado de gráficos 2D de alto rendimiento a 60 FPS (`requestAnimationFrame`).
* **Vanilla JavaScript (ES6+):** Programación Orientada a Objetos (Clases) para la gestión de entidades, bucles de animación y eventos del ratón sin depender de motores externos.
* **CSS3 & Custom Properties:** * Efectos avanzados de *Glassmorphism* (`backdrop-filter`).
  * Simulación de hardware CRT usando pseudo-elementos (`::after`) y gradientes superpuestos.
* **Bootstrap 5:** Sistema de cuadrícula y utilidades responsivas para la estructuración de los paneles de telemetría y consola de comandos.

## ⚙️ Instalación y Uso

Este proyecto no requiere de dependencias externas ni compiladores (Node.js, Webpack, etc.). Funciona de manera nativa en el navegador.

1. Clona este repositorio o descarga el código fuente (ZIP).
```bash
git clone [https://github.com/TuUsuario/godfinger-arcade.git](https://github.com/TuUsuario/godfinger-arcade.git)