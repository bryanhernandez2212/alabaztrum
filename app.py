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
        return render_template('index.html')
    except Exception as e:
        logger.error(f"Error rendering index: {str(e)}")
        logger.error(traceback.format_exc())
        raise

@app.route('/login')
def login():
    return render_template('auth/login.html')

@app.route('/register')
def register():
    return render_template('auth/register.html')

@app.route('/profile')
def profile():
    return render_template('profile.html')

@app.route('/admin')
def admin():
    return render_template('admin/dashboard.html')

@app.route('/admin/products')
def admin_products():
    return render_template('admin/products.html')

@app.route('/admin/orders')
def admin_orders():
    return render_template('admin/orders.html')

@app.route('/admin/messages')
def admin_messages():
    return render_template('admin/messages.html')

@app.route('/admin/products/add')
def admin_add_product():
    return render_template('admin/add_product.html')

@app.route('/admin/brands')
def admin_brands():
    return render_template('admin/brands.html')

@app.route('/admin/brands/add')
def admin_brands_add():
    return render_template('admin/brands_add.html')

@app.route('/admin/fragrance-types')
def admin_fragrance_types():
    return render_template('admin/fragrance_types.html')

@app.route('/admin/fragrance-types/add')
def admin_fragrance_types_add():
    return render_template('admin/fragrance_types_add.html')

if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)

