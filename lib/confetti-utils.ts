// Utility function to create confetti effect
export function generateConfetti() {
  if (typeof window === 'undefined') return;
  
  // Create and configure canvas for confetti
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.pointerEvents = 'none';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.zIndex = '999999';
  document.body.appendChild(canvas);
  
  const context = canvas.getContext('2d');
  if (!context) return;
  
  // Set canvas dimensions
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
  
  // Confetti pieces configuration
  const pieces: Piece[] = [];
  const particleCount = 150;
  
  // Create confetti pieces
  for (let i = 0; i < particleCount; i++) {
    pieces.push(new Piece(
      Math.random() * canvas.width,
      Math.random() * canvas.height * -1,
      Math.random() * 10 + 5,
      Math.random() * 3 + 1,
      i % 5
    ));
  }
  
  // Animation loop
  let animationId: number | null = null;
  
  function animate() {
    if (!context) return;
    
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    pieces.forEach(piece => {
      piece.update();
      piece.draw(context);
    });
    
    const stillActive = pieces.some(piece => piece.y < canvas.height);
    
    if (stillActive) {
      animationId = requestAnimationFrame(animate);
    } else {
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    }
  }
  
  animate();
  
  // Clean up after 8 seconds regardless
  setTimeout(() => {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
    
    if (canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
  }, 8000);
}

// Confetti piece class
class Piece {
  x: number;
  y: number;
  size: number;
  speed: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  
  constructor(x: number, y: number, size: number, speed: number, colorIndex: number) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.speed = speed;
    this.color = this.getColor(colorIndex);
    this.rotation = Math.random() * 360;
    this.rotationSpeed = Math.random() * 5 - 2.5;
  }
  
  update() {
    this.y += this.speed;
    this.rotation += this.rotationSpeed;
    
    // Add some horizontal drift
    this.x += Math.sin(this.y * 0.01) * 0.5;
  }
  
  draw(context: CanvasRenderingContext2D) {
    context.save();
    context.translate(this.x, this.y);
    context.rotate((this.rotation * Math.PI) / 180);
    
    // Draw either a rectangle or circle
    if (Math.random() > 0.5) {
      context.fillStyle = this.color;
      context.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
    } else {
      context.beginPath();
      context.arc(0, 0, this.size / 2, 0, Math.PI * 2);
      context.fillStyle = this.color;
      context.fill();
    }
    
    context.restore();
  }
  
  getColor(index: number): string {
    const colors = [
      '#FF69B4', // Hot Pink
      '#FFD700', // Gold
      '#00BFFF', // Deep Sky Blue
      '#32CD32', // Lime Green
      '#9370DB'  // Medium Purple
    ];
    return colors[index % colors.length];
  }
}