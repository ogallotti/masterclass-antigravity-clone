document.addEventListener('DOMContentLoaded', () => {
    // --- 1. Header & Sticky Bar Scroll Effect ---
    const header = document.getElementById('header');
    const urgencyBar = document.getElementById('urgency-bar');
    
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        
        // Header blur
        if (scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        // Sticky Bar reveal (after 30% of viewport height approx, or fixed px)
        if (scrollY > window.innerHeight * 0.3) {
            urgencyBar.classList.add('visible');
        } else {
            urgencyBar.classList.remove('visible');
        }
    });

    // --- 2. Scroll Animations (Intersection Observer) ---
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Don't unobserve if we want it to persist, but for fade-in-up usually we want once.
                // However, for scribbles we want undo.
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-in-up').forEach(el => {
        observer.observe(el);
    });

    // --- 2.1 Scribble Animations (Undo on scroll up) ---
    const scribbleObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('scribble-active');
            } else {
                // Remove class when out of view to "undo" the animation
                // Check bounding client rect to see if it's above or below?
                // Actually, just removing it whenever it leaves viewport works for "undoing"
                // But user said "Ao voltar o scroll vai se desfazendo", implying if I scroll UP it undoes.
                // If I scroll DOWN past it, it should probably stay drawn?
                // Usually "undo on scroll up" means if I go back to it, it re-animates?
                // Or does it mean it scrubs?
                // Let's stick to: visible = drawn, not visible = undrawn.
                // So if you scroll past it and come back, it's drawn?
                // Let's make it: if boundingClientRect.y > 0 (it went off screen to the bottom) -> remove class
                // If boundingClientRect.y < 0 (it went off screen to the top) -> keep class?
                
                // Simple approach first: Toggle on intersect.
                entry.target.classList.remove('scribble-active');
            }
        });
    }, { threshold: 0.5, rootMargin: "0px 0px -30% 0px" });

    document.querySelectorAll('.scribble-wrapper, .scribble-bullet-wrapper').forEach(el => {
        scribbleObserver.observe(el);
    });

    // --- 3. FAQ Accordion ---
    document.querySelectorAll('.faq-question').forEach(question => {
        question.addEventListener('click', () => {
            const item = question.parentElement;
            item.classList.toggle('open');
        });
    });

    // --- 4. Particle System (Refined) ---
    const canvas = document.getElementById('particle-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        const ctaSection = document.querySelector('.cta-dark'); // Changed from hero

        let animationFrameId;
        let particles = [];
        let mouse = { x: -1000, y: -1000 };

        // Configuration
        const particleCount = 250; // Per spec
        const colors = ["#E53935", "#C62828", "#EF5350"]; // Red tones
        const connectionDistance = 150;
        const mouseRepelRadius = 150;

        class Particle {
            constructor(x, y) {
                this.x = x ? x : Math.random() * canvas.width;
                this.y = y ? y : Math.random() * canvas.height;
                this.vx = (Math.random() - 0.5) * 2; // Speed 1 approx
                this.vy = (Math.random() - 0.5) * 2;
                this.size = Math.random() * 4 + 1; // Size value 4 random
                this.color = colors[Math.floor(Math.random() * colors.length)];
                this.baseX = this.x;
                this.baseY = this.y;
                this.density = (Math.random() * 30) + 1;
            }

            update() {
                // Mouse Interaction (Grab/Repel mix from spec)
                // Spec says "grab" mode on hover, but also "Parallax leve"
                // Let's implement a gentle parallax/repel
                
                const dx = mouse.x - this.x;
                const dy = mouse.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < mouseRepelRadius) {
                    const forceDirectionX = dx / distance;
                    const forceDirectionY = dy / distance;
                    const force = (mouseRepelRadius - distance) / mouseRepelRadius;
                    const directionX = forceDirectionX * force * this.density;
                    const directionY = forceDirectionY * force * this.density;
                    
                    this.x -= directionX;
                    this.y -= directionY;
                }

                // Move
                this.x += this.vx;
                this.y += this.vy;

                // Bounce off edges
                if (this.x < 0 || this.x > canvas.width) this.vx = -this.vx;
                if (this.y < 0 || this.y > canvas.height) this.vy = -this.vy;
            }

            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.globalAlpha = 0.5; // Opacity 0.5
                ctx.fill();
                ctx.globalAlpha = 1;
            }
        }

        function init() {
            resize();
            particles = [];
            
            // Start concentrated in center for explosion effect
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;

            for (let i = 0; i < particleCount; i++) {
                // Initialize at center
                particles.push(new Particle(centerX, centerY));
            }
            
            // Explosion effect: Give them high initial velocity outwards
            particles.forEach(p => {
                p.vx = (Math.random() - 0.5) * 20;
                p.vy = (Math.random() - 0.5) * 20;
            });

            // Slow them down after explosion
            setTimeout(() => {
                particles.forEach(p => {
                    p.vx = (Math.random() - 0.5) * 2;
                    p.vy = (Math.random() - 0.5) * 2;
                });
            }, 500);
        }

        function resize() {
            if (!ctaSection) return;
            const rect = ctaSection.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
        }

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            particles.forEach(p => {
                p.update();
                p.draw();
            });
            
            animationFrameId = requestAnimationFrame(animate);
        }

        window.addEventListener('resize', resize);
        
        if (ctaSection) {
            ctaSection.addEventListener('mousemove', (e) => {
                const rect = canvas.getBoundingClientRect();
                mouse.x = e.clientX - rect.left;
                mouse.y = e.clientY - rect.top;
            });
            
            ctaSection.addEventListener('mouseleave', () => {
                mouse.x = -1000;
                mouse.y = -1000;
            });
        }

        init();
        animate();
    }

    // --- 5. Scribble Question Marks on Viewport (Footer CTA) ---
    const lastCtaSection = document.getElementById('last-cta');
    const questionContainer = document.getElementById('question-marks-container');
    let questionInterval;

    if (lastCtaSection && questionContainer) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Start generating question marks if not already running
                    if (!questionInterval) {
                        questionInterval = setInterval(() => {
                            createQuestionMark();
                        }, 300); // New question mark every 300ms
                    }
                } else {
                    // Stop generating
                    if (questionInterval) {
                        clearInterval(questionInterval);
                        questionInterval = null;
                    }
                }
            });
        }, { threshold: 0.1 }); // Trigger when 10% visible

        observer.observe(lastCtaSection);
    }

    function createQuestionMark() {
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.classList.add("scribble-question");
        svg.setAttribute("viewBox", "0 0 40 60");
        svg.setAttribute("preserveAspectRatio", "none");

        // Random position
        const x = Math.random() * 100; // %
        const y = Math.random() * 100; // %
        
        // Random rotation
        const rotation = (Math.random() - 0.5) * 40; // -20 to 20 deg
        
        svg.style.left = `${x}%`;
        svg.style.top = `${y}%`;
        svg.style.setProperty('--rotation', `${rotation}deg`);

        // 10 Variations of Scribble Question Marks
        const paths = [
            "M10,20 Q20,5 30,20 Q35,35 20,35 M20,45 L20,50", // Original
            "M12,22 Q22,2 32,22 Q38,38 18,38 M18,48 L18,53", // More curved
            "M8,18 Q20,0 32,18 Q38,32 20,35 M20,45 L20,50", // Wide top
            "M15,20 Q20,5 25,20 Q28,35 20,35 M20,45 L20,50", // Narrow
            "M10,25 Q10,5 20,5 Q30,5 30,25 Q30,40 20,40 M20,48 L20,52", // Loopy
            "M12,25 C12,5 35,5 25,25 C20,35 20,35 20,40 M20,48 L20,52", // Hook style
            "M10,20 Q20,8 30,20 Q32,30 22,35 M22,45 L23,49", // Messy
            "M15,25 Q20,15 25,25 Q28,35 20,35 M20,42 L20,45", // Small
            "M5,20 Q20,-5 35,20 Q40,40 20,40 M20,50 L20,55", // Big loop
            "M12,20 Q25,8 32,25 Q35,40 22,38 M20,48 L18,52"  // Tilted
        ];

        const randomPath = paths[Math.floor(Math.random() * paths.length)];

        // Create path
        const path = document.createElementNS(svgNS, "path");
        path.setAttribute("d", randomPath);
        
        svg.appendChild(path);
        questionContainer.appendChild(svg);

        // Remove after animation ends (2s)
        setTimeout(() => {
            svg.remove();
        }, 2000);
    }

    // --- 6. Hero Scribble Text (Stick Font) ---
    function drawHeroScribble() {
        const svg = document.getElementById('hero-scribble-svg');
        if (!svg) return;

        const letterPaths = {
            'A': 'M0,40 L15,0 L30,40 M5,25 L25,25',
            'Á': 'M0,40 L15,0 L30,40 M5,25 L25,25 M15,-10 L25,0',
            'C': 'M30,10 C30,0 0,0 0,20 C0,40 30,40 30,30',
            'D': 'M0,0 L0,40 L15,40 C35,40 35,0 15,0 L0,0',
            'E': 'M25,0 L0,0 L0,40 L25,40 M0,20 L20,20',
            'F': 'M25,0 L0,0 L0,40 M0,20 L20,20',
            'G': 'M30,10 C30,0 0,0 0,20 C0,40 30,40 30,20 L15,20',
            'I': 'M15,0 L15,40',
            'Í': 'M15,0 L15,40 M15,-10 L25,0',
            'M': 'M0,40 L0,0 L15,20 L30,0 L30,40',
            'N': 'M0,40 L0,0 L30,40 L30,0',
            'O': 'M15,0 C-5,0 -5,40 15,40 C35,40 35,0 15,0',
            'P': 'M0,40 L0,0 L20,0 C30,0 30,20 20,20 L0,20',
            'R': 'M0,40 L0,0 L20,0 C30,0 30,20 20,20 L0,20 L30,40',
            'S': 'M30,5 C0,5 0,20 15,20 C30,20 30,35 0,35',
            'T': 'M15,0 L15,40 M0,0 L30,0',
            'U': 'M0,0 L0,30 C0,40 30,40 30,30 L30,0',
            '4': 'M25,40 L25,0 L0,25 L30,25',
            '8': 'M15,20 C0,20 0,0 15,0 C30,0 30,20 15,20 C0,20 0,40 15,40 C30,40 30,20 15,20',
            ' ': ''
        };

        const lines = [
            "ESSA PÁGINA",
            "FOI CRIADA",
            "EM 48 MINUTOS"
        ];

        const startY = 80;
        const lineHeight = 80;
        const charWidth = 35;
        const charGap = 10;
        const svgWidth = 800;
        
        let totalDelay = 0.5; // Start delay in seconds
        const letterDuration = 0.1; // Duration between starting each letter

        lines.forEach((line, lineIndex) => {
            const lineWidth = line.length * (charWidth + charGap);
            let startX = (svgWidth - lineWidth) / 2;
            let currentY = startY + (lineIndex * lineHeight);

            // Group for the line
            const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
            g.classList.add("scribble-line");

            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (letterPaths[char]) {
                    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                    path.setAttribute("d", letterPaths[char]);
                    // Apply translation to position the letter
                    path.setAttribute("transform", `translate(${startX}, ${currentY})`);
                    
                    // Set delay for this specific letter
                    path.style.animationDelay = `${totalDelay}s`;
                    
                    g.appendChild(path);
                    totalDelay += letterDuration;
                } else {
                    // Space adds a small delay
                    totalDelay += letterDuration;
                }
                startX += charWidth + charGap;
            }
            svg.appendChild(g);
        });
    }

    drawHeroScribble();
});
