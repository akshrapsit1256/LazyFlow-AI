import React, { useState } from 'react';
import { AIStatusProvider } from './context/AIStatusContext';
import { ToastProvider } from './context/ToastContext';
import { Sidebar } from './components/Sidebar';
import { TopNavbar } from './components/TopNavbar';
import { AIStatusBar } from './components/AIStatusBar';

import { OverviewPage } from './pages/OverviewPage';
import { SummarizerPage } from './pages/SummarizerPage';
import { TaskGeneratorPage } from './pages/TaskGeneratorPage';
import { EmailAssistantPage } from './pages/EmailAssistantPage';
import { FileOrganizerPage } from './pages/FileOrganizerPage';
import { DailyBriefingPage } from './pages/DailyBriefingPage';
import { SettingsPage } from './pages/SettingsPage';

function DashboardContent() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar navigation */}
      <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Navbar */}
        <TopNavbar activeTab={activeTab} onSelectTab={setActiveTab} />

        {/* AI Offline Status Alert Banner */}
        <AIStatusBar />

        {/* Active Page Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {activeTab === 'overview' && <OverviewPage onNavigate={setActiveTab} />}
          {activeTab === 'summarizer' && <SummarizerPage />}
          {activeTab === 'tasks' && <TaskGeneratorPage />}
          {activeTab === 'emails' && <EmailAssistantPage />}
          {activeTab === 'files' && <FileOrganizerPage />}
          {activeTab === 'briefing' && <DailyBriefingPage />}
          {activeTab === 'settings' && <SettingsPage />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AIStatusProvider>
      <ToastProvider>
        <DashboardContent />
      </ToastProvider>
    </AIStatusProvider>
  );
}
