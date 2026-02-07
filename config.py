# Configuración de Firebase
# Copia este archivo como config.py y agrega tus credenciales

FIREBASE_CONFIG = {
    # Opción 1: Usar archivo de service account
    "service_account_path": "path/to/serviceAccountKey.json",
    
    # Opción 2: Usar credenciales directamente (no recomendado para producción)
    "apiKey": "tu-api-key",
    "authDomain": "tu-proyecto.firebaseapp.com",
    "projectId": "tu-proyecto-id",
    "storageBucket": "tu-proyecto.appspot.com",
    "messagingSenderId": "tu-sender-id",
    "appId": "tu-app-id"
}
