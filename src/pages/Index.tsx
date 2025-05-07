
import React from 'react';
import LoginForm from '@/components/LoginForm';

const Index: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-guardian-purple to-guardian-purple/90 p-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-guardian-yellow mb-2">RoomGuardian</h1>
        <p className="text-white text-lg">Room Reservation and Monitoring System</p>
      </div>
      <LoginForm />
    </div>
  );
};

export default Index;
