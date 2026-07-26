# Plan de backend y almacenamiento de Quillqay

## 1. Objetivo

Construir la primera versión funcional del backend de Quillqay con:

- Rust, Axum y SQLx.
- PostgreSQL como fuente de verdad para usuarios, sesiones, proyectos, metadatos y versiones.
- MinIO como almacenamiento privado del contenido de documentos y, posteriormente, diagramas y adjuntos.
- Docker Compose para el entorno de desarrollo.
- Un login sencillo para un único usuario administrador.
- Persistencia real de proyectos y documentos, sustituyendo sus datos demo en el frontend.

La primera entrega se centrará en proyectos y documentos. Notas, kanban, diagramas, OAuth, organizaciones y colaboración se incorporarán en fases posteriores.

## 2. Decisiones acordadas

- PostgreSQL no se limitará a almacenar usuarios: también controlará propiedad, metadatos, versiones, estados de eliminación y referencias a objetos.
- El contenido completo de Editor.js se almacenará como objetos JSON en MinIO.
- Los objetos serán privados e inmutables.
- El navegador no tendrá credenciales de MinIO ni acceso directo al contenido JSON.
- El backend validará, leerá y escribirá los documentos.
- Habrá autosave del estado actual y checkpoints históricos cada 5 minutos de actividad.
- Los recursos eliminados permanecerán 30 días en una papelera antes de su purga.
- MinIO se ejecutará inicialmente con Docker. La integración usará la API compatible con S3 para permitir un traslado posterior a Kubernetes sin cambiar el dominio ni los contratos HTTP.
- No es necesario conservar datos de las tablas experimentales `pages` y `blocks`.

## 3. Arquitectura de la primera entrega

```text
Next.js
   │
   │ HTTPS + cookie HttpOnly
   ▼
Rust / Axum
   ├── autenticación y autorización
   ├── validación de solicitudes
   ├── repositorios SQLx
   ├── servicio de documentos
   └── tareas de mantenimiento
          │
          ├──────────────► PostgreSQL
          │                usuarios, sesiones, proyectos,
          │                documentos y versiones
          │
          └──────────────► MinIO
                           contenido JSON y futuros adjuntos
```

El backend conservará la separación actual entre dominio e infraestructura, ampliándola con servicios de aplicación. Los handlers HTTP no ejecutarán SQL ni operaciones S3 directamente.

### Servicios locales

Docker Compose levantará:

- `postgres`: base de datos de desarrollo.
- `minio`: API S3 y consola de administración.
- `minio-init`: creación idempotente de buckets y políticas privadas.
- `backend`: API de Rust.
- `mailpit` no se incluirá todavía; verificación de correo y recuperación de contraseña quedan diferidas.

Buckets iniciales:

- `quillqay-content`: contenido JSON y revisiones.
- `quillqay-assets`: reservado para imágenes y adjuntos futuros.

Todas las direcciones, credenciales, región, buckets y opciones TLS se configurarán mediante variables de entorno. Las credenciales de ejemplo no se usarán en producción.

## 4. Modelo de datos PostgreSQL

Las migraciones nuevas eliminarán el esquema experimental `pages/blocks` y crearán las siguientes tablas. No se reescribirán migraciones ya publicadas; se añadirá una migración incremental.

### `users`

- `id UUID PRIMARY KEY`
- `email TEXT NOT NULL`
- `password_hash TEXT NOT NULL`
- `display_name TEXT`
- `status TEXT NOT NULL DEFAULT 'active'`
- `created_at TIMESTAMPTZ NOT NULL`
- `updated_at TIMESTAMPTZ NOT NULL`
- Índice único sobre `LOWER(email)`.

La primera cuenta se creará con un comando idempotente de administración que tomará email y contraseña desde variables o secretos de Docker. No habrá registro público en esta fase.

### `sessions`

- `id UUID PRIMARY KEY`
- `user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE`
- `token_hash BYTEA NOT NULL UNIQUE`
- `expires_at TIMESTAMPTZ NOT NULL`
- `last_seen_at TIMESTAMPTZ NOT NULL`
- `created_at TIMESTAMPTZ NOT NULL`
- Índices por `user_id` y `expires_at`.

PostgreSQL almacenará solamente el hash del token de sesión, nunca el valor entregado al navegador.

### `projects`

- `id UUID PRIMARY KEY`
- `owner_id UUID NOT NULL REFERENCES users(id)`
- `title TEXT NOT NULL`
- `description TEXT NOT NULL DEFAULT ''`
- `color TEXT NOT NULL DEFAULT 'primary'`
- `tags TEXT[] NOT NULL DEFAULT '{}'`
- `deleted_at TIMESTAMPTZ`
- `created_at TIMESTAMPTZ NOT NULL`
- `updated_at TIMESTAMPTZ NOT NULL`
- Índices por `owner_id`, `updated_at` y `deleted_at`.

El número de documentos se calculará mediante consulta; no se guardará como contador modificable.

### `documents`

- `id UUID PRIMARY KEY`
- `project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE`
- `title TEXT NOT NULL`
- `current_version BIGINT NOT NULL DEFAULT 0`
- `current_object_key TEXT`
- `current_checksum TEXT`
- `current_size_bytes BIGINT`
- `last_checkpoint_at TIMESTAMPTZ`
- `deleted_at TIMESTAMPTZ`
- `created_at TIMESTAMPTZ NOT NULL`
- `updated_at TIMESTAMPTZ NOT NULL`
- Restricción única sobre `(project_id, id)`.
- Índices por `project_id`, `updated_at` y `deleted_at`.

### `document_versions`

- `id UUID PRIMARY KEY`
- `document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE`
- `version BIGINT NOT NULL`
- `object_key TEXT NOT NULL UNIQUE`
- `checksum TEXT NOT NULL`
- `size_bytes BIGINT NOT NULL`
- `is_checkpoint BOOLEAN NOT NULL DEFAULT FALSE`
- `created_by UUID NOT NULL REFERENCES users(id)`
- `created_at TIMESTAMPTZ NOT NULL`
- Restricción única sobre `(document_id, version)`.
- Índices por `(document_id, created_at)` y `(document_id, is_checkpoint)`.

Cada autosave exitoso crea una versión técnica. Un máximo de un autosave cada 5 minutos se marca como checkpoint histórico. Las versiones no checkpoint que ya no sean actuales podrán eliminarse después de 24 horas; los checkpoints se conservarán hasta que se defina una política de retención más amplia.

### `storage_cleanup_jobs`

- Registra objetos huérfanos o pendientes de eliminación.
- Contiene `object_key`, bucket, motivo, número de intentos, próximo intento y último error.
- Permite recuperar consistencia cuando MinIO funciona pero falla la transacción PostgreSQL.

## 5. Formato de objetos en MinIO

Claves para documentos:

```text
projects/{project_id}/documents/{document_id}/versions/{version}-{version_id}.json
```

El objeto tendrá un formato versionado:

```json
{
  "schemaVersion": 1,
  "editor": "editorjs",
  "time": 0,
  "version": "2.30",
  "blocks": []
}
```

Reglas:

- `schemaVersion` permitirá evolucionar el contrato interno.
- El backend validará tipos, tamaño total, cantidad de bloques e identificadores.
- Se calculará SHA-256 antes de registrar la versión.
- La metadata S3 incluirá checksum, tipo de contenido y versión del esquema.
- No se aceptarán claves de objeto proporcionadas por el cliente.
- Los JSON pequeños siempre atravesarán el backend; las URLs prefirmadas se reservarán para adjuntos grandes en una fase futura.

## 6. Consistencia entre PostgreSQL y MinIO

Un autosave seguirá esta secuencia:

1. Autenticar al usuario y comprobar que es propietario del proyecto.
2. Validar `base_version` y el contenido recibido.
3. Serializar de forma canónica, calcular checksum y tamaño.
4. Subir un objeto inmutable a MinIO.
5. Abrir una transacción PostgreSQL y bloquear el documento con `SELECT ... FOR UPDATE`.
6. Volver a comprobar `base_version`.
7. Insertar `document_versions` y actualizar el puntero actual de `documents`.
8. Confirmar la transacción.
9. Si PostgreSQL falla o detecta conflicto después de la subida, registrar el objeto para limpieza.

Una versión desactualizada devolverá `409 Conflict` y no sobrescribirá silenciosamente contenido reciente.

Las tareas periódicas utilizarán bloqueo asesor de PostgreSQL o `FOR UPDATE SKIP LOCKED`, de modo que puedan ejecutarse con varias réplicas del backend sin duplicar trabajo.

## 7. Autenticación de la primera fase

Se implementará un único usuario administrador, sin registro público.

- Contraseñas con Argon2id y salt aleatorio.
- Cookie de sesión opaca con token aleatorio de 256 bits.
- Cookie `HttpOnly`, `SameSite=Lax`, `Path=/` y `Secure` en producción.
- Duración inicial de 7 días.
- Rotación del token en cada login.
- Revocación inmediata en logout.
- Comparaciones resistentes a ataques de tiempo.
- Rate limiting en login.
- Validación de `Origin` en métodos que modifican datos.
- CORS restringido a los orígenes configurados; se eliminará `CorsLayer::permissive()`.

La verificación de email, recuperación de contraseña, registro, Google y GitHub se dejan para una fase posterior.

## 8. API HTTP `/api/v1`

Todas las respuestas de error usarán:

```json
{
  "error": {
    "code": "document_version_conflict",
    "message": "The document has a newer version"
  }
}
```

### Sesión

- `POST /auth/login`: recibe email y contraseña, crea cookie y devuelve el usuario.
- `POST /auth/logout`: revoca la sesión y elimina la cookie.
- `GET /auth/me`: devuelve el usuario autenticado.

### Proyectos

- `GET /projects`: lista proyectos activos del usuario, con cantidad de documentos.
- `POST /projects`: crea un proyecto.
- `GET /projects/:project_id`: obtiene sus metadatos.
- `PATCH /projects/:project_id`: modifica título, descripción, color o tags.
- `DELETE /projects/:project_id`: mueve el proyecto a la papelera.
- `POST /projects/:project_id/restore`: restaura un proyecto no purgado.

### Documentos

- `GET /projects/:project_id/documents`: lista metadatos de documentos activos.
- `POST /projects/:project_id/documents`: crea un documento vacío.
- `GET /projects/:project_id/documents/:document_id`: devuelve metadatos, contenido y versión actual.
- `PATCH /projects/:project_id/documents/:document_id`: cambia el título.
- `PUT /projects/:project_id/documents/:document_id/content`: autosave con `base_version` y contenido Editor.js.
- `DELETE /projects/:project_id/documents/:document_id`: mueve el documento a la papelera.
- `POST /projects/:project_id/documents/:document_id/restore`: restaura el documento.
- `GET /projects/:project_id/documents/:document_id/revisions`: lista checkpoints.
- `GET /projects/:project_id/documents/:document_id/revisions/:revision_id`: carga un checkpoint.
- `POST /projects/:project_id/documents/:document_id/revisions/:revision_id/restore`: crea una versión nueva a partir de un checkpoint.

Los listados usarán orden por `updated_at DESC`. Se añadirá paginación por cursor antes de superar los límites definidos para producción; la primera interfaz podrá usar un límite conservador por defecto.

## 9. Integración del frontend

No se rediseñará la interfaz. Se sustituirá únicamente el estado demo por datos reales:

- Centralizar tipos y cliente HTTP para auth, proyectos y documentos.
- Usar TanStack Query para listados, detalle, invalidación y estados de carga/error.
- Proteger `/projects/**` consultando `/auth/me`.
- Conectar el formulario de login con la cookie de sesión.
- Reemplazar `initialProjects` y `demoDocs`.
- Cargar el contenido real antes de inicializar Editor.js.
- Mantener el debounce actual de 1 segundo para autosave.
- Enviar `base_version` y actualizar la versión local tras cada respuesta.
- Mostrar estado de guardado, reintentar errores transitorios con backoff limitado y detener reintentos automáticos ante `409`.
- Invalidar listados tras crear, renombrar, eliminar o restaurar.

## 10. Observabilidad, salud y configuración

- Mantener `/health` como liveness sin dependencias externas.
- Añadir `/ready` para comprobar PostgreSQL y MinIO.
- Añadir identificador de petición y logging estructurado con `tracing`.
- No registrar contraseñas, cookies, contenido de documentos ni credenciales.
- Configuración validada al arrancar: base de datos, endpoint S3, región, buckets, credenciales, origen permitido, secreto/cookie y límites.
- Migraciones ejecutadas como paso explícito antes de iniciar la aplicación, no concurrentemente desde cada réplica.
- Backups independientes para PostgreSQL y los volúmenes de MinIO.

## 11. Orden de implementación

### Etapa 1: entorno y esquema

- Añadir Docker Compose, PostgreSQL, MinIO, inicializador de buckets y volúmenes.
- Añadir configuración tipada y validación de variables.
- Crear migraciones SQL y comando idempotente para el administrador inicial.

### Etapa 2: núcleo del backend

- Implementar entidades, repositorios y servicios para usuarios, sesiones y proyectos.
- Implementar cliente S3 compatible con MinIO.
- Añadir errores de dominio y contrato HTTP uniforme.
- Implementar middleware de sesión, ownership, Origin y rate limiting.

### Etapa 3: documentos

- Implementar validación del formato Editor.js.
- Implementar lectura, autosave con control optimista, checkpoints y restauración.
- Implementar papelera y trabajos idempotentes de limpieza.
- Retirar endpoints antiguos de `pages`.

### Etapa 4: frontend

- Conectar login, proyectos, documentos y editor.
- Sustituir datos demo de esos módulos.
- Añadir estados de carga, vacío, error, conflicto y reintento sin cambiar el diseño visual.

### Etapa 5: endurecimiento

- Añadir límites de tamaño, timeouts, rate limits y políticas privadas.
- Probar fallos parciales de MinIO/PostgreSQL y recuperación de trabajos.
- Actualizar Docker, CI, documentación y ejemplo de variables.

## 12. Pruebas y criterios de aceptación

### Pruebas unitarias

- Hash y verificación de contraseñas.
- Generación y hash de tokens.
- Validación y límites de Editor.js.
- Reglas de checkpoint.
- Construcción segura de claves S3.
- Mapeo de errores de dominio a HTTP.

### Pruebas de integración

- Migraciones sobre PostgreSQL limpio.
- CRUD de proyectos y aislamiento por propietario.
- Login, sesión válida, expiración y logout.
- Subida y lectura real desde MinIO.
- Autosave crea una versión y actualiza el puntero.
- Dos autosaves con la misma base producen un éxito y un `409`.
- Fallo de PostgreSQL después de subir a MinIO genera limpieza pendiente.
- Papelera, restauración y purga después de 30 días.
- Restaurar un checkpoint crea una versión nueva sin alterar el objeto histórico.

### Pruebas extremo a extremo

- Login del administrador.
- Crear, editar, buscar, abrir, eliminar y restaurar un proyecto.
- Crear un documento, recargar la página y conservar el contenido.
- Ver el estado `saving/saved/error`.
- Editar desde dos pestañas y recibir un conflicto sin pérdida silenciosa.
- Simular caída de MinIO y verificar un error recuperable.

La fase 1 se considera terminada cuando un usuario puede iniciar sesión, administrar sus proyectos y trabajar con documentos persistentes, con autosave, historial recuperable, papelera y ejecución reproducible mediante Docker.

## 13. Roadmap posterior

1. Notas y kanban en PostgreSQL, con endpoints propios y orden estable.
2. Diagramas con metadatos en PostgreSQL y contenido JSON en MinIO:
   - Base de datos: tablas, columnas, relaciones, posiciones y viewport.
   - Flowchart: nodos, conexiones y viewport de React Flow.
   - Whiteboard: elementos, estado permitido de Excalidraw y referencias a assets.
   - Arquitectura: nodos, conexiones y viewport cuando exista su editor.
3. Adjuntos e imágenes mediante URLs prefirmadas de corta duración y validación posterior.
4. Registro, verificación de correo, recuperación de contraseña, Google y GitHub.
5. Organizaciones, miembros y roles.
6. Eventos WebSocket entre pestañas.
7. Colaboración simultánea con resolución de conflictos solo si el producto la requiere.
8. Despliegue maduro de MinIO en Kubernetes, conservando el mismo contrato S3.

## 14. Supuestos

- No existe información de producción que deba migrarse desde `pages/blocks`.
- La primera entrega funciona con un administrador y proyectos personales.
- El frontend y el backend se publicarán bajo el mismo sitio o proxy, facilitando cookies seguras.
- Docker es el entorno objetivo inicial; Kubernetes queda fuera de la primera entrega.
- No se admitirán archivos binarios en documentos durante la primera fase.
- El historial conservará checkpoints; la retención definitiva se ajustará con métricas reales de uso.
