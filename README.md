# FramaShare

Un prototipo local para compartir y leer documentos (PDF, EPUB) y álbumes de manera segura y controlada. El proyecto ahora utiliza una arquitectura Monorepo gestionada por **pnpm** con un backend en Fastify/Prisma y un frontend en Vue 3/Vite.

## 🚀 Requisitos Previos

- **Node.js** v22+
- **pnpm** v9+ (`npm install -g pnpm` o `corepack enable pnpm`)
- **Docker** y **Docker Compose** (para la base de datos y despliegue)

## 📦 Instalación y Arranque Rápido

1. **Instalar dependencias del workspace:**
   ```bash
   pnpm install
   ```

2. **Levantar la base de datos (PostgreSQL):**
   ```bash
   make db-up
   ```

3. **Ejecutar migraciones de Prisma y generar el cliente DB:**
   ```bash
   make db-migrate
   ```

4. **Levantar el entorno de desarrollo (Frontend + Backend concurrentes):**
   ```bash
   make dev
   ```

El Frontend estará disponible en `http://localhost:5173` y el Backend en `http://localhost:3000`.

---

## 🛠️ Reglas del Makefile

El proyecto incluye un `Makefile` interactivo (con animaciones y colores) para facilitar el día a día.

| Comando | Descripción |
| :--- | :--- |
| `make install` | Instala todas las dependencias del monorepo (Frontend y Backend). |
| `make dev` | Inicia los servidores de desarrollo de manera concurrente. |
| `make build` | Compila ambos proyectos para producción (`dist/`). |
| `make db-up` | Levanta los contenedores de Docker (PostgreSQL, Nginx, etc.) en segundo plano. |
| `make db-down` | Apaga los contenedores de Docker. |
| `make db-migrate` | Aplica las migraciones de Prisma a la DB y genera el Prisma Client para TypeScript. |
| `make clean` | Elimina las carpetas autogeneradas (`dist/`, `build/`, Prisma client). Ideal para limpiar antes de subir a git. |
| `make fclean` | **Full Clean:** Hace lo mismo que `clean`, pero además borra **todos** los `node_modules` y archivos `.lock`. |
| `make re` | Reinstala todo desde cero (Ejecuta `fclean` seguido de `install`). |
| `make all` | (Por defecto) Instala dependencias y levanta el entorno de desarrollo. |

---

## 🏛️ Estructura del Monorepo

- `frontend/` - Cliente web en **Vue 3** y **Vite**.
- `back/` - API REST en **Fastify**, ORM **Prisma** (PostgreSQL).
- `nginx/` - Proxy reverso (para producción/Docker).
- `docker-compose.yml` - Orquestador de la base de datos.
- `Makefile` - Scripts de atajo para automatización.

## 🗄️ Base de Datos Local

Puedes acceder directamente a la base de datos para inspeccionar las tablas que Prisma ha creado usando el siguiente comando (la contraseña de admin está en el archivo `.env` del backend):

```bash
docker compose exec -it db psql -U admin -d miapp_db
```
Una vez dentro de `psql`, puedes usar los comandos:
- `\dt` : Ver las tablas.
- `\d nombre_tabla` : Ver columnas de una tabla en específico.
- `\q` : Salir.