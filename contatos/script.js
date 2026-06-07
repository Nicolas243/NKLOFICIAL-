// NKL_oficial — script de interações mínimas

// Efeito de ripple nos link-cards
document.querySelectorAll('.link-card').forEach(card => {
  card.addEventListener('click', function(e) {
    const ripple = document.createElement('span');
    const rect = this.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: rgba(0, 255, 136, 0.15);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple-anim 0.5s ease-out forwards;
      pointer-events: none;
    `;

    this.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });
});

// Adicionar keyframe de ripple dinamicamente
const style = document.createElement('style');
style.textContent = `
  @keyframes ripple-anim {
    to { transform: scale(2.5); opacity: 0; }
  }
`;
document.head.appendChild(style);

// Contador de visitas local (localStorage)
const visits = parseInt(localStorage.getItem('nkl_visits') || '0') + 1;
localStorage.setItem('nkl_visits', visits);
