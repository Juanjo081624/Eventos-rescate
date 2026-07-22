# Eventos Rescate CUA v2.2

PWA para gestión de eventos operativos, con Firestore compartido, acceso mediante Google y roles.

## Publicación en GitHub Pages

1. Sube todos los archivos de esta carpeta a la raíz del repositorio.
2. Espera el despliegue de GitHub Pages.
3. Borra el Service Worker/caché de la versión anterior o abre la página en una ventana privada.
4. Inicia sesión con Google.

## Primer administrador

El primer acceso Google crea automáticamente `users/{UID}` con:

- `role: pending`
- `active: false`

Desde Firebase Console abre ese documento y cambia:

- `role` a `admin`
- `active` a `true`

Cierra sesión y vuelve a ingresar.

## Reglas de Firestore

Después de confirmar que el administrador puede entrar, copia el contenido de `firestore.rules` en:

`Firebase > Firestore > Reglas`

Luego pulsa **Publicar**.

## Roles

- `admin`: acceso completo, usuarios, papelera e importación.
- `user`: crea y modifica eventos.
- `readonly`: consulta sin modificar.
- `pending`: cuenta registrada, pendiente de autorización.

## Nota de seguridad

La configuración web de Firebase no es una contraseña secreta. La seguridad real depende de Authentication y las reglas de Firestore.
