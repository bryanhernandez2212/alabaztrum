# ALABAZTRUM - Tienda de Perfumes

Página web de venta de perfumes desarrollada con Flask y Python.

## Instalación

1. Crea y activa un entorno virtual (recomendado):
```bash
python3 -m venv venv
source venv/bin/activate
```

2. Instala las dependencias:
```bash
pip install -r requirements.txt
```

3. Ejecuta la aplicación:
```bash
python app.py
```

**Nota para macOS:** Si `pip` no funciona, usa `pip3` o `python3 -m pip`

3. Abre tu navegador en: http://127.0.0.1:5000

## Estructura del proyecto

```
alabaz/
├── app.py                 # Aplicación Flask principal
├── requirements.txt       # Dependencias del proyecto
├── templates/
│   └── index.html        # Template principal
└── static/
    └── css/
        └── style.css     # Estilos personalizados
```

## Características

- Header con logo, búsqueda y menú de usuario
- Barra de navegación con categorías
- Diseño responsive
- Botón flotante de WhatsApp
- Listo para agregar carrusel de productos

