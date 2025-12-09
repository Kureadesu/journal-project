// Loading state manager
// Usage: import { showLoading, hideLoading } from './loading.js';

let loadingOverlay = null;
let loadingCount = 0;

function ensureLoadingOverlay() {
  if (!loadingOverlay) {
    loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'loading-overlay';
    loadingOverlay.innerHTML = `
      <div class="loading-spinner"></div>
      <div class="loading-text">Please wait...</div>
    `;
    
    loadingOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      display: none;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      gap: 1rem;
      z-index: 9999;
      animation: fadeIn 0.2s ease;
    `;
    
    document.body.appendChild(loadingOverlay);
    
    // Add spinner styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      
      .loading-spinner {
        width: 50px;
        height: 50px;
        border: 4px solid rgba(255, 255, 255, 0.3);
        border-top-color: #fff;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      
      .loading-text {
        color: white;
        font-size: 1rem;
        font-weight: 500;
      }
      
      .btn-loading {
        position: relative;
        pointer-events: none;
        opacity: 0.7;
      }
      
      .btn-loading::after {
        content: '';
        position: absolute;
        width: 16px;
        height: 16px;
        top: 50%;
        left: 50%;
        margin: -8px 0 0 -8px;
        border: 2px solid currentColor;
        border-top-color: transparent;
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
      }
    `;
    
    if (!document.getElementById('loading-styles')) {
      style.id = 'loading-styles';
      document.head.appendChild(style);
    }
  }
  return loadingOverlay;
}

function showLoading(message = 'Please wait...') {
  const overlay = ensureLoadingOverlay();
  loadingCount++;
  
  const textEl = overlay.querySelector('.loading-text');
  if (textEl) {
    textEl.textContent = message;
  }
  
  overlay.style.display = 'flex';
}

function hideLoading() {
  loadingCount = Math.max(0, loadingCount - 1);
  
  if (loadingCount === 0 && loadingOverlay) {
    loadingOverlay.style.animation = 'fadeOut 0.2s ease';
    setTimeout(() => {
      if (loadingOverlay && loadingCount === 0) {
        loadingOverlay.style.display = 'none';
        loadingOverlay.style.animation = 'fadeIn 0.2s ease';
      }
    }, 200);
  }
}

function setButtonLoading(button, isLoading, loadingText = 'Please wait...') {
  if (!button) return;
  
  if (isLoading) {
    button.dataset.originalText = button.textContent;
    button.textContent = loadingText;
    button.classList.add('btn-loading');
    button.disabled = true;
  } else {
    button.textContent = button.dataset.originalText || button.textContent;
    button.classList.remove('btn-loading');
    button.disabled = false;
  }
}

// Add fadeOut animation
const fadeOutStyle = document.createElement('style');
fadeOutStyle.textContent = `
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
`;
document.head.appendChild(fadeOutStyle);

export { showLoading, hideLoading, setButtonLoading };