# Gestión de Eventos Rescate CUA v2.0

PWA multidispositivo para gestionar eventos operativos de la Unidad de Rescate de Clínica Universidad de los Andes.

## Cambios de la versión 2.0

- Cloud Firestore como almacenamiento principal compartido.
- Sincronización en tiempo real entre computadores y teléfonos.
- Persistencia offline de Firestore y sincronización al recuperar conexión.
- Importación de respaldos JSON de la versión local.
- Dashboard, calendario, conflictos, informes, papelera, trazabilidad y exportaciones conservados.

## Publicación en GitHub Pages

1. Sube todos los archivos a la raíz del repositorio.
2. Activa Pages desde la rama `main` y la carpeta `/ (root)`.
3. Limpia el Service Worker anterior después de publicar.
4. Verifica las reglas de Firestore.

## Reglas temporales para pruebas

Las reglas actuales del proyecto permiten lectura y escritura hasta el 13 de agosto de 2026. Antes de esa fecha deben reemplazarse por reglas permanentes y, para uso institucional, autenticación.

## Migrar eventos locales

1. En la versión local, exporta un respaldo JSON.
2. Publica y abre la versión 2.0.
3. Importa el respaldo desde Informes.
4. Confirma que los eventos aparezcan en Firestore y en otro dispositivo.

## Consideración de seguridad

Esta versión no incluye autenticación. Mientras las reglas permitan acceso público, cualquier persona con acceso técnico al proyecto puede leer o modificar datos. No almacenar información clínica ni datos de pacientes.
