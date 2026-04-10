/**
 * @fileoverview Sistema Phaethon V5 - Ciclo Completo con Menú Principal (Actividad 2.4)
 */
(() => {
    const canvas = document.getElementById("canvasGame");
    const ctx = canvas.getContext("2d");
    
    // Variables de control del juego
    let circles = [];
    let currentLevel = 1;
    const MAX_LEVELS = 10;
    const CIRCLES_PER_LEVEL = 10;
    
    let totalEliminated = 0;
    let spawnedThisLevel = 0;
    let spawnInterval;
    
    // NUEVO: Banderas de estado del sistema
    let isMainMenu = true; // El juego inicia en el menú
    let isGameOver = false;

    // Carga de imagen de fondo táctico
    const bgImage = new Image();
    bgImage.src = 'https://i.imgur.com/kF2A8K4.png'; 
    let isBgLoaded = false;
    bgImage.onload = () => { isBgLoaded = true; };

    class CircleC {
        constructor(radius, speedMultiplier, text) {
            this.radius = radius;
            this.text = text;
            
            this.posX = Math.random() * (canvas.width - this.radius * 2) + this.radius;
            this.posY = canvas.height + this.radius + 10; 

            this.dy = -(Math.random() * 1.5 + speedMultiplier);
            this.dx = (Math.random() - 0.5) * 2;

            this.collisionTimer = 0; 
            this.isHovered = false;
            this.isFading = false;
            this.opacity = 1.0;
            this.isDead = false; 
        }

        draw(context) {
            if (this.opacity <= 0) return;

            context.save(); 
            context.globalAlpha = this.opacity; 

            context.beginPath();
            context.arc(this.posX, this.posY, this.radius, 0, Math.PI * 2, false);

            const glassGradient = context.createRadialGradient(
                this.posX - this.radius * 0.3, this.posY - this.radius * 0.3, this.radius * 0.1,
                this.posX, this.posY, this.radius
            );
            glassGradient.addColorStop(0, "rgba(255, 230, 180, 0.4)"); 
            glassGradient.addColorStop(0.6, "rgba(20, 20, 20, 0.3)"); 
            glassGradient.addColorStop(1, "rgba(0, 0, 0, 0.5)"); 

            context.fillStyle = glassGradient;
            context.fill(); 
            
            if (this.collisionTimer > 0) {
                context.strokeStyle = "#FFD400"; 
            } else if (this.isHovered) {
                context.strokeStyle = "#FFFFFF"; 
            } else {
                context.strokeStyle = "#00E5FF";
            }
            
            context.lineWidth = 2;
            context.stroke(); 

            context.fillStyle = "#F2EBE1"; 
            context.textAlign = "center"; context.textBaseline = "middle"; 
            context.font = "bold 16px 'Space Mono', monospace";
            context.fillText(this.text, this.posX, this.posY);
            context.closePath();
            
            context.restore(); 
        }

        update(context) {
            if (this.collisionTimer > 0) this.collisionTimer--;

            if (this.isFading) {
                this.opacity -= 0.05; 
                if (this.opacity <= 0) {
                    this.opacity = 0;
                    this.isDead = true; 
                }
            }

            if (this.posX + this.radius > canvas.width || this.posX - this.radius < 0) {
                this.dx = -this.dx;
            }

            this.posX += this.dx;
            this.posY += this.dy;

            if (this.posY + this.radius < 0) {
                this.isDead = true;
            }

            this.draw(context);
        }
    }

    function resolveCollision(c1, c2) {
        const xDist = c2.posX - c1.posX; 
        const yDist = c2.posY - c1.posY;
        const dist = Math.sqrt(Math.pow(xDist, 2) + Math.pow(yDist, 2));

        if (dist < c1.radius + c2.radius) {
            const nx = xDist / dist; 
            const ny = yDist / dist;

            const v1n = (c1.dx * nx) + (c1.dy * ny); 
            const v2n = (c2.dx * nx) + (c2.dy * ny);

            c1.dx += (v2n - v1n) * nx; 
            c1.dy += (v2n - v1n) * ny;
            c2.dx += (v1n - v2n) * nx; 
            c2.dy += (v1n - v2n) * ny;

            const overlap = (c1.radius + c2.radius) - dist;
            c1.posX -= nx * (overlap / 2); 
            c1.posY -= ny * (overlap / 2);
            c2.posX += nx * (overlap / 2); 
            c2.posY += ny * (overlap / 2);

            c1.collisionTimer = 10; 
            c2.collisionTimer = 10;
        }
    }

    function actualizarTelemetria() {
        totalEliminated++;
        document.getElementById('lblEliminados').innerText = totalEliminated;

        const totalPosibles = MAX_LEVELS * CIRCLES_PER_LEVEL;
        const porcentaje = Math.round((totalEliminated / totalPosibles) * 100);
        document.getElementById('lblPorcentaje').innerText = porcentaje + '%';
    }

    function spawnCircle() {
        if (spawnedThisLevel < CIRCLES_PER_LEVEL) {
            let r = Math.random() * 30 + 35; 
            let speedMultiplier = 0.5 + (currentLevel * 0.4); 
            
            let c = new CircleC(r, speedMultiplier, (spawnedThisLevel + 1).toString());
            circles.push(c);
            spawnedThisLevel++;
        } else {
            clearInterval(spawnInterval);
        }
    }

    function startLevel() {
        if (currentLevel > MAX_LEVELS) {
            document.querySelector('.rp-status').innerText = "[SISTEMA COMPLETADO]";
            document.querySelector('.rp-status').style.color = "#00FFEA";
            return;
        }

        spawnedThisLevel = 0;
        circles = [];
        document.getElementById('lblNivel').innerText = currentLevel;
        
        const statusText = document.querySelector('.rp-status');
        statusText.innerText = "[TELEMETRÍA DE COMBATE]";
        statusText.style.color = "#FFD400";

        if(spawnInterval) clearInterval(spawnInterval);
        spawnInterval = setInterval(spawnCircle, 800);
    }

    // MODIFICADO: Ahora cambia las banderas de estado correctamente
    function reiniciarJuego() {
        isMainMenu = false;
        isGameOver = false;
        currentLevel = 1;
        totalEliminated = 0;
        
        document.getElementById('lblEliminados').innerText = totalEliminated;
        document.getElementById('lblPorcentaje').innerText = '0%';
        
        startLevel();
    }

    // MODIFICADO: Ahora te regresa al menú principal
    function pararJuego() {
        isGameOver = false;
        isMainMenu = true; // Activa el menú de inicio
        clearInterval(spawnInterval);
        circles = [];
        
        const statusText = document.querySelector('.rp-status');
        statusText.innerText = "[SISTEMA EN ESPERA]";
        statusText.style.color = "#00E5FF";
    }

    function failLevel() {
        clearInterval(spawnInterval);
        circles = [];
        isGameOver = true; 
        
        const statusText = document.querySelector('.rp-status');
        statusText.innerText = "[FALLO EN PERÍMETRO: GAME OVER]";
        statusText.style.color = "#FF3366";
    }

    function getMousePos(evt) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (evt.clientX - rect.left) * scaleX,
            y: (evt.clientY - rect.top) * scaleY
        };
    }

    canvas.addEventListener('mousemove', (e) => {
        if (isMainMenu || isGameOver) return; // No detectar hover en menús
        const mouse = getMousePos(e);
        circles.forEach(c => {
            if(c.isFading) return; 
            const dist = Math.sqrt(Math.pow(mouse.x - c.posX, 2) + Math.pow(mouse.y - c.posY, 2));
            c.isHovered = (dist <= c.radius);
        });
    });

    canvas.addEventListener('click', (e) => {
        const mouse = getMousePos(e);
        const centerY = canvas.height / 2; const centerX = canvas.width / 2;

        // --- 1. Lógica si estamos en el MENÚ PRINCIPAL ---
        if (isMainMenu) {
            // Hitbox del botón Iniciar Partida (Ancho: 200, Alto: 50)
            if (mouse.x >= centerX - 100 && mouse.x <= centerX + 100 &&
                mouse.y >= centerY + 20 && mouse.y <= centerY + 70) {
                reiniciarJuego();
            }
            return; // Bloquea los demás clics
        }

        // --- 2. Lógica si estamos en GAME OVER ---
        if (isGameOver) {
            // Hitbox del bótón REINTENTAR
            if (mouse.x >= centerX - 140 && mouse.x <= centerX - 20 &&
                mouse.y >= centerY + 60 && mouse.y <= centerY + 100) {
                reiniciarJuego();
                return;
            }
            // Hitbox del botón PARAR
            if (mouse.x >= centerX + 20 && mouse.x <= centerX + 140 &&
                mouse.y >= centerY + 60 && mouse.y <= centerY + 100) {
                pararJuego();
                return;
            }
            return; // Bloquea los demás clics
        }

        // --- 3. Lógica normal de JUEGO (Disparar a los círculos) ---
        circles.forEach(c => {
            const dist = Math.sqrt(Math.pow(mouse.x - c.posX, 2) + Math.pow(mouse.y - c.posY, 2));
            if (dist <= c.radius && !c.isFading) {
                c.isFading = true; 
            }
        });
    });

    // NUEVO: Dibujar el menú de inicio
    function drawMainMenuUI() {
        ctx.fillStyle = "rgba(10, 10, 9, 0.6)"; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Título del juego
        ctx.fillStyle = "#00FFEA";
        ctx.font = "bold 40px 'Space Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillText("UpPop", canvas.width / 2, canvas.height / 2 - 20);

        // Botón Iniciar Partida
        const btnWidth = 200; const btnHeight = 50;
        const centerY = canvas.height / 2; const centerX = canvas.width / 2;

        ctx.fillStyle = "rgba(255, 212, 0, 0.1)"; // Fondo amarillo translúcido
        ctx.fillRect(centerX - 100, centerY + 20, btnWidth, btnHeight);
        ctx.strokeStyle = "#FFD400"; 
        ctx.strokeRect(centerX - 100, centerY + 20, btnWidth, btnHeight);
        
        ctx.fillStyle = "#FFD400";
        ctx.font = "bold 16px 'Space Mono', monospace";
        ctx.fillText("▶ INICIAR PARTIDA", centerX, centerY + 50);
    }

    function drawGameOverUI() {
        ctx.fillStyle = "rgba(10, 10, 9, 0.85)"; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#FF3366"; 
        ctx.font = "bold 32px 'Space Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillText("FIN DE LA PARTIDA", canvas.width / 2, canvas.height / 2 - 20);

        const btnWidth = 120; const btnHeight = 40;
        const centerY = canvas.height / 2; const centerX = canvas.width / 2;
        
        ctx.font = "bold 16px 'Space Mono', monospace";

        // Botón REINTENTAR 
        ctx.fillStyle = "rgba(0, 255, 234, 0.1)"; 
        ctx.fillRect(centerX - 140, centerY + 60, btnWidth, btnHeight);
        ctx.strokeStyle = "#00FFEA"; ctx.strokeRect(centerX - 140, centerY + 60, btnWidth, btnHeight);
        ctx.fillStyle = "#00FFEA";
        ctx.fillText("↻ REINTENTAR", centerX - 80, centerY + 85);

        // Botón PARAR 
        ctx.fillStyle = "rgba(163, 58, 54, 0.1)"; 
        ctx.fillRect(centerX + 20, centerY + 60, btnWidth, btnHeight);
        ctx.strokeStyle = "#A33A36"; ctx.strokeRect(centerX + 20, centerY + 60, btnWidth, btnHeight);
        ctx.fillStyle = "#A33A36";
        ctx.fillText("■ PARAR", centerX + 80, centerY + 85);
    }

    function animate() {
        requestAnimationFrame(animate);
        
        // Dibujamos el fondo base siempre
        if (isBgLoaded) {
            ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = "#0D0C0B";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // --- RENDERIZADO CONDICIONAL SEGÚN EL ESTADO ---

        if (isMainMenu) {
            drawMainMenuUI();
            return; // Si estamos en el menú, no dibujamos ni procesamos físicas
        }

        if (isGameOver && circles.length === 0) {
            drawGameOverUI();
            return; 
        } 
        
        // Físicas y Dibujado normal (Se ejecuta si no es Menú, o si es Game Over pero aún hay círculos limpiándose)
        for (let i = 0; i < circles.length; i++) {
            for (let j = i + 1; j < circles.length; j++) {
                if (!circles[i].isFading && !circles[j].isFading) {
                    resolveCollision(circles[i], circles[j]);
                }
            }
        }

        for (let i = circles.length - 1; i >= 0; i--) {
            let c = circles[i];
            c.update(ctx);

            // Solo fallar el nivel si el juego está activo
            if (!isGameOver && c.posY + c.radius < 0 && !c.isFading) {
                failLevel(); 
            }

            if (c.isDead) {
                if (c.isFading && c.opacity === 0 && !isGameOver) {
                    actualizarTelemetria();
                }
                circles.splice(i, 1);
            }
        }

        if (isGameOver) {
            drawGameOverUI(); // Se dibuja sobre los círculos si Game Over acaba de dispararse
        }

        // Subir de nivel solo si el juego está activo
        if (!isGameOver && spawnedThisLevel === CIRCLES_PER_LEVEL && circles.length === 0 && currentLevel <= MAX_LEVELS) {
            currentLevel++;
            spawnedThisLevel = 0; 
            setTimeout(startLevel, 2000); 
        }
    }
    
    // NOTA: Eliminamos la llamada a startLevel() aquí para que inicie en el menú
    animate();
})();