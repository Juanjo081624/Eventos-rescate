# Gestión de Eventos Rescate CUA v2.1

PWA colaborativa con Firestore y login mediante Firebase Authentication.

## Roles

- `admin`: acceso completo, usuarios, papelera e importación JSON.
- `user`: crea, modifica y envía eventos a papelera.
- `readonly`: consulta dashboard, calendario, eventos e informes.

## Requisitos

1. Firebase Authentication con correo/contraseña habilitado.
2. Cada cuenta debe tener un documento `users/{UID}` con:
   - `fullName`
   - `email`
   - `role`: `admin`, `user` o `readonly`
   - `active`: `true`
3. Publicar las reglas de Firestore indicadas en este README después de subir la versión.

## Reglas recomendadas

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() { return request.auth != null; }
    function profile() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }
    function active() { return signedIn() && profile().active == true; }
    function admin() { return active() && profile().role == 'admin'; }
    function editor() { return active() && (profile().role == 'admin' || profile().role == 'user'); }

    match /events/{eventId} {
      allow read: if active();
      allow create, update: if editor();
      allow delete: if admin();
    }
    match /users/{userId} {
      allow read: if active();
      allow update: if admin();
      allow create, delete: if false;
    }
  }
}
```

Las cuentas nuevas se crean gratuitamente en Firebase Authentication y luego se agrega su perfil en `users/{UID}`.
