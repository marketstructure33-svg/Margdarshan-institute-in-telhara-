import { LiveWhiteboardSection } from './sections/LiveWhiteboardSection';
import { useState } from 'react';
import { User } from 'firebase/auth';
import HomeSection from './sections/HomeSection';
import PdfSection from './sections/PdfSection';
import NotesSection from './sections/NotesSection';
import NoticeSection from './sections/NoticeSection';
import AIChatSection from './sections/AIChatSection';
import AdminChatSection from './sections/AdminChatSection';
import ProfileSection from './sections/ProfileSection';
import AIStudyPlannerSection from './sections/AIStudyPlannerSection';
import { AnalyticsSection } from './sections/AnalyticsSection';
import { AIQuizSection } from './sections/AIQuizSection';
import { LiveTutorSection } from './sections/LiveTutorSection';
import { ScheduleCalendarSection } from './sections/ScheduleCalendarSection';
import { VideoSection } from './sections/VideoSection';
import { BookmarksSection } from './sections/BookmarksSection';

interface UserPanelProps {
  user: User;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  setIsAdminAuthorized: (val: boolean) => void;
  setCurrentView: (view: 'user' | 'admin') => void;
}

export default function UserPanel({ user, activeTab, setActiveTab, setIsAdminAuthorized, setCurrentView }: UserPanelProps) {
  const [selectedClass, setSelectedClass] = useState('Class 10');
  const [selectedSubject, setSelectedSubject] = useState('Mathematics');

  return (
    <div className="w-full relative min-h-[calc(100vh-16rem)] flex flex-col">
      <div className="flex-1">
        {activeTab === 'home' && (
          <HomeSection 
            user={user} 
            selectedClass={selectedClass}
            setSelectedClass={setSelectedClass}
            selectedSubject={selectedSubject}
            setSelectedSubject={setSelectedSubject}
            setActiveTab={setActiveTab}
            setIsAdminAuthorized={setIsAdminAuthorized}
            setCurrentView={setCurrentView}
          />
        )}
        
        {activeTab === 'pdf' && (
          <PdfSection 
            user={user}
            selectedClass={selectedClass} 
            selectedSubject={selectedSubject} 
          />
        )}
        
        {activeTab === 'video' && (
          <VideoSection 
            user={user}
            selectedClass={selectedClass} 
            selectedSubject={selectedSubject} 
          />
        )}
        {activeTab === 'bookmarks' && (
          <BookmarksSection 
            user={user}
            setActiveTab={setActiveTab}
          />
        )}
        {activeTab === 'notes' && (
          <NotesSection 
            user={user}
            selectedClass={selectedClass} 
            selectedSubject={selectedSubject} 
          />
        )}

        {activeTab === 'planner' && (
          <AIStudyPlannerSection 
            selectedClass={selectedClass} 
            selectedSubject={selectedSubject} 
          />
        )}
        
        {activeTab === 'notice' && (
          <NoticeSection user={user} />
        )}

        {activeTab === 'ai_chat' && (
          <AIChatSection user={user} onBack={() => setActiveTab('home')} />
        )}
        
        {activeTab === 'admin_chat' && (
          <AdminChatSection user={user} />
        )}
        
        {activeTab === 'livetutor' && (
          <LiveTutorSection />
        )}
        
        {activeTab === 'quiz' && (
          <AIQuizSection selectedClass={selectedClass} selectedSubject={selectedSubject} />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsSection />
        )}

        {activeTab === 'schedule' && (
          <ScheduleCalendarSection selectedClass={selectedClass} />
        )}

        
        {activeTab === 'whiteboard' && (
          <LiveWhiteboardSection />
        )}
        {activeTab === 'profile' && (
          <ProfileSection user={user} />
        )}
      </div>
    </div>
  );
}
