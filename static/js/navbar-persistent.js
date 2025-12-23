// Script para mantener el navbar persistente sin recargar
// Intercepta los enlaces y carga el contenido dinámicamente

(function() {
    'use strict';
    
    // Verificar si el navbar ya está inicializado
    if (window.navbarPersistentInitialized) {
        return;
    }
    window.navbarPersistentInitialized = true;
    
    // Función para cargar contenido dinámicamente
    async function loadContent(url) {
        try {
            // Mostrar indicador de carga
            const main = document.querySelector('main');
            if (main) {
                main.style.opacity = '0.5';
                main.style.pointerEvents = 'none';
            }
            
            // Obtener el HTML de la nueva página
            const response = await fetch(url);
            const html = await response.text();
            
            // Crear un documento temporal para parsear el HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Extraer solo el contenido del main (no el navbar)
            const newMain = doc.querySelector('main');
            const newScripts = doc.querySelectorAll('script[src]');
            
            if (main && newMain) {
                // Reemplazar el contenido
                main.innerHTML = newMain.innerHTML;
                
                // Actualizar el título
                if (doc.title) {
                    document.title = doc.title;
                }
                
                // Actualizar la URL sin recargar
                window.history.pushState({}, '', url);
                
                // Cargar nuevos scripts si es necesario
                newScripts.forEach(script => {
                    const src = script.getAttribute('src');
                    if (src && !document.querySelector(`script[src="${src}"]`)) {
                        const newScript = document.createElement('script');
                        newScript.src = src;
                        document.body.appendChild(newScript);
                    }
                });
                
                // Ejecutar scripts inline de la nueva página
                // Los scripts ya están protegidos contra redeclaración de variables
                const inlineScripts = doc.querySelectorAll('script:not([src])');
                inlineScripts.forEach(oldScript => {
                    try {
                        const scriptContent = oldScript.textContent;
                        if (scriptContent.trim()) {
                            const newScript = document.createElement('script');
                            newScript.textContent = scriptContent;
                            document.body.appendChild(newScript);
                        }
                    } catch (error) {
                        console.error('Error ejecutando script inline:', error);
                    }
                });
                
                // Scroll al inicio
                window.scrollTo(0, 0);
            }
            
            // Restaurar opacidad
            if (main) {
                main.style.opacity = '1';
                main.style.pointerEvents = 'auto';
            }
            
        } catch (error) {
            console.error('Error cargando contenido:', error);
            // Si falla, hacer navegación normal
            window.location.href = url;
        }
    }
    
    // Interceptar clics en enlaces
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        
        if (!link) return;
        
        const href = link.getAttribute('href');
        
        // Ignorar enlaces externos, con target, o que no sean del mismo dominio
        if (!href || 
            (href.startsWith('http') && !href.includes(window.location.hostname)) ||
            link.getAttribute('target') ||
            href.startsWith('#') ||
            href.startsWith('javascript:') ||
            href.startsWith('mailto:') ||
            href.startsWith('tel:') ||
            link.closest('#user-logged-menu') || // Menús dropdown
            link.closest('#user-not-logged-menu') ||
            link.closest('.dropdown-menu') ||
            link.onclick || // Enlaces con onclick
            link.closest('form')) { // Enlaces dentro de formularios
            return;
        }
        
        // Ignorar enlaces del navbar (header y nav) - estos deben hacer navegación normal
        // Solo interceptar enlaces del contenido principal
        if (link.closest('header') || link.closest('nav')) {
            return; // No interceptar enlaces del navbar
        }
        
        // Ignorar enlaces de admin
        if (href.startsWith('/admin')) {
            return;
        }
        
        // Prevenir navegación normal
        e.preventDefault();
        
        // Cargar contenido dinámicamente
        loadContent(href);
    }, true); // Usar capture phase para interceptar antes
    
    // Manejar botones de navegación del navegador (atrás/adelante)
    window.addEventListener('popstate', function(e) {
        // Si hay un estado, recargar la página normalmente
        window.location.reload();
    });
    
    console.log('Navbar persistente inicializado');
})();

