// Particle system for hero section background effect

export interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    opacity: number;
}

export class ParticleSystem {
    private particles: Particle[] = [];
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private mouseX = 0;
    private mouseY = 0;
    private animationId: number | null = null;

    constructor(canvas: HTMLCanvasElement, particleCount = 50) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.initParticles(particleCount);
        this.resizeCanvas();
    }

    private initParticles(count: number) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 3 + 1,
                opacity: Math.random() * 0.5 + 0.2,
            });
        }
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    updateMousePosition(x: number, y: number) {
        this.mouseX = x;
        this.mouseY = y;
    }

    private updateParticles() {
        this.particles.forEach((particle) => {
            // Move particle
            particle.x += particle.vx;
            particle.y += particle.vy;

            // Mouse interaction - particles move away from cursor
            const dx = particle.x - this.mouseX;
            const dy = particle.y - this.mouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 100) {
                const force = (100 - dist) / 100;
                particle.vx += (dx / dist) * force * 0.2;
                particle.vy += (dy / dist) * force * 0.2;
            }

            // Damping
            particle.vx *= 0.99;
            particle.vy *= 0.99;

            // Boundary wrapping
            if (particle.x < 0) particle.x = this.canvas.width;
            if (particle.x > this.canvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = this.canvas.height;
            if (particle.y > this.canvas.height) particle.y = 0;
        });
    }

    private drawParticles() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.particles.forEach((particle) => {
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(220, 38, 38, ${particle.opacity})`; // Red accent
            this.ctx.fill();
        });

        // Draw connections between nearby particles
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 120) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    this.ctx.strokeStyle = `rgba(220, 38, 38, ${0.1 * (1 - dist / 120)})`;
                    this.ctx.lineWidth = 1;
                    this.ctx.stroke();
                }
            }
        }
    }

    animate() {
        this.updateParticles();
        this.drawParticles();
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    start() {
        if (!this.animationId) {
            this.animate();
        }
    }

    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    destroy() {
        this.stop();
        this.particles = [];
    }
}
