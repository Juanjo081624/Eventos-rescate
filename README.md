# Gestión de Eventos Rescate CUA

Aplicación web progresiva (PWA) para crear, administrar, filtrar, restaurar, respaldar y exportar eventos operativos de la Unidad de Rescate de Clínica Universidad de los Andes.

## Características

- Dashboard mensual con indicadores, próximos eventos, alertas y participación.
- Calendario mensual con eventos por rango de fechas.
- Creación y edición de eventos, integrantes y móviles.
- Cálculo automático de duración, incluso en eventos de varios días.
- Detección de cruces de funcionarios y móviles.
- Historial de trazabilidad por evento.
- Papelera con restauración y eliminación definitiva.
- Mensajes preparados para WhatsApp.
- Informes consolidados y exportación a PDF mediante impresión, Excel XML (`.xls`) y CSV.
- Respaldo e importación completa en JSON.
- IndexedDB para persistencia local.
- Service Worker y Web App Manifest para funcionamiento offline e instalación.
- Sin librerías externas ni dependencias CDN.

## Ejecución local

Por seguridad del navegador, el Service Worker e IndexedDB deben ejecutarse mediante un servidor local, no abriendo `index.html` directamente con `file://`.

### Opción con Python

```bash
cd rescate-eventos-pwa
python3 -m http.server 8080
```

Luego abrir:

```text
http://localhost:8080
```

### Opción con Node.js

```bash
npx serve .
```

## Instalación como PWA

1. Abrir la aplicación desde `localhost` o un servidor HTTPS.
2. Esperar la primera carga completa.
3. Usar el botón **Instalar app** o la opción de instalación del navegador.
4. Después de la primera carga, la interfaz queda disponible offline.

## Exportación PDF

La aplicación genera una vista de impresión en formato carta. En el diálogo del navegador se debe elegir **Guardar como PDF**. Esto evita depender de bibliotecas externas y mantiene la aplicación completamente offline.

## Exportación Excel

Se genera un archivo Excel XML compatible con Microsoft Excel con extensión `.xls`. No se usa `.xlsx` porque ese formato requiere una biblioteca ZIP/XML adicional; se privilegió mantener el proyecto autónomo y offline.

## Datos y privacidad

Todos los datos permanecen en el navegador del dispositivo. No se transmiten a servidores. El respaldo JSON permite migrar o recuperar la información manualmente.

## Migración futura

La capa de persistencia está aislada en `db.js`. Para migrar a Microsoft Lists, SharePoint, Dataverse, una API REST o una base institucional, se puede reemplazar esa capa manteniendo la interfaz y la lógica de negocio.
