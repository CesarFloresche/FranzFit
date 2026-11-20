# FranzFit

FranzFit es una aplicación web para organizar rutinas de gimnasio y calistenia. Incluye una guía visual de ejercicios, temporizador de entrenamiento, reproductor de YouTube y un chatbot de entrenamiento con IA local.

El proyecto separa el **frontend Angular** del **backend Express**. El backend conversa con **Ollama usando Gemma 3** y guarda las conversaciones en **MySQL/MariaDB de XAMPP**.

## Funciones

- Rutinas de ejemplo para gimnasio y calistenia.
- Visualización biomecánica animada en Canvas.
- Temporizador para la sesión y los descansos.
- Chatbot en español con historial persistido en MySQL.
- Reproductor de YouTube que acepta enlaces normales, cortos y `/shorts/`.

## Arquitectura

| Capa | Tecnología | Responsabilidad |
| --- | --- | --- |
| Frontend | Angular standalone, TypeScript y Signals | Interfaz, rutinas, temporizador, Canvas y chat |
| Backend | Node.js y Express | API, validación de mensajes e integración con Ollama/MySQL |
| IA local | Ollama y Gemma 3 | Respuestas del entrenador virtual |
| Base de datos | MySQL/MariaDB de XAMPP | Conversaciones y mensajes del chatbot |

Rutas principales de la API:

- `GET /api/health`: comprueba la conexión del backend con MySQL.
- `POST /api/chat`: envía `{ "message": "...", "conversationId": "..." }` y devuelve la respuesta de Gemma 3. `conversationId` es opcional al iniciar una conversación.

## Requisitos

- Node.js 22 o superior y npm.
- XAMPP con MySQL iniciado.
- Ollama instalado en el mismo equipo que ejecuta el backend.
- Modelo Gemma 3 descargado.

## Instalación en Windows

1. Clona el repositorio y entra a su carpeta:

   ```powershell
   git clone https://github.com/CesarFloresche/FranzFit.git
   cd FranzFit
   ```

2. Instala las dependencias y crea tu configuración local:

   ```powershell
   npm ci
   Copy-Item .env.example .env
   ```

3. Edita `.env` en tu equipo. Para XAMPP local, los valores iniciales suelen funcionar; configura `MYSQL_PASSWORD` si tu usuario MySQL tiene contraseña. **No publiques ni compartas el archivo `.env`.**

   | Variable | Uso | Valor local predeterminado |
   | --- | --- | --- |
   | `PORT` | Puerto de la API | `3000` |
   | `MYSQL_HOST` | Host de MySQL | `127.0.0.1` |
   | `MYSQL_PORT` | Puerto de MySQL | `3306` |
   | `MYSQL_USER` | Usuario MySQL | `root` |
   | `MYSQL_PASSWORD` | Contraseña local de MySQL | Vacía |
   | `MYSQL_DATABASE` | Base de datos | `franzfit` |
   | `OLLAMA_BASE_URL` | Dirección local de Ollama | `http://127.0.0.1:11434` |
   | `OLLAMA_MODEL` | Modelo instalado en Ollama | `gemma3:latest` |

4. Abre XAMPP, inicia **MySQL** y, desde phpMyAdmin, importa [`database/schema.sql`](./database/schema.sql). El script crea la base `franzfit` y las tablas `conversations` y `chat_messages`.
5. Descarga Gemma 3 si aún no está instalado:

   ```powershell
   ollama pull gemma3
   ```

   Asegúrate de que Ollama esté ejecutándose localmente.
6. Inicia el backend en una terminal:

   ```powershell
   npm run api
   ```

7. En otra terminal inicia Angular:

   ```powershell
   npm start
   ```

8. Abre <http://localhost:4200>. Angular reenvía `/api` al backend local. Puedes comprobar la conexión a MySQL en <http://localhost:3000/api/health>.

Para compilar Angular y servir el frontend y la API desde el backend:

```powershell
npm run start:prod
```

En un despliegue público configura HTTPS y credenciales propias. No expongas directamente MySQL, phpMyAdmin ni el puerto local de Ollama a Internet.

## YouTube

El reproductor inicia con [Syn Cole — Feel Good (NCS)](https://www.youtube.com/watch?v=q1ULJ92aldE), cuyo enlace de YouTube ofrece el reproductor incrustado oficial. También puedes reemplazarlo pegando otro enlace.

La inserción permitida no garantiza reproducción en todos los equipos: YouTube, el propietario del video, la región o los códecs disponibles en el navegador pueden impedirla. La aplicación muestra el error recibido y ofrece abrir el video directamente en YouTube; no intenta evadir esas restricciones.

## Pruebas

```powershell
npm run build
npm test -- --watch=false
npm run test:api
```

Las pruebas de API usan dobles de MySQL y Ollama y no necesitan contraseñas reales, XAMPP activo ni un modelo cargado.
