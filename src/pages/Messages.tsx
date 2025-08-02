import React from 'react';
import PageLayout from '../components/PageLayout';
import DirectMessages from '../components/DirectMessages';

const Messages: React.FC = () => {
  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto h-[calc(100vh-8rem)]">
        <DirectMessages className="h-full" />
      </div>
    </PageLayout>
  );
};

export default Messages;