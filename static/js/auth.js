// Funciones de autenticación

// Función para registrar usuario
async function registerUser(email, password, fullName, role = 'cliente') {
    try {
        console.log('registerUser llamado con:', { email, fullName, role });
        
        // Verificar que auth esté disponible
        if (typeof auth === 'undefined') {
            console.error('auth no está definido');
            return { 
                success: false, 
                error: 'Firebase no está inicializado. Recarga la página.' 
            };
        }
        
        console.log('Intentando createUserWithEmailAndPassword...');
        // Crear usuario
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        console.log('Usuario creado:', user.uid);

        // Actualizar perfil con nombre
        console.log('Actualizando perfil...');
        await user.updateProfile({
            displayName: fullName
        });

        // Guardar información adicional en Firestore (opcional)
        try {
            if (typeof db !== 'undefined') {
                console.log('Guardando en Firestore...');
                await db.collection('users').doc(user.uid).set({
                    fullName: fullName,
                    email: email,
                    role: role, // Rol seleccionado
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                console.log('Usuario guardado en Firestore');
            } else {
                console.warn('Firestore no está disponible');
            }
        } catch (firestoreError) {
            console.warn('No se pudo guardar en Firestore (puede no estar habilitado):', firestoreError);
            // Continuar sin error, Firestore es opcional
        }

        console.log('Registro exitoso');
        return { success: true, user: user };
    } catch (error) {
        console.error('Error completo al registrar:', error);
        console.error('Código de error:', error.code);
        console.error('Mensaje de error:', error.message);
        
        return { 
            success: false, 
            error: getErrorMessage(error.code) || error.message || 'Error desconocido al registrar'
        };
    }
}

// Función para iniciar sesión
async function loginUser(email, password) {
    try {
        console.log('loginUser llamado con email:', email);
        
        // Verificar que auth esté disponible
        if (typeof auth === 'undefined') {
            console.error('auth no está definido');
            return { 
                success: false, 
                error: 'Firebase no está inicializado. Recarga la página.' 
            };
        }
        
        console.log('Intentando signInWithEmailAndPassword...');
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        console.log('Login exitoso, usuario:', userCredential.user.email);
        
        return { success: true, user: userCredential.user };
    } catch (error) {
        console.error('Error completo al iniciar sesión:', error);
        console.error('Código de error:', error.code);
        console.error('Mensaje de error:', error.message);
        
        return { 
            success: false, 
            error: getErrorMessage(error.code) || error.message || 'Error desconocido al iniciar sesión'
        };
    }
}

// Función para iniciar sesión con Google
async function loginWithGoogle() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await auth.signInWithPopup(provider);
        
        // Guardar información del usuario en Firestore si es nuevo
        const user = result.user;
        try {
            const userDoc = await db.collection('users').doc(user.uid).get();
            
            if (!userDoc.exists) {
                await db.collection('users').doc(user.uid).set({
                    fullName: user.displayName,
                    email: user.email,
                    role: 'cliente', // Rol por defecto
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        } catch (firestoreError) {
            console.warn('No se pudo guardar en Firestore (puede no estar habilitado):', firestoreError);
            // Continuar sin error, Firestore es opcional
        }
        
        return { success: true, user: user };
    } catch (error) {
        console.error('Error al iniciar sesión con Google:', error);
        return { 
            success: false, 
            error: getErrorMessage(error.code) 
        };
    }
}

// Función para cerrar sesión
async function logoutUser() {
    try {
        await auth.signOut();
        return { success: true };
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        return { success: false, error: error.message };
    }
}

// Función para obtener usuario actual
function getCurrentUser() {
    return auth.currentUser;
}

// Función para verificar si el usuario está autenticado
function isAuthenticated() {
    return auth.currentUser !== null;
}

// Función para obtener el rol del usuario actual
async function getUserRole(userId) {
    try {
        if (!userId) {
            const user = getCurrentUser();
            if (!user) return null;
            userId = user.uid;
        }
        
        const userDoc = await db.collection('users').doc(userId).get();
        if (userDoc.exists) {
            return userDoc.data().role || 'cliente';
        }
        return 'cliente'; // Rol por defecto si no existe
    } catch (error) {
        console.error('Error al obtener rol:', error);
        return 'cliente';
    }
}

// Función para verificar si el usuario es administrador
async function isAdmin(userId) {
    const role = await getUserRole(userId);
    return role === 'administrador';
}

// Función para verificar si el usuario es cliente
async function isCliente(userId) {
    const role = await getUserRole(userId);
    return role === 'cliente';
}

// Función para traducir errores de Firebase
function getErrorMessage(errorCode) {
    const errorMessages = {
        'auth/email-already-in-use': 'Este correo electrónico ya está registrado',
        'auth/invalid-email': 'El correo electrónico no es válido',
        'auth/operation-not-allowed': 'Operación no permitida',
        'auth/weak-password': 'La contraseña es muy débil (mínimo 6 caracteres)',
        'auth/user-disabled': 'Esta cuenta ha sido deshabilitada',
        'auth/user-not-found': 'No existe una cuenta con este correo',
        'auth/wrong-password': 'Contraseña incorrecta',
        'auth/invalid-credential': 'Credenciales inválidas',
        'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde',
        'auth/network-request-failed': 'Error de conexión. Verifica tu internet',
        'auth/popup-closed-by-user': 'La ventana de Google fue cerrada',
        'auth/cancelled-popup-request': 'Solicitud cancelada'
    };
    
    return errorMessages[errorCode] || 'Ocurrió un error. Intenta nuevamente';
}

// Observador de estado de autenticación
auth.onAuthStateChanged((user) => {
    if (user) {
        // Usuario autenticado
        console.log('Usuario autenticado:', user.email);
        // Puedes redirigir o actualizar la UI aquí
    } else {
        // Usuario no autenticado
        console.log('Usuario no autenticado');
    }
});

