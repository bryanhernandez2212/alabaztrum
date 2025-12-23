from flask import Flask, render_template
import os
import traceback
import logging

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Helper function para generar breadcrumbs
def get_breadcrumbs(items):
    """Genera breadcrumbs desde una lista de (label, url)"""
    breadcrumbs = [{'label': 'Inicio', 'url': '/'}]
    breadcrumbs.extend([{'label': label, 'url': url} for label, url in items])
    return breadcrumbs

# Log al iniciar
logger.info("Flask app initialized")
logger.info(f"Flask app name: {app.name}")
logger.info(f"Flask template folder: {app.template_folder}")
logger.info(f"Flask static folder: {app.static_folder}")

# Manejo de errores
@app.errorhandler(404)
def not_found(error):
    return {'error': 'Not found'}, 404

@app.errorhandler(500)
def internal_error(error):
    return {'error': 'Internal server error', 'traceback': traceback.format_exc()}, 500

# Ruta de salud para verificar que la app funciona
@app.route('/health')
def health():
    try:
        logger.info("Health check requested")
        response = {'status': 'ok', 'message': 'Application is running'}
        logger.info(f"Health check response: {response}")
        return response, 200
    except Exception as e:
        logger.error(f"Error in health check: {str(e)}")
        logger.error(traceback.format_exc())
        return {'status': 'error', 'message': str(e)}, 500

@app.route('/')
def index():
    try:
        logger.info("Rendering index.html")
        return render_template('index.html', breadcrumbs=None)
    except Exception as e:
        logger.error(f"Error rendering index: {str(e)}")
        logger.error(traceback.format_exc())
        raise

@app.route('/login')
def login():
    breadcrumbs = get_breadcrumbs([('Iniciar Sesión', '/login')])
    return render_template('auth/login.html', breadcrumbs=breadcrumbs)

@app.route('/register')
def register():
    breadcrumbs = get_breadcrumbs([('Crear Cuenta', '/register')])
    return render_template('auth/register.html', breadcrumbs=breadcrumbs)

@app.route('/profile')
def profile():
    breadcrumbs = get_breadcrumbs([('Mi Perfil', '/profile')])
    return render_template('profile.html', breadcrumbs=breadcrumbs)

@app.route('/admin')
def admin():
    breadcrumbs = get_breadcrumbs([('Administración', '/admin')])
    return render_template('admin/dashboard.html', breadcrumbs=breadcrumbs)

@app.route('/admin/products')
def admin_products():
    breadcrumbs = get_breadcrumbs([('Administración', '/admin'), ('Productos', '/admin/products')])
    return render_template('admin/products.html', breadcrumbs=breadcrumbs)

@app.route('/admin/orders')
def admin_orders():
    breadcrumbs = get_breadcrumbs([('Administración', '/admin'), ('Pedidos', '/admin/orders')])
    return render_template('admin/orders.html', breadcrumbs=breadcrumbs)

@app.route('/admin/messages')
def admin_messages():
    breadcrumbs = get_breadcrumbs([('Administración', '/admin'), ('Mensajes', '/admin/messages')])
    return render_template('admin/messages.html', breadcrumbs=breadcrumbs)

@app.route('/admin/products/add')
def admin_add_product():
    breadcrumbs = get_breadcrumbs([('Administración', '/admin'), ('Productos', '/admin/products'), ('Agregar Producto', '/admin/products/add')])
    return render_template('admin/add_product.html', breadcrumbs=breadcrumbs)

@app.route('/admin/products/edit/<product_id>')
def admin_edit_product(product_id):
    breadcrumbs = get_breadcrumbs([('Administración', '/admin'), ('Productos', '/admin/products'), ('Editar Producto', f'/admin/products/edit/{product_id}')])
    return render_template('admin/edit_product.html', product_id=product_id, breadcrumbs=breadcrumbs)

@app.route('/admin/brands')
def admin_brands():
    breadcrumbs = get_breadcrumbs([('Administración', '/admin'), ('Marcas', '/admin/brands')])
    return render_template('admin/brands.html', breadcrumbs=breadcrumbs)

@app.route('/admin/brands/add')
def admin_brands_add():
    breadcrumbs = get_breadcrumbs([('Administración', '/admin'), ('Marcas', '/admin/brands'), ('Agregar Marca', '/admin/brands/add')])
    return render_template('admin/brands_add.html', breadcrumbs=breadcrumbs)

@app.route('/admin/brands/edit/<brand_id>')
def admin_brands_edit(brand_id):
    breadcrumbs = get_breadcrumbs([('Administración', '/admin'), ('Marcas', '/admin/brands'), ('Editar Marca', f'/admin/brands/edit/{brand_id}')])
    return render_template('admin/brands_edit.html', brand_id=brand_id, breadcrumbs=breadcrumbs)

@app.route('/admin/fragrance-types')
def admin_fragrance_types():
    breadcrumbs = get_breadcrumbs([('Administración', '/admin'), ('Tipos de Fragancia', '/admin/fragrance-types')])
    return render_template('admin/fragrance_types.html', breadcrumbs=breadcrumbs)

@app.route('/admin/fragrance-types/add')
def admin_fragrance_types_add():
    breadcrumbs = get_breadcrumbs([('Administración', '/admin'), ('Tipos de Fragancia', '/admin/fragrance-types'), ('Agregar Tipo', '/admin/fragrance-types/add')])
    return render_template('admin/fragrance_types_add.html', breadcrumbs=breadcrumbs)

@app.route('/fragancias')
def fragancias():
    breadcrumbs = get_breadcrumbs([('Fragancias', '/fragancias')])
    return render_template('fragancias.html', breadcrumbs=breadcrumbs)

@app.route('/decants')
def decants():
    breadcrumbs = get_breadcrumbs([('Decants', '/decants')])
    return render_template('decants.html', breadcrumbs=breadcrumbs)

@app.route('/producto/<product_id>')
def producto_detalle(product_id):
    breadcrumbs = get_breadcrumbs([('Fragancias', '/fragancias'), ('Detalle del Producto', f'/producto/{product_id}')])
    return render_template('producto_detalle.html', product_id=product_id, breadcrumbs=breadcrumbs)

@app.route('/carrito')
def carrito():
    breadcrumbs = get_breadcrumbs([('Mi Carrito', '/carrito')])
    return render_template('carrito.html', breadcrumbs=breadcrumbs)

@app.route('/ayuda')
def ayuda():
    breadcrumbs = get_breadcrumbs([('Ayuda', '/ayuda')])
    return render_template('ayuda.html', breadcrumbs=breadcrumbs)

if __name__ == '__main__':
    import os
    # Para desarrollo local, usa el puerto 5001 si 5000 está ocupado
    # En Railway, usará la variable de entorno PORT
    port = int(os.environ.get('PORT', 5001))
    app.run(host='127.0.0.1', port=port, debug=True)

