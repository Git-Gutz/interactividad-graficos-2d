/**
 * @fileoverview Sistema Phaethon V11 - Interfaz de Menús en Pirámide (Actividad 2.4)
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
    
    // Banderas de estado
    let isMainMenu = true; 
    let isGameOver = false;
    let isPaused = false;

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
        if (isMainMenu || isGameOver) return; 
        if (isPaused) unpauseSystem();
        else pauseSystem();
    });

    document.getElementById('selDificultad').addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === 'facil') diffScale = 1.5;      
        else if (val === 'normal') diffScale = 1.0; 
        else if (val === 'dificil') diffScale = 0.6; 

        if (!isMainMenu && !isGameOver) pauseSystem();
    });

    document.getElementById('selNivel').addEventListener('change', (e) => {
        currentLevel = parseInt(e.target.value);
        totalEliminated = (currentLevel - 1) * CIRCLES_PER_LEVEL; 
        
        document.getElementById('lblEliminados').innerText = totalEliminated;
        document.getElementById('lblNivel').innerText = currentLevel;
        
        const totalPosibles = MAX_LEVELS * CIRCLES_PER_LEVEL;
        document.getElementById('lblPorcentaje').innerText = Math.round((totalEliminated / totalPosibles) * 100) + '%';

        if (!isMainMenu && !isGameOver) {
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
            let r = (Math.random() * 20 + 25) * diffScale; 
            let speedMultiplier = 0.5 + (currentLevel * 0.4); 
            circles.push(new CircleC(r, speedMultiplier, (spawnedThisLevel + 1).toString()));
            spawnedThisLevel++;
        } else { clearInterval(spawnInterval); }
    }

    function startLevel() {
        if (currentLevel > MAX_LEVELS) {
            document.querySelector('.rp-status').innerText = "[SISTEMA COMPLETADO]";
            document.querySelector('.rp-status').style.color = "#00FFEA";
            return;
        }
        spawnedThisLevel = 0; circles = [];
        document.getElementById('lblNivel').innerText = currentLevel;
        document.getElementById('selNivel').value = currentLevel; 
        if(spawnInterval) clearInterval(spawnInterval);
        spawnInterval = setInterval(spawnCircle, 800);
    }

    function arrancarPartida() {
        isMainMenu = false; isGameOver = false; isPaused = false;
        document.getElementById('btnPausa').innerText = "⏸️ PAUSAR SISTEMA";
        
        currentLevel = parseInt(document.getElementById('selNivel').value);
        const valDif = document.getElementById('selDificultad').value;
        diffScale = valDif === 'facil' ? 1.5 : (valDif === 'dificil' ? 0.6 : 1.0);

        totalEliminated = (currentLevel - 1) * CIRCLES_PER_LEVEL;
        document.getElementById('lblEliminados').innerText = totalEliminated;
        startLevel();
    }

    function pararJuego() {
        isGameOver = false; isMainMenu = true; isPaused = false;
        document.getElementById('btnPausa').innerText = "⏸️ PAUSAR SISTEMA";
        clearInterval(spawnInterval); circles = [];
        const statusText = document.querySelector('.rp-status');
        statusText.innerText = "[SISTEMA EN ESPERA]";
        statusText.style.color = "#00E5FF";
    }

    function failLevel() {
        clearInterval(spawnInterval); circles = []; isGameOver = true; 
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
        if (isMainMenu || isGameOver || isPaused) return; 
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

       if (isPaused || isGameOver) {
    // Coordenadas para REINTENTAR (Basadas en centerX - 180 y ancho 160)
    if (mouse.x >= centerX - 180 && mouse.x <= centerX - 20 &&
        mouse.y >= centerY + 60 && mouse.y <= centerY + 120) {
        arrancarPartida(); 
        return;
    }
    // Coordenadas para SALIR (Basadas en centerX + 20 y ancho 160)
    if (mouse.x >= centerX + 20 && mouse.x <= centerX + 180 &&
        mouse.y >= centerY + 60 && mouse.y <= centerY + 120) {
        pararJuego(); 
        return;
    }
    // Coordenadas para RESETEAR (Basadas en centerX - 80 y ancho 160)
    if (mouse.x >= centerX - 80 && mouse.x <= centerX + 80 &&
        mouse.y >= centerY + 130 && mouse.y <= centerY + 190) {
        document.getElementById('selNivel').value = "1"; 
        arrancarPartida(); 
        return;
    }
    return; 
}
        if (!isPaused && !isMainMenu && !isGameOver) {
            circles.forEach(c => {
                const dist = Math.sqrt(Math.pow(mouse.x - c.posX, 2) + Math.pow(mouse.y - c.posY, 2));
                if (dist <= c.radius && !c.isFading) c.isFading = true; 
            });
        }
    });

    // --- INTERFACES DE CANVAS ---
    function drawMainMenuUI() {
        ctx.fillStyle = "rgba(10, 10, 9, 0.6)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#00FFEA"; ctx.font = "bold 24px 'Press Start 2P', cursive"; ctx.textAlign = "center";
        ctx.fillText("GODFINGER ARCADE", canvas.width / 2, canvas.height / 2 - 20);
        ctx.strokeStyle = "#FFD400"; ctx.strokeRect(canvas.width / 2 - 100, canvas.height / 2 + 20, 200, 50);
        ctx.fillStyle = "#FFD400"; ctx.font = "bold 12px 'Press Start 2P', cursive";
        ctx.fillText("▶ INICIAR", canvas.width / 2, canvas.height / 2 + 52);
    }

   function drawThreeButtonsUI() {
    // 1. Aumentamos el tamaño base (Ejemplo: de 120x40 a 160x60)
    const btnWidth = 160; 
    const btnHeight = 60; 
    
    const centerY = canvas.height / 2; 
    const centerX = canvas.width / 2;

    // 2. Aumentamos el tamaño de la fuente (Ejemplo: de 10px a 14px)
    ctx.font = "bold 14px 'Press Start 2P', cursive"; 
    ctx.textAlign = "center";

    // --- Botón 1: REINTENTAR ---
    // Ajustamos la X para que no choque (centerX - (ancho + margen))
    ctx.fillStyle = "rgba(0, 255, 234, 0.1)"; 
    ctx.fillRect(centerX - 180, centerY + 60, btnWidth, btnHeight);
    ctx.strokeStyle = "#00FFEA"; 
    ctx.strokeRect(centerX - 180, centerY + 60, btnWidth, btnHeight);
    ctx.fillStyle = "#00FFEA";
    ctx.fillText("↻ REINTENTAR", centerX - 100, centerY + 95); // Ajustar centro del texto

    // --- Botón 2: SALIR ---
    ctx.fillStyle = "rgba(163, 58, 54, 0.1)"; 
    ctx.fillRect(centerX + 20, centerY + 60, btnWidth, btnHeight);
    ctx.strokeStyle = "#A33A36"; 
    ctx.strokeRect(centerX + 20, centerY + 60, btnWidth, btnHeight);
    ctx.fillStyle = "#A33A36";
    ctx.fillText("■ SALIR", centerX + 100, centerY + 95);

    // --- Botón 3: RESETEAR ---
    // Bajamos un poco más este botón (centerY + 130) para que no choque con los de arriba
    ctx.fillStyle = "rgba(184, 41, 255, 0.1)"; 
    ctx.fillRect(centerX - 80, centerY + 130, btnWidth, btnHeight);
    ctx.strokeStyle = "#B829FF"; 
    ctx.strokeRect(centerX - 80, centerY + 130, btnWidth, btnHeight);
    ctx.fillStyle = "#B829FF";
    ctx.fillText("⟲ RESETEAR", centerX, centerY + 165);
}

    function drawGameOverUI() {
        ctx.fillStyle = "rgba(10, 10, 9, 0.85)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#FF3366"; ctx.font = "bold 20px 'Press Start 2P', cursive"; ctx.textAlign = "center";
        ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 20);
        drawThreeButtonsUI(); // Llama a la botonera piramidal
    }

    function drawPauseUI() {
        ctx.fillStyle = "rgba(10, 10, 9, 0.85)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#FFD400"; ctx.font = "bold 20px 'Press Start 2P', cursive"; ctx.textAlign = "center";
        ctx.fillText("SISTEMA PAUSADO", canvas.width / 2, canvas.height / 2 - 20);
        drawThreeButtonsUI(); // Llama a la botonera piramidal
    }

    function animate() {
        requestAnimationFrame(animate);
        if (isBgLoaded) ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
        else { ctx.fillStyle = "#0D0C0B"; ctx.fillRect(0, 0, canvas.width, canvas.height); }

        if (isMainMenu) return drawMainMenuUI();
        if (isGameOver && circles.length === 0) return drawGameOverUI();
        
        if (isPaused) {
            circles.forEach(c => c.draw(ctx)); 
            return drawPauseUI();
        }

        for (let i = 0; i < circles.length; i++) {
            for (let j = i + 1; j < circles.length; j++) {
                if (!circles[i].isFading && !circles[j].isFading) resolveCollision(circles[i], circles[j]);
            }
        }

        for (let i = circles.length - 1; i >= 0; i--) {
            let c = circles[i];
            c.update(ctx);
            if (!isGameOver && c.posY + c.radius < 0 && !c.isFading) failLevel();
            if (c.isDead) circles.splice(i, 1);
        }

        if (!isGameOver && spawnedThisLevel === CIRCLES_PER_LEVEL && circles.length === 0) {
            currentLevel++;
            setTimeout(startLevel, 2000);
        }
    }

    animate();
})();