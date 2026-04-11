/**
 * @fileoverview Sistema Phaethon V13 - Transiciones y Pantallas de Victoria (Actividad 2.4)
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
    let transitionTimeout; // NUEVO: Para controlar el tiempo de espera entre niveles
    
    // Banderas de estado
    let isMainMenu = true; 
    let isGameOver = false;
    let isPaused = false;
    let isTransitioning = false; // NUEVO: Pantalla entre niveles
    let isGameWon = false;       // NUEVO: Pantalla final

    // Multiplicador de dificultad inicial 
    let diffScale = 1.0; 

    // Carga de imagen de fondo táctico
    const bgImage = new Image();
    bgImage.src = 'https://i.imgur.com/kF2A8K4.png'; 
    let isBgLoaded = false;
    bgImage.onload = () => { isBgLoaded = true; };

    // --- FUNCIONES DE CONTROL DE ESTADO ---

    function pauseSystem() {
        isPaused = true;
        document.getElementById('btnPausa').innerText = "▶️ REANUDAR SISTEMA";
        clearInterval(spawnInterval);
    }

    function unpauseSystem() {
        isPaused = false;
        document.getElementById('btnPausa').innerText = "⏸️ PAUSAR SISTEMA";
        if (spawnInterval) clearInterval(spawnInterval);
        spawnInterval = setInterval(spawnCircle, 800);
    }

    // --- LISTENERS DE LA CONSOLA ---
    
    document.getElementById('btnPausa').addEventListener('click', (e) => {
        // Evitamos pausar mientras cambia de nivel o si ya ganó/perdió
        if (isMainMenu || isGameOver || isGameWon || isTransitioning) return; 
        if (isPaused) unpauseSystem();
        else pauseSystem();
    });

    document.getElementById('selDificultad').addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === 'facil') diffScale = 1.5;      
        else if (val === 'normal') diffScale = 1.0; 
        else if (val === 'dificil') diffScale = 0.6; 

        if (!isMainMenu && !isGameOver && !isGameWon && !isTransitioning) pauseSystem();
    });

    document.getElementById('selNivel').addEventListener('change', (e) => {
        currentLevel = parseInt(e.target.value);
        totalEliminated = (currentLevel - 1) * CIRCLES_PER_LEVEL; 
        
        document.getElementById('lblEliminados').innerText = totalEliminated;
        document.getElementById('lblNivel').innerText = currentLevel;
        
        const totalPosibles = MAX_LEVELS * CIRCLES_PER_LEVEL;
        document.getElementById('lblPorcentaje').innerText = Math.round((totalEliminated / totalPosibles) * 100) + '%';

        if (!isMainMenu && !isGameOver && !isGameWon) {
            // Si estaba en medio de una transición, la cancelamos y pausamos
            if (isTransitioning) {
                clearTimeout(transitionTimeout);
                isTransitioning = false;
            }
            pauseSystem();
            circles = [];
            spawnedThisLevel = 0; 
        }
    });

    // --- LÓGICA DE GEOMETRÍA ---
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
            context.strokeStyle = this.collisionTimer > 0 ? "#FFD400" : (this.isHovered ? "#FFFFFF" : "#00E5FF");
            context.lineWidth = 2;
            context.stroke(); 
            context.fillStyle = "#F2EBE1"; 
            context.textAlign = "center"; context.textBaseline = "middle"; 
            context.font = `bold ${this.radius * 0.6}px 'Space Mono', monospace`;
            context.fillText(this.text, this.posX, this.posY);
            context.closePath();
            context.restore(); 
        }

        update(context) {
            if (this.collisionTimer > 0) this.collisionTimer--;
            if (this.isFading) {
                this.opacity -= 0.05; 
                if (this.opacity <= 0) { this.opacity = 0; this.isDead = true; }
            }
            if (this.posX + this.radius > canvas.width || this.posX - this.radius < 0) this.dx = -this.dx;
            this.posX += this.dx; this.posY += this.dy;
            if (this.posY + this.radius < 0) this.isDead = true;
            this.draw(context);
        }
    }

    function resolveCollision(c1, c2) {
        const xDist = c2.posX - c1.posX; const yDist = c2.posY - c1.posY;
        const dist = Math.sqrt(xDist * xDist + yDist * yDist);
        if (dist < c1.radius + c2.radius) {
            const nx = xDist / dist; const ny = yDist / dist;
            const v1n = (c1.dx * nx) + (c1.dy * ny); const v2n = (c2.dx * nx) + (c2.dy * ny);
            c1.dx += (v2n - v1n) * nx; c1.dy += (v2n - v1n) * ny;
            c2.dx += (v1n - v2n) * nx; c2.dy += (v1n - v2n) * ny;
            const overlap = (c1.radius + c2.radius) - dist;
            c1.posX -= nx * (overlap / 2); c1.posY -= ny * (overlap / 2);
            c2.posX += nx * (overlap / 2); c2.posY += ny * (overlap / 2);
            c1.collisionTimer = 10; c2.collisionTimer = 10;
        }
    }

    function actualizarTelemetria() {
        totalEliminated++;
        document.getElementById('lblEliminados').innerText = totalEliminated;
        const totalPosibles = MAX_LEVELS * CIRCLES_PER_LEVEL;
        document.getElementById('lblPorcentaje').innerText = Math.round((totalEliminated / totalPosibles) * 100) + '%';
    }

    function spawnCircle() {
        if (spawnedThisLevel < CIRCLES_PER_LEVEL) {
            let r = (Math.random() * 20 + 35) * diffScale; 
            let speedMultiplier = 0.5 + (currentLevel * 0.4); 
            circles.push(new CircleC(r, speedMultiplier, (spawnedThisLevel + 1).toString()));
            spawnedThisLevel++;
        } else { clearInterval(spawnInterval); }
    }

    function startLevel() {
        spawnedThisLevel = 0; circles = [];
        document.getElementById('lblNivel').innerText = currentLevel;
        document.getElementById('selNivel').value = currentLevel; 
        if(spawnInterval) clearInterval(spawnInterval);
        spawnInterval = setInterval(spawnCircle, 800);
        
        const statusText = document.querySelector('.rp-status');
        statusText.innerText = "[TELEMETRÍA DE COMBATE]";
        statusText.style.color = "#FFD400";
    }

    function arrancarPartida() {
        isMainMenu = false; isGameOver = false; isGameWon = false; 
        isPaused = false; isTransitioning = false;
        clearTimeout(transitionTimeout);
        document.getElementById('btnPausa').innerText = "⏸️ PAUSAR SISTEMA";
        
        currentLevel = parseInt(document.getElementById('selNivel').value);
        const valDif = document.getElementById('selDificultad').value;
        diffScale = valDif === 'facil' ? 1.5 : (valDif === 'dificil' ? 0.6 : 1.0);

        // Resetea las eliminaciones según el nivel
        totalEliminated = (currentLevel - 1) * CIRCLES_PER_LEVEL;
        document.getElementById('lblEliminados').innerText = totalEliminated;
        
        // --- CORRECCIÓN: Fuerza la actualización del porcentaje en la pantalla ---
        const totalPosibles = MAX_LEVELS * CIRCLES_PER_LEVEL;
        document.getElementById('lblPorcentaje').innerText = Math.round((totalEliminated / totalPosibles) * 100) + '%';
        
        startLevel();
    }

    function pararJuego() {
        isGameOver = false; isMainMenu = true; isGameWon = false;
        isPaused = false; isTransitioning = false;
        clearTimeout(transitionTimeout);
        clearInterval(spawnInterval); circles = [];
        
        document.getElementById('btnPausa').innerText = "⏸️ PAUSAR SISTEMA";
        const statusText = document.querySelector('.rp-status');
        statusText.innerText = "[SISTEMA EN ESPERA]";
        statusText.style.color = "#00E5FF";
    }

    function failLevel() {
        clearInterval(spawnInterval); circles = []; 
        isGameOver = true; isTransitioning = false; clearTimeout(transitionTimeout);
        const statusText = document.querySelector('.rp-status');
        statusText.innerText = "[FALLO EN PERÍMETRO: GAME OVER]";
        statusText.style.color = "#FF3366";
    }

    // --- MANEJO DE EVENTOS MOUSE ---
    function getMousePos(evt) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: (evt.clientX - rect.left) * (canvas.width / rect.width),
            y: (evt.clientY - rect.top) * (canvas.height / rect.height)
        };
    }

    canvas.addEventListener('mousemove', (e) => {
        if (isMainMenu || isGameOver || isGameWon || isPaused || isTransitioning) return; 
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

        if (isMainMenu) {
            if (mouse.x >= centerX - 100 && mouse.x <= centerX + 100 && mouse.y >= centerY + 20 && mouse.y <= centerY + 70) {
                arrancarPartida();
            }
            return; 
        }

        // Si está en transición, bloqueamos los clics
        if (isTransitioning) return;

        // Lógica de menús (Pausa, Game Over y Game Won usan los mismos 3 botones)
        if (isPaused || isGameOver || isGameWon) {
            // Hitbox REINTENTAR 
            if (mouse.x >= centerX - 160 && mouse.x <= centerX - 10 &&
                mouse.y >= centerY + 50 && mouse.y <= centerY + 95) {
                arrancarPartida(); 
                return;
            }
            // Hitbox SALIR 
            if (mouse.x >= centerX + 10 && mouse.x <= centerX + 160 &&
                mouse.y >= centerY + 50 && mouse.y <= centerY + 95) {
                pararJuego(); 
                return;
            }
            // Hitbox RESETEAR 
            if (mouse.x >= centerX - 75 && mouse.x <= centerX + 75 &&
                mouse.y >= centerY + 110 && mouse.y <= centerY + 155) {
                document.getElementById('selNivel').value = "1"; 
                arrancarPartida(); 
                return;
            }
            return; 
        }

        if (!isPaused && !isMainMenu && !isGameOver && !isGameWon) {
            circles.forEach(c => {
                const dist = Math.sqrt(Math.pow(mouse.x - c.posX, 2) + Math.pow(mouse.y - c.posY, 2));
                if (dist <= c.radius && !c.isFading) {
                    c.isFading = true; 
                    actualizarTelemetria();} // <-- AQUÍ LLAMAMOS AL CONTADOR
            });
        }
    });

    // --- INTERFACES DE CANVAS ---
    function drawMainMenuUI() {
        ctx.fillStyle = "rgba(10, 10, 9, 0.6)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#00FFEA"; ctx.font = "bold 24px 'Press Start 2P', cursive"; ctx.textAlign = "center";
        ctx.fillText("BUBBLE PANIC", canvas.width / 2, canvas.height / 2 - 20);
        ctx.strokeStyle = "#FFD400"; ctx.strokeRect(canvas.width / 2 - 100, canvas.height / 2 + 20, 200, 50);
        ctx.fillStyle = "#FFD400"; ctx.font = "bold 12px 'Press Start 2P', cursive";
        ctx.fillText("▶ INICIAR", canvas.width / 2, canvas.height / 2 + 52);
    }

    // Botones maximizados
    function drawThreeButtonsUI() {
        const btnWidth = 150; const btnHeight = 45; 
        const centerY = canvas.height / 2; const centerX = canvas.width / 2;
        ctx.font = "bold 11px 'Press Start 2P', cursive"; ctx.textAlign = "center";

        ctx.fillStyle = "rgba(0, 255, 234, 0.1)"; ctx.fillRect(centerX - 160, centerY + 50, btnWidth, btnHeight);
        ctx.strokeStyle = "#00FFEA"; ctx.strokeRect(centerX - 160, centerY + 50, btnWidth, btnHeight);
        ctx.fillStyle = "#00FFEA"; ctx.fillText("↻ REINTENTAR", centerX - 85, centerY + 78);

        ctx.fillStyle = "rgba(163, 58, 54, 0.1)"; ctx.fillRect(centerX + 10, centerY + 50, btnWidth, btnHeight);
        ctx.strokeStyle = "#A33A36"; ctx.strokeRect(centerX + 10, centerY + 50, btnWidth, btnHeight);
        ctx.fillStyle = "#A33A36"; ctx.fillText("■ SALIR", centerX + 85, centerY + 78);

        ctx.fillStyle = "rgba(184, 41, 255, 0.1)"; ctx.fillRect(centerX - 75, centerY + 110, btnWidth, btnHeight);
        ctx.strokeStyle = "#B829FF"; ctx.strokeRect(centerX - 75, centerY + 110, btnWidth, btnHeight);
        ctx.fillStyle = "#B829FF"; ctx.fillText("⟲ RESETEAR", centerX, centerY + 138);
    }

    function drawGameOverUI() {
        ctx.fillStyle = "rgba(10, 10, 9, 0.85)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#FF3366"; ctx.font = "bold 20px 'Press Start 2P', cursive"; ctx.textAlign = "center";
        ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 20);
        drawThreeButtonsUI(); 
    }

    function drawPauseUI() {
        ctx.fillStyle = "rgba(10, 10, 9, 0.85)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#FFD400"; ctx.font = "bold 20px 'Press Start 2P', cursive"; ctx.textAlign = "center";
        ctx.fillText("SISTEMA PAUSADO", canvas.width / 2, canvas.height / 2 - 20);
        drawThreeButtonsUI(); 
    }

    // --- NUEVO: UI de Transición ---
    function drawTransitionUI() {
        ctx.fillStyle = "rgba(10, 10, 9, 0.8)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = "#00FFEA"; 
        ctx.font = "bold 16px 'Press Start 2P', cursive"; 
        ctx.textAlign = "center";
        ctx.fillText("¡NIVEL DESPEJADO!", canvas.width / 2, canvas.height / 2 - 20);

        ctx.fillStyle = "#FFD400"; 
        ctx.font = "bold 12px 'Press Start 2P', cursive";
        ctx.fillText(`PREPARANDO NIVEL ${currentLevel}...`, canvas.width / 2, canvas.height / 2 + 20);
    }

    // --- NUEVO: UI de Victoria Final (Nivel 10) ---
    function drawGameWonUI() {
        ctx.fillStyle = "rgba(10, 10, 9, 0.9)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Letrero Superior
        ctx.fillStyle = "#00FFEA"; 
        ctx.font = "bold 20px 'Press Start 2P', cursive"; 
        ctx.textAlign = "center";
        ctx.fillText("¡SISTEMA PURGADO!", canvas.width / 2, canvas.height / 2 - 30);

        // Mensaje personalizado según la dificultad
        const dif = document.getElementById('selDificultad').value;
        let msg = "";
        if (dif === 'facil') msg = "GAME COMPLETE";
        else if (dif === 'normal') msg = "YOU WIN";
        else if (dif === 'dificil') msg = "QUE HABILIDAD SEÑOR!";

        ctx.fillStyle = "#FFD400"; 
        // Si es difícil (texto largo), achicamos un poquito la letra para que quepa perfecto
        ctx.font = dif === 'dificil' ? "bold 13px 'Press Start 2P', cursive" : "bold 16px 'Press Start 2P', cursive"; 
        ctx.fillText(msg, canvas.width / 2, canvas.height / 2 + 5);

        drawThreeButtonsUI(); 
    }

    function animate() {
        requestAnimationFrame(animate);
        if (isBgLoaded) ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
        else { ctx.fillStyle = "#0D0C0B"; ctx.fillRect(0, 0, canvas.width, canvas.height); }

        if (isMainMenu) return drawMainMenuUI();
        if (isGameWon) return drawGameWonUI(); // Muestra la pantalla de victoria
        if (isGameOver && circles.length === 0) return drawGameOverUI();
        
        if (isPaused) {
            circles.forEach(c => c.draw(ctx)); 
            return drawPauseUI();
        }

        // Si está en transición, dibujamos el letrero y pausamos la física
        if (isTransitioning) {
            drawTransitionUI();
            return;
        }

        for (let i = 0; i < circles.length; i++) {
            for (let j = i + 1; j < circles.length; j++) {
                if (!circles[i].isFading && !circles[j].isFading) resolveCollision(circles[i], circles[j]);
            }
        }

        for (let i = circles.length - 1; i >= 0; i--) {
            let c = circles[i];
            c.update(ctx);
            if (!isGameOver && !isGameWon && c.posY + c.radius < 0 && !c.isFading) failLevel();
            if (c.isDead) circles.splice(i, 1);
        }

        // --- NUEVA LÓGICA DE TRANSICIÓN Y VICTORIA ---
        if (!isGameOver && !isGameWon && !isPaused && !isTransitioning && spawnedThisLevel === CIRCLES_PER_LEVEL && circles.length === 0) {
            
            if (currentLevel >= MAX_LEVELS) {
                // Ganaste el juego completo
                isGameWon = true;
                const statusText = document.querySelector('.rp-status');
                statusText.innerText = "[SISTEMA COMPLETADO]";
                statusText.style.color = "#00FFEA";
            } else {
                // Pasas al siguiente nivel
                isTransitioning = true;
                currentLevel++;
                
                // Actualizamos visualmente el HTML para que diga el nivel que se prepara
                document.getElementById('lblNivel').innerText = currentLevel;
                document.getElementById('selNivel').value = currentLevel; 

                // Esperamos 2 segundos y arrancamos la siguiente oleada
                transitionTimeout = setTimeout(() => {
                    isTransitioning = false;
                    startLevel();
                }, 2000);
            }
        }
    }

    animate();
})();