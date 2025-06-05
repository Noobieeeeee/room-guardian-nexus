
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import LoginForm from '@/components/LoginForm';
import DatabaseSetup from '@/components/DatabaseSetup';
import { Button } from '@/components/ui/button';

const Index: React.FC = () => {
  const [showSetup, setShowSetup] = useState(false);
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-guardian-purple to-guardian-purple-dark text-white">
      {/* Header */}
      <header className="p-4 sm:p-6">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-guardian-yellow rounded-md"></div>
            <h1 className="text-xl sm:text-2xl font-bold">RoomGuardian</h1>
          </div>
          
          {/* {!showSetup && (
            <Button 
              variant="link" 
              onClick={() => setShowSetup(true)}
              className="text-guardian-yellow hover:text-guardian-yellow/80"
            >
              Set Up Database
            </Button>
          )} */}
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="container mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
            <div className="flex flex-col justify-center space-y-4 sm:space-y-6">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
                Smarter Room Monitoring & Management
              </h2>
              <p className="text-lg sm:text-xl text-gray-200">
                Track room usage, manage scheduling, and monitor energy consumption in real-time with our advanced IoT-enabled platform.
              </p>
              {/* <div className="flex flex-wrap gap-3 sm:gap-4">
                <div className="bg-white/10 backdrop-blur-sm p-3 sm:p-4 rounded-lg">
                  <div className="font-semibold text-2xl sm:text-3xl">100%</div>
                  <div className="text-sm text-gray-300">Monitoring Accuracy</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm p-3 sm:p-4 rounded-lg">
                  <div className="font-semibold text-2xl sm:text-3xl">24/7</div>
                  <div className="text-sm text-gray-300">Real-Time Updates</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm p-3 sm:p-4 rounded-lg">
                  <div className="font-semibold text-2xl sm:text-3xl">15%</div>
                  <div className="text-sm text-gray-300">Energy Savings</div>
                </div>
              </div> */}
            </div>
            
            <div className="flex items-center justify-center">
              {showSetup ? (
                <DatabaseSetup onSetupComplete={() => setShowSetup(false)} />
              ) : (
                <LoginForm />
              )}
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="py-4 sm:py-6 bg-guardian-purple-dark/60 backdrop-blur-sm">
        <div className="container mx-auto text-center text-sm text-gray-300">
          &copy; {new Date().getFullYear()} RoomGuardian. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export default Index;
