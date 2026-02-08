// Configuración de Firebase
// IMPORTANTE: Reemplaza estos valores con los de tu proyecto Firebase

const firebaseConfig = {
    apiKey: "AIzaSyDRDVUk8uwmI3gplHFNbr_jlTyfbE8vMJ8",
    authDomain: "alabaztrum.firebaseapp.com",
    projectId: "alabaztrum",
    storageBucket: "alabaztrum.firebasestorage.app",
    messagingSenderId: "98360608916",
    appId: "1:98360608916:web:2de09bd9f7367733660c81"
};

// Inicializar Firebase
try {
    firebase.initializeApp(firebaseConfig);
    console.log('Firebase inicializado correctamente');
} catch (error) {
    console.error('Error al inicializar Firebase:', error);
}

// Inicializar servicios
let auth, db, storage;
try {
    auth = firebase.auth();
    db = firebase.firestore();
    if (db && typeof db.settings === 'function') {
        db.settings({
            experimentalForceLongPolling: true,
            useFetchStreams: false
        });
    }
    if (firebase.firestore && typeof firebase.firestore.setLogLevel === 'function') {
        firebase.firestore.setLogLevel('silent');
    }
    // Storage es opcional - solo se inicializa si el SDK está disponible
    if (typeof firebase.storage === 'function') {
        storage = firebase.storage();
        console.log('Servicios de Firebase inicializados (incluyendo Storage)');
    } else {
        console.log('Servicios de Firebase inicializados (Storage no disponible)');
    }
} catch (error) {
    console.error('Error al inicializar servicios de Firebase:', error);
}
