import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Download, Clock, BookOpen, AlertCircle } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: number;
  type: 'Exam' | 'Class' | 'Deadline' | 'Other';
  class?: string;
}

export function ScheduleCalendarSection({ selectedClass }: { selectedClass: string }) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // For now, let's fetch all events and filter by class or global (no class)
    // You could also create the CalendarEvents collection if it doesn't exist
    const q = query(collection(db, 'CalendarEvents'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allEvents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CalendarEvent));
      
      // If we don't have real data yet, we can show some mock data
      const displayEvents = allEvents.length > 0 ? allEvents : [
        { id: '1', title: 'Mid-term Mathematics Exam', description: 'Covers chapters 1-5.', date: Date.now() + 86400000 * 3, type: 'Exam', class: selectedClass },
        { id: '2', title: 'Science Project Submission', description: 'Submit the physical model to the lab.', date: Date.now() + 86400000 * 5, type: 'Deadline', class: selectedClass },
        { id: '3', title: 'Special Doubt Clearing Class', description: 'Open session for all students.', date: Date.now() + 86400000 * 1, type: 'Class', class: selectedClass }
      ] as CalendarEvent[];
      
      const filteredEvents = displayEvents.filter(e => !e.class || e.class === selectedClass || e.class === 'All');
      filteredEvents.sort((a, b) => a.date - b.date);
      setEvents(filteredEvents);
      setLoading(false);
    }, (error) => {
      console.warn("Error fetching events:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedClass]);

  const generateICS = (event: CalendarEvent) => {
    const startDate = new Date(event.date);
    const endDate = new Date(event.date + 60 * 60 * 1000); // 1 hour duration default
    
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/-|:|\.\\d+/g, '');
    };

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Margdarshan Institute//EN',
      'BEGIN:VEVENT',
      `UID:${event.id}@margdarshan.com`,
      `DTSTAMP:${formatDate(new Date())}`,
      `DTSTART:${formatDate(startDate)}`,
      `DTEND:${formatDate(endDate)}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${event.title.replace(/\\s+/g, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getEventIcon = (type: string) => {
    switch(type) {
      case 'Exam': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'Deadline': return <Clock className="w-5 h-5 text-orange-500" />;
      default: return <BookOpen className="w-5 h-5 text-emerald-500" />;
    }
  };

  const getEventColor = (type: string) => {
    switch(type) {
      case 'Exam': return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
      case 'Deadline': return 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800';
      default: return 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
          <CalendarIcon className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Class & Exam Schedule</h2>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-6">
          {events.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-center py-8">No upcoming events scheduled.</p>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <div 
                  key={event.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border ${getEventColor(event.type)} transition-colors`}
                >
                  <div className="flex items-start gap-4 mb-4 sm:mb-0">
                    <div className="mt-1">
                      {getEventIcon(event.type)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-white">{event.title}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{event.description}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                        <span className="px-2 py-1 bg-white/60 dark:bg-slate-800/60 rounded-md">
                          {new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                        <span className="px-2 py-1 bg-white/60 dark:bg-slate-800/60 rounded-md">
                          {new Date(event.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => generateICS(event)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 text-sm font-medium transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Sync to Calendar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
