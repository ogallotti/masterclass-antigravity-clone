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
        const heroSection = document.querySelector('.hero');

        let animationFrameId;
        let particles = [];
        let mouse = { x: -1000, y: -1000 };

        // Configuration
        const particleCount = 250; // Per spec
        const colors = ["#4285F4", "#1A73E8", "#669DF6"]; // Per spec
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
            const rect = heroSection.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
        }

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            particles.forEach(p => {
                p.update();
                p.draw();
            });
            
            // Draw connections (Grab mode simulation)
            // Only if mouse is close? Or always? Spec says "line_linked" in grab mode
            // Let's draw lines between particles close to mouse
            /*
            particles.forEach(a => {
                const dx = mouse.x - a.x;
                const dy = mouse.y - a.y;
                const distMouse = Math.sqrt(dx*dx + dy*dy);
                
                if (distMouse < 200) {
                    particles.forEach(b => {
                        const dx2 = a.x - b.x;
                        const dy2 = a.y - b.y;
                        const dist = Math.sqrt(dx2*dx2 + dy2*dy2);
                        
                        if (dist < 100) {
                            ctx.beginPath();
                            ctx.strokeStyle = a.color;
                            ctx.lineWidth = 0.5;
                            ctx.moveTo(a.x, a.y);
                            ctx.lineTo(b.x, b.y);
                            ctx.stroke();
                        }
                    });
                }
            });
            */

            animationFrameId = requestAnimationFrame(animate);
        }

        window.addEventListener('resize', resize);
        
        heroSection.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        });
        
        heroSection.addEventListener('mouseleave', () => {
            mouse.x = -1000;
            mouse.y = -1000;
        });

        init();
        animate();
    }
});
