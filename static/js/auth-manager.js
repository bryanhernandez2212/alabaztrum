// AuthManager - Gestor global de estado de autenticación (similar a Provider en Flutter)
// Singleton que mantiene el estado del usuario en memoria

class AuthManager {
    constructor() {
        if (AuthManager.instance) {
            return AuthManager.instance;
        }
        
        this.currentUser = null;
        this.userRole = null;
        this.userData = null;
        this.isInitialized = false;
        this.listeners = [];
        
        // Cache en sessionStorage para persistencia entre recargas
        this.cacheKey = 'authManager_cache';
        
        AuthManager.instance = this;
    }
    
    // Inicializar el AuthManager
    async init() {
        if (this.isInitialized) {
            return;
        }
        
        // Cargar desde cache primero
        this.loadFromCache();
        
        // Si Firebase está disponible, verificar estado real
        if (typeof auth !== 'undefined') {
            // Verificar usuario actual inmediatamente
            const user = auth.currentUser;
            if (user) {
                await this.setUser(user);
            } else {
                // Si no hay usuario pero hay cache, mantener el cache temporalmente
                // pero verificar con Firebase
                this.clearUser();
            }
            
            // Escuchar cambios de autenticación (esto se ejecuta cuando hay cambios)
            auth.onAuthStateChanged(async (user) => {
                console.log('AuthManager: onAuthStateChanged', user ? user.email : 'null');
                if (user) {
                    await this.setUser(user);
                } else {
                    this.clearUser();
                }
            });
        }
        
        this.isInitialized = true;
    }
    
    // Establecer usuario actual
    async setUser(user) {
        this.currentUser = user;
        
        if (user) {
            // Obtener datos adicionales del usuario
            try {
                if (typeof db !== 'undefined') {
                    const userDoc = await db.collection('users').doc(user.uid).get();
                    if (userDoc.exists) {
                        this.userData = userDoc.data();
                        this.userRole = this.userData.role || 'cliente';
                    } else {
                        this.userData = null;
                        this.userRole = 'cliente';
                    }
                }
            } catch (error) {
                console.warn('Error obteniendo datos del usuario:', error);
                this.userData = null;
                this.userRole = 'cliente';
            }
            
            // Guardar en cache
            this.saveToCache();
        }
        
        // Notificar a todos los listeners
        this.notifyListeners();
    }
    
    // Limpiar usuario
    clearUser() {
        this.currentUser = null;
        this.userRole = null;
        this.userData = null;
        this.clearCache();
        this.notifyListeners();
    }
    
    // Obtener usuario actual
    getUser() {
        return this.currentUser;
    }
    
    // Obtener rol del usuario
    getRole() {
        return this.userRole || 'cliente';
    }
    
    // Obtener datos del usuario
    getUserData() {
        return this.userData;
    }
    
    // Verificar si está autenticado
    isAuthenticated() {
        return this.currentUser !== null;
    }
    
    // Verificar si es administrador
    isAdmin() {
        return this.userRole === 'administrador';
    }
    
    // Obtener nombre para mostrar
    getDisplayName() {
        if (!this.currentUser) return null;
        
        if (this.userData && this.userData.fullName) {
            return this.userData.fullName;
        }
        
        return this.currentUser.displayName || this.currentUser.email || 'Mi cuenta';
    }
    
    // Suscribirse a cambios de estado
    subscribe(callback) {
        this.listeners.push(callback);
        
        // Ejecutar callback inmediatamente con el estado actual
        callback({
            user: this.currentUser,
            role: this.userRole,
            userData: this.userData,
            isAuthenticated: this.isAuthenticated()
        });
        
        // Retornar función para desuscribirse
        return () => {
            const index = this.listeners.indexOf(callback);
            if (index > -1) {
                this.listeners.splice(index, 1);
            }
        };
    }
    
    // Notificar a todos los listeners
    notifyListeners() {
        const state = {
            user: this.currentUser,
            role: this.userRole,
            userData: this.userData,
            isAuthenticated: this.isAuthenticated()
        };
        
        this.listeners.forEach(callback => {
            try {
                callback(state);
            } catch (error) {
                console.error('Error en listener de AuthManager:', error);
            }
        });
    }
    
    // Guardar en cache
    saveToCache() {
        if (!this.currentUser) return;
        
        try {
            const cacheData = {
                uid: this.currentUser.uid,
                email: this.currentUser.email,
                displayName: this.currentUser.displayName,
                role: this.userRole,
                userData: this.userData,
                timestamp: Date.now()
            };
            
            sessionStorage.setItem(this.cacheKey, JSON.stringify(cacheData));
        } catch (error) {
            console.warn('Error guardando cache:', error);
        }
    }
    
    // Cargar desde cache
    loadFromCache() {
        try {
            const cached = sessionStorage.getItem(this.cacheKey);
            if (cached) {
                const cacheData = JSON.parse(cached);
                
                // Verificar que el cache no sea muy viejo (máximo 1 hora)
                const maxAge = 60 * 60 * 1000; // 1 hora
                if (Date.now() - cacheData.timestamp < maxAge) {
                    this.userRole = cacheData.role;
                    this.userData = cacheData.userData;
                    return true;
                } else {
                    // Cache expirado, limpiar
                    this.clearCache();
                }
            }
        } catch (error) {
            console.warn('Error cargando cache:', error);
            this.clearCache();
        }
        return false;
    }
    
    // Limpiar cache
    clearCache() {
        try {
            sessionStorage.removeItem(this.cacheKey);
        } catch (error) {
            console.warn('Error limpiando cache:', error);
        }
    }
}

// Crear instancia única (Singleton)
const authManager = new AuthManager();

// Inicializar cuando Firebase esté disponible
function initAuthManager() {
    if (typeof auth !== 'undefined') {
        authManager.init();
    } else {
        // Esperar a que Firebase esté disponible
        setTimeout(initAuthManager, 100);
    }
}

// Inicializar automáticamente
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuthManager);
} else {
    initAuthManager();
}

// Hacer disponible globalmente
window.authManager = authManager;

