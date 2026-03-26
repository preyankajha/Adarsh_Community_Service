import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/professional.css'
import App from './App.jsx'
import Swal from 'sweetalert2'

window.alert = (message) => {
  const msgLower = message?.toString().toLowerCase() || '';
  let iconType = 'info';
  if (msgLower.includes('success')) iconType = 'success';
  else if (msgLower.includes('fail') || msgLower.includes('error')) iconType = 'error';
  else if (msgLower.includes('warning') || msgLower.includes('required')) iconType = 'warning';

  Swal.fire({
    text: message,
    icon: iconType,
    confirmButtonColor: '#D87C1D', // Matching the Samiti brand color for buttons
    background: '#ffffff',
    backdrop: `rgba(0,0,0,0.5)`,
    customClass: {
      popup: 'swal2-custom-popup'
    }
  });
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
