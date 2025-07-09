import React from 'react';

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
}

const PageLayout: React.FC<PageLayoutProps> = ({ children, className = '' }) => {
  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 pt-16 pb-16 md:pb-8 ${className}`}>
      {children}
    </div>
  );
};

export default PageLayout;
