class Game {
    constructor() {
        // Obtener el canvas y su contexto
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Configurar tamaño del canvas
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        // Estado del juego
        this.gameOver = false;
        this.score = 0;
        this.isPlaying = false;
        
        // Jugador
        this.player = {
            x: this.canvas.width / 2 - 25,
            y: this.canvas.height - 50,
            width: 50,
            height: 30,
            speed: 8,
            acceleration: 0.5
        };
        
        // Arrays de juego
        this.projectiles = [];
        this.enemies = [];
        
        // Controles
        this.keys = {
            ArrowLeft: false,
            ArrowRight: false,
            ' ': false,
            Escape: false
        };
        
        // Detectar si es dispositivo móvil
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // Ajustar velocidades según el dispositivo
        if (this.isMobile) {
            // Velocidades más lentas para móvil
            this.player.speed = 5; // Velocidad base más lenta
            this.player.acceleration = 0.3; // Aceleración más suave
            this.baseEnemySpeed = 2; // Enemigos más lentos
            this.enemySpawnInterval = 2000; // Más tiempo entre enemigos
        } else {
            // Velocidades para PC
            this.player.speed = 8;
            this.player.acceleration = 0.5;
            this.baseEnemySpeed = 3;
            this.enemySpawnInterval = 1500;
        }
        
        // Configurar controles
        this.setupControls();
        
        // Configurar botón de inicio
        const startButton = document.getElementById('startButton');
        if (startButton) {
            startButton.onclick = () => {
                this.resetGame();
                this.startGame();
            };
        }
        
        // Iniciar el bucle del juego
        this.lastTime = 0;
        this.lastEnemySpawn = 0;
        
        // Cargar el logo
        this.logo = new Image();
        this.logoLoaded = false;
        
        // Intentar cargar el logo con manejo de errores mejorado
        this.loadLogo();
        
        // Mostrar mensaje inicial
        this.drawStartScreen();
        
        // Estado de la sorpresa
        this.sorpresaMostrada = false;
        
        // Estado de pausa
        this.isPaused = false;
    }
    
    setupControls() {
        // Teclado
        window.onkeydown = (e) => {
            if (e.key in this.keys) {
                this.keys[e.key] = true;
                if (e.key === 'Escape') {
                    this.togglePause();
                }
                e.preventDefault();
            }
        };
        
        window.onkeyup = (e) => {
            if (e.key in this.keys) {
                this.keys[e.key] = false;
                e.preventDefault();
            }
        };
        
        // Controles táctiles
        const leftBtn = document.getElementById('leftButton');
        const rightBtn = document.getElementById('rightButton');
        const fireBtn = document.getElementById('fireButton');
        
        if (leftBtn) {
            leftBtn.ontouchstart = () => this.keys.ArrowLeft = true;
            leftBtn.ontouchend = () => this.keys.ArrowLeft = false;
        }
        
        if (rightBtn) {
            rightBtn.ontouchstart = () => this.keys.ArrowRight = true;
            rightBtn.ontouchend = () => this.keys.ArrowRight = false;
        }
        
        if (fireBtn) {
            fireBtn.ontouchstart = () => this.keys[' '] = true;
            fireBtn.ontouchend = () => this.keys[' '] = false;
        }
    }
    
    setupMobileControls() {
        const leftBtn = document.getElementById('leftButton');
        const rightBtn = document.getElementById('rightButton');
        const fireBtn = document.getElementById('fireButton');
        
        // Función para manejar eventos táctiles
        const handleTouch = (button, key, isStart) => {
            const touchHandler = (e) => {
                e.preventDefault();
                this.keys[key] = isStart;
                
                // Feedback táctil si está disponible
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }
            };
            
            button.addEventListener(isStart ? 'touchstart' : 'touchend', touchHandler);
            button.addEventListener(isStart ? 'touchstart' : 'touchcancel', touchHandler);
        };
        
        if (leftBtn) {
            handleTouch(leftBtn, 'ArrowLeft', true);
            handleTouch(leftBtn, 'ArrowLeft', false);
        }
        
        if (rightBtn) {
            handleTouch(rightBtn, 'ArrowRight', true);
            handleTouch(rightBtn, 'ArrowRight', false);
        }
        
        if (fireBtn) {
            handleTouch(fireBtn, ' ', true);
            handleTouch(fireBtn, ' ', false);
        }
        
        // Prevenir comportamiento por defecto del navegador
        document.addEventListener('touchmove', (e) => {
            if (e.target.closest('.mobile-controls')) {
                e.preventDefault();
            }
        }, { passive: false });
        
        // Ajustar tamaño del canvas para móviles
        this.adjustCanvasForMobile();
        window.addEventListener('resize', () => this.adjustCanvasForMobile());
    }
    
    adjustCanvasForMobile() {
        if (this.isMobile) {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
            
            // Ajustar tamaño del canvas para evitar problemas con la barra de navegación móvil
            const maxHeight = window.innerHeight * 0.7;
            this.canvas.style.maxHeight = `${maxHeight}px`;
            
            // Ajustar posición del jugador
            if (this.player) {
                this.player.y = this.canvas.height - 60;
            }
        }
    }
    
    resetGame() {
        // Reiniciar estado del juego
        this.isPlaying = false;
        this.gameOver = false;
        this.score = 0;
        this.projectiles = [];
        this.enemies = [];
        this.player.x = this.canvas.width / 2 - 25;
        this.player.y = this.canvas.height - 50;
        this.lastEnemySpawn = 0;
        this.lastTime = 0;
        this.updateScore();
        this.sorpresaMostrada = false;
        this.isPaused = false;
        
        // Resetear velocidades según el dispositivo
        if (this.isMobile) {
            this.player.speed = 5;
            this.baseEnemySpeed = 2;
            this.enemySpawnInterval = 2000;
        } else {
            this.player.speed = 8;
            this.baseEnemySpeed = 3;
            this.enemySpawnInterval = 1500;
        }
    }
    
    startGame() {
        if (!this.isPlaying) {
            this.isPlaying = true;
            this.gameLoop();
        }
    }
    
    update() {
        if (!this.isPlaying || this.gameOver || this.isPaused) return;
        
        // Movimiento del jugador con aceleración
        if (this.keys.ArrowLeft) {
            this.player.x = Math.max(0, this.player.x - this.player.speed);
            // Aceleración adicional al mantener presionada la tecla
            if (this.isMobile) {
                if (this.player.speed < 8) { // Velocidad máxima más baja para móvil
                    this.player.speed += this.player.acceleration;
                }
            } else {
                if (this.player.speed < 12) { // Velocidad máxima para PC
                    this.player.speed += this.player.acceleration;
                }
            }
        } else if (this.keys.ArrowRight) {
            this.player.x = Math.min(this.canvas.width - this.player.width, this.player.x + this.player.speed);
            // Aceleración adicional al mantener presionada la tecla
            if (this.isMobile) {
                if (this.player.speed < 8) { // Velocidad máxima más baja para móvil
                    this.player.speed += this.player.acceleration;
                }
            } else {
                if (this.player.speed < 12) { // Velocidad máxima para PC
                    this.player.speed += this.player.acceleration;
                }
            }
        } else {
            // Desaceleración cuando no se presiona ninguna tecla
            if (this.isMobile) {
                this.player.speed = Math.max(5, this.player.speed - this.player.acceleration); // Velocidad base más baja para móvil
            } else {
                this.player.speed = Math.max(8, this.player.speed - this.player.acceleration); // Velocidad base para PC
            }
        }
        
        // Disparar
        if (this.keys[' ']) {
            this.projectiles.push({
                x: this.player.x + this.player.width / 2 - 2.5,
                y: this.player.y,
                width: 5,
                height: 15,
                speed: 7
            });
            this.keys[' '] = false; // Evitar disparos continuos
        }
        
        // Mover proyectiles
        this.projectiles = this.projectiles.filter(proj => {
            proj.y -= proj.speed;
            return proj.y > 0;
        });
        
        // Generar enemigos
        const now = Date.now();
        if (now - this.lastEnemySpawn > this.enemySpawnInterval) {
            this.enemies.push({
                x: Math.random() * (this.canvas.width - 30),
                y: -30,
                width: 30,
                height: 30,
                speed: this.baseEnemySpeed + (Math.random() * 1)
            });
            this.lastEnemySpawn = now;
        }
        
        // Mover y verificar enemigos
        this.enemies = this.enemies.filter(enemy => {
            enemy.y += enemy.speed;
            
            // Verificar colisión con jugador
            if (this.checkCollision(enemy, this.player)) {
                this.gameOver = true;
                return false;
            }
            
            // Verificar colisión con proyectiles
            for (let i = this.projectiles.length - 1; i >= 0; i--) {
                if (this.checkCollision(this.projectiles[i], enemy)) {
                    this.projectiles.splice(i, 1);
                    this.score += 10;
                    this.updateScore();
                    
                    // Verificar si alcanzó 200 puntos
                    if (this.score >= 200 && !this.sorpresaMostrada) {
                        this.mostrarSorpresa();
                    }
                    
                    return false;
                }
            }
            
            // Verificar si llegó al fondo
            if (enemy.y > this.canvas.height) {
                this.gameOver = true;
                return false;
            }
            
            return true;
        });
    }
    
    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    draw() {
        // Limpiar canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (!this.isPlaying) {
            this.drawStartScreen();
            return;
        }
        
        if (this.isPaused) {
            this.drawPauseScreen();
            return;
        }
        
        // Dibujar jugador
        this.ctx.fillStyle = '#0ff';
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // Dibujar proyectiles
        this.ctx.fillStyle = '#fff';
        this.projectiles.forEach(proj => {
            this.ctx.fillRect(proj.x, proj.y, proj.width, proj.height);
        });
        
        // Dibujar enemigos
        this.ctx.fillStyle = '#f00';
        this.enemies.forEach(enemy => {
            this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        });
        
        // Dibujar game over
        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Dibujar el logo en la pantalla de game over
            if (this.logoLoaded && this.logo.complete && this.logo.naturalHeight !== 0) {
                console.log('Dibujando logo en pantalla de game over...');
                const logoWidth = 150;
                const logoHeight = (this.logo.naturalHeight * logoWidth) / this.logo.naturalWidth;
                const logoX = (this.canvas.width - logoWidth) / 2;
                const logoY = this.canvas.height / 4 - logoHeight / 2;
                
                try {
                    this.ctx.drawImage(this.logo, logoX, logoY, logoWidth, logoHeight);
                    console.log('Logo dibujado en game over:', logoX, logoY, logoWidth, logoHeight);
                } catch (error) {
                    console.error('Error al dibujar el logo en game over:', error);
                }
            }
            
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('¡Game Over!', this.canvas.width / 2, this.canvas.height / 2);
            
            this.ctx.font = '24px Arial';
            this.ctx.fillText(`Puntuación: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 40);
            this.ctx.fillText('Presiona "Iniciar Juego" para jugar de nuevo', this.canvas.width / 2, this.canvas.height / 2 + 80);
            
            this.isPlaying = false;
        }
    }
    
    drawStartScreen() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Dibujar el logo si está cargado
        if (this.logoLoaded && this.logo.complete && this.logo.naturalHeight !== 0) {
            console.log('Dibujando logo en pantalla de inicio...');
            const logoWidth = 200;
            const logoHeight = (this.logo.naturalHeight * logoWidth) / this.logo.naturalWidth;
            const logoX = (this.canvas.width - logoWidth) / 2;
            const logoY = this.canvas.height / 4 - logoHeight / 2;
            
            try {
                this.ctx.drawImage(this.logo, logoX, logoY, logoWidth, logoHeight);
                console.log('Logo dibujado en:', logoX, logoY, logoWidth, logoHeight);
            } catch (error) {
                console.error('Error al dibujar el logo:', error);
            }
        } else {
            console.log('Logo no disponible para dibujar. Estado:', {
                loaded: this.logoLoaded,
                complete: this.logo.complete,
                naturalHeight: this.logo.naturalHeight
            });
        }
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Mattelsa Invaders', this.canvas.width / 2, this.canvas.height / 2);
        
        // Dibujar mensaje de sorpresa
        this.ctx.fillStyle = '#ffd700';
        this.ctx.font = '24px Arial';
        this.ctx.fillText('¡Acumula 200 puntos y gana una sorpresa!', this.canvas.width / 2, this.canvas.height / 2 + 40);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '24px Arial';
        this.ctx.fillText('Presiona "Iniciar Juego" para comenzar', this.canvas.width / 2, this.canvas.height / 2 + 80);
        this.ctx.fillText('Usa ← → para moverte y ESPACIO para disparar', this.canvas.width / 2, this.canvas.height / 2 + 120);
        
        // Agregar instrucciones específicas para móviles
        if (this.isMobile) {
            this.ctx.font = '20px Arial';
            this.ctx.fillText('Usa los botones en la parte inferior para jugar', this.canvas.width / 2, this.canvas.height / 2 + 160);
        }
    }
    
    updateScore() {
        document.getElementById('score').textContent = this.score;
    }
    
    gameLoop(timestamp) {
        if (!this.lastTime) this.lastTime = timestamp;
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        
        this.update();
        this.draw();
        
        if (this.isPlaying && !this.gameOver) {
            requestAnimationFrame((t) => this.gameLoop(t));
        }
    }
    
    loadLogo() {
        console.log('Intentando cargar el logo...');
        
        // Función para manejar la carga exitosa
        this.logo.onload = () => {
            console.log('Logo cargado exitosamente');
            console.log('Dimensiones del logo:', this.logo.naturalWidth, 'x', this.logo.naturalHeight);
            this.logoLoaded = true;
            // Redibujar la pantalla si estamos en la pantalla de inicio
            if (!this.isPlaying) {
                this.draw();
            }
        };
        
        // Función para manejar errores de carga
        this.logo.onerror = (error) => {
            console.error('Error al cargar el logo:', error);
            console.error('Ruta del logo:', this.logo.src);
            alert('Error al cargar el logo. Por favor, verifica que el archivo existe en: ' + this.logo.src);
        };
        
        // Intentar cargar el logo
        try {
            this.logo.src = './images/logo.png';
            console.log('Ruta del logo establecida:', this.logo.src);
        } catch (error) {
            console.error('Error al establecer la ruta del logo:', error);
        }
    }
    
    mostrarSorpresa() {
        this.sorpresaMostrada = true;
        
        // Crear y mostrar el mensaje de sorpresa
        const mensajeSorpresa = document.createElement('div');
        mensajeSorpresa.className = 'mensaje-sorpresa';
        mensajeSorpresa.innerHTML = `
            <div class="sorpresa-contenido">
                <h2>¡Felicidades!</h2>
                <p>Has alcanzado 200 puntos</p>
                <p>¡Ganaste un descuento especial en Mattelsa!</p>
                <p>Código: MATTELSA200</p>
                <button onclick="this.parentElement.parentElement.remove()">Cerrar</button>
            </div>
        `;
        document.body.appendChild(mensajeSorpresa);
    }
    
    togglePause() {
        if (this.isPlaying && !this.gameOver) {
            this.isPaused = !this.isPaused;
            if (this.isPaused) {
                this.drawPauseScreen();
            } else {
                this.lastTime = performance.now(); // Resetear el tiempo para evitar saltos
            }
        }
    }
    
    drawPauseScreen() {
        // Guardar el estado actual del canvas
        this.ctx.save();
        
        // Dibujar overlay semi-transparente
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Dibujar mensaje de pausa
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PAUSA', this.canvas.width / 2, this.canvas.height / 2 - 50);
        
        this.ctx.font = '24px Arial';
        this.ctx.fillText('Presiona ESC para continuar', this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.fillText(`Puntuación actual: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 40);
        
        // Restaurar el estado del canvas
        this.ctx.restore();
    }
}

// Iniciar el juego cuando se carga la página
window.onload = () => {
    new Game();
}; 