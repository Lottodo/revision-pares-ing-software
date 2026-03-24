# Sistema de Revisión por Pares Asistido por IA para Congresos y Revistas Científicas (PWA-Native)

## Visión General

<p>Un sistema inteligente y progresivo que gestiona todo el flujo de trabajo de revisión por pares, diseñado como una <strong>Progressive Web App (PWA)</strong> para ofrecer una experiencia nativa en todos los dispositivos, con capacidades offline-first, notificaciones push, y sincronización en segundo plano.</p> <p>El sistema utiliza LLMs para asistir en detección de conflictos de interés, emparejamiento automático de revisores, análisis de calidad de revisiones, y detección de plagio, permitiendo a editores y revisores trabajar desde cualquier lugar, incluso sin conexión a internet.</p>

## Configuración de IDE recomendado

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (sin Vetur).

Es necesario tener instalado [Node.js](https://nodejs.org/es/download) para poder desarrollar y lanzar el proyecto.

## Cómo lanzar:

Primero debes instalar las dependencias, utilizando este comando estando en la raíz del proyecto:
```sh
npm install
```
Una vez instaladas, en la misma raíz del proyecto, lanza el siguiente comando para correr el servidor en modo de desarrollo:
```sh
npm run dev
```

Para correr en modo Producción lanza el siguiente comando:
```sh
npm run build
```
