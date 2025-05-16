
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
});

// Execute the SQL from dbSetup.sql if needed
const executeSqlSetup = async () => {
  try {
    const response = await fetch('/api/setup-sql', {
      method: 'POST'
    });
    if (!response.ok) {
      console.warn('Failed to execute SQL setup, some features may not work');
    }
  } catch (error) {
    console.warn('Failed to execute SQL setup:', error);
  }
};

// Don't block app startup
executeSqlSetup().catch(console.error);

createRoot(document.getElementById("root")!).render(<App />);
