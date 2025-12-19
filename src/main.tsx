
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { setupActivityLogsTable } from './lib/dbSetup';

// Run setup functions on app start
setupActivityLogsTable().then(success => {
  if (success) {
    console.log('Activity logs table setup completed');
  } else {
    console.warn('Activity logs table setup failed, some features may not work');
  }
}).catch(error => {
  console.error('Error during activity logs setup:', error);
  console.warn('Activity logs table setup failed, some features may not work');
});

createRoot(document.getElementById("root")!).render(<App />);
