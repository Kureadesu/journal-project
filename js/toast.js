// Toast notification system
// Usage: import { showToast } from './toast.js';

let toastContainer = null;

function ensureToastContainer() {
  if (!toastContainer) {
    toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      toastContainer.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      `;
      document.body.appendChild(toastContainer);
    }
  }
  return toastContainer;
}

function showToast(message, type = 'info', duration = 3000) {
  const container = ensureToastContainer();
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  // Icons for different types
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };
  
  // Colors for different types
  const colors = {
    success: '#28a745',
    error: '#dc3545',
    warning: '#ffc107',
    info: '#456882'
  };
  
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-message">${message}</span>
  `;
  
  toast.style.cssText = `
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
    background: ${colors[type] || colors.info};
    color: white;
    border-radius: 8px;
    box-shadow: 0 5px 15px rgba(0,0,0,0.3);
    animation: slideInRight 0.3s ease;
    max-width: 350px;
    font-size: 0.95rem;
    font-weight: 500;
    cursor: pointer;
  `;
  
  // Icon styling
  const iconSpan = toast.querySelector('.toast-icon');
  iconSpan.style.cssText = `
    font-size: 1.2rem;
    font-weight: bold;
  `;
  
  // Close on click
  toast.addEventListener('click', () => {
    removeToast(toast);
  });
  
  container.appendChild(toast);
  
  // Auto remove
  const timeoutId = setTimeout(() => {
    removeToast(toast);
  }, duration);
  
  // Store timeout ID to clear if manually closed
  toast.dataset.timeoutId = timeoutId;
  
  return toast;
}

function removeToast(toast) {
  if (toast.dataset.timeoutId) {
    clearTimeout(parseInt(toast.dataset.timeoutId));
  }
  
  toast.style.animation = 'slideOutRight 0.3s ease';
  setTimeout(() => {
    if (toast.parentNode) {
      toast.remove();
    }
  }, 300);
}

// Add required CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(100px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes slideOutRight {
    from {
      opacity: 1;
      transform: translateX(0);
    }
    to {
      opacity: 0;
      transform: translateX(100px);
    }
  }
  
  .toast:hover {
    transform: translateX(-5px);
    transition: transform 0.2s ease;
  }
  
  @media (max-width: 600px) {
    #toast-container {
      right: 10px;
      left: 10px;
      top: 10px;
    }
    
    .toast {
      max-width: 100% !important;
    }
  }
`;

if (!document.getElementById('toast-styles')) {
  style.id = 'toast-styles';
  document.head.appendChild(style);
}

export { showToast };