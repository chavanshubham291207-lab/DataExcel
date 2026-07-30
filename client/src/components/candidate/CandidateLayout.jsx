import React from 'react';
import { Outlet } from 'react-router-dom';
import CandidateSidebar from './CandidateSidebar';
import CandidateNavbar from './CandidateNavbar';
import AIFloatingButton from '../ai/AIFloatingButton';
import { ProtectedCandidateRoute } from '../ProtectedRoute';

const CandidateLayout = ({ children }) => {
  return (
    <ProtectedCandidateRoute>
      <div className="flex min-h-screen" style={{ background: '#090909' }}>
        <CandidateSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <CandidateNavbar />
          <main className="flex-1 overflow-y-auto">
            {children || <Outlet />}
          </main>
        </div>
        <AIFloatingButton />
      </div>
    </ProtectedCandidateRoute>
  );
};

export default CandidateLayout;
