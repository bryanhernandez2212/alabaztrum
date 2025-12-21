from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

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
    app.run(debug=True)

