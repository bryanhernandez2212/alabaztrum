import os

# Railway proporciona el puerto en la variable de entorno PORT
port = os.environ.get('PORT', '5000')
bind = f"0.0.0.0:{port}"
workers = 1
worker_class = "sync"
timeout = 120
keepalive = 5
accesslog = "-"
errorlog = "-"
loglevel = "info"
preload_app = False

