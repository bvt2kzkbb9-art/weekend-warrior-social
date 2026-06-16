/**
 * WEEKEND WARRIOR SOCIAL - Easter Egg: ZRÓB LAGĘ
 * 
 * Type: ZRÓB LAGĘ
 * Result: Slowdown animations, add micro-stutters
 * Duration: 10 seconds then auto-reset
 */

(function() {
  let inputBuffer = '';
  const command = 'ZRÓB LAGĘ';
  let lagModeActive = false;
  let lagTimer = null;

  // Listen for keyboard input
  document.addEventListener('keydown', (e) => {
    // Build input buffer
    inputBuffer += e.key.toUpperCase();
    
    // Keep only last N characters
    if (inputBuffer.length > command.length + 5) {
      inputBuffer = inputBuffer.slice(-command.length - 5);
    }

    // Check if command is in buffer
    if (inputBuffer.includes(command)) {
      activateLagMode();
      inputBuffer = ''; // Reset buffer
    }
  });

  function activateLagMode() {
    if (lagModeActive) return;
    
    lagModeActive = true;
    document.body.classList.add('lag-mode');

    // Show alert
    alert('⚠ TRYB LAGI AKTYWNY\n\nAnimacje spowolnione.\nMikroprzycięcia włączone.\n\nAuto-reset za 10 sekund.');

    // Add stutter effect
    injectStutters();

    // Auto-reset after 10 seconds
    if (lagTimer) clearTimeout(lagTimer);
    lagTimer = setTimeout(() => {
      document.body.classList.remove('lag-mode');
      lagModeActive = false;
      console.log('✅ Lag mode disabled');
    }, 10000);
  }

  function injectStutters() {
    // Simulate micro-stutters every 500ms
    let stutterCount = 0;
    const stutterInterval = setInterval(() => {
      if (!lagModeActive) {
        clearInterval(stutterInterval);
        return;
      }

      // Add temporary style change
      const stutter = document.createElement('style');
      stutter.textContent = 'html { animation: none 0s !important; }';
      stutter.id = `stutter-${stutterCount}`;
      document.head.appendChild(stutter);

      // Remove after 50ms
      setTimeout(() => {
        stutter.remove();
      }, 50);

      stutterCount++;
    }, 500);
  }

  // Debug console
  console.log('🎮 Easter egg loaded. Type: ZRÓB LAGĘ');
})();

