import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { StudyMaterial } from '../../types';
import { Youtube, Loader2, PlayCircle, Clock, Bookmark } from 'lucide-react';
import { useBookmarks } from '../../hooks/useBookmarks';
import { recordRecentView } from '../../lib/tracking';
import { User } from 'firebase/auth';

interface VideoSectionProps {
  user?: User;
  selectedClass: string;
  selectedSubject: string;
}

export function VideoSection({ user, selectedClass, selectedSubject }: VideoSectionProps) {
  const [videos, setVideos] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<StudyMaterial | null>(null);
  const { bookmarks, toggleBookmark } = useBookmarks(user);

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, 'StudyMaterials'),
      where('class', '==', selectedClass),
      where('subject', '==', selectedSubject),
      where('type', '==', 'Video')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudyMaterial));
      results.sort((a, b) => b.uploadDate - a.uploadDate);
      setVideos(results);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedClass, selectedSubject]);

  const handleWatchVideo = (video: StudyMaterial) => {
    setActiveVideo(video);
    if (user) {
      recordRecentView(user.uid, {
        id: video.id,
        title: video.title,
        type: 'Video',
        fileUrl: video.fileUrl,
        class: video.class,
        subject: video.subject,
        uploadDate: video.uploadDate
      });
    }
  };

  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return '';
    try {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : url;
    } catch {
      return url;
    }
  };


  if (activeVideo) {
    return (
      <div className="w-full flex flex-col items-center animate-in fade-in zoom-in duration-300">
        <div className="w-full max-w-4xl bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-slate-800 dark:text-white line-clamp-1">{activeVideo.title}</h3>
            <button 
              onClick={() => setActiveVideo(null)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300 transition-colors"
            >
              Back to Videos
            </button>
          </div>
          <div className="relative w-full pb-[56.25%] bg-black">
            <iframe
              src={getYouTubeEmbedUrl(activeVideo.fileUrl || '')}
              className="absolute top-0 left-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
          {activeVideo.content && (
            <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
              <h4 className="font-bold text-sm text-slate-500 mb-2 uppercase tracking-wider">Description</h4>
              <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{activeVideo.content}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
            <Youtube className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
            Video Lectures <span className="text-slate-400 text-lg font-medium ml-2">({selectedClass} • {selectedSubject})</span>
          </h2>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 min-h-[400px]">
        {loading ? (
          <div className="flex justify-center items-center h-64 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-red-500" />
          </div>
        ) : videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
              <Youtube className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">No videos yet</h3>
            <p className="text-slate-500 max-w-sm">
              Your teachers haven't uploaded any video lectures for this subject yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map(video => (
              <div 
                key={video.id}
                onClick={() => handleWatchVideo(video)}
                className="group cursor-pointer bg-slate-50 dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-red-400 dark:hover:border-red-500 hover:shadow-lg transition-all duration-300"
              >
                <div className="aspect-video relative bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                  <img 
                    src={`https://img.youtube.com/vi/${getYouTubeEmbedUrl(video.fileUrl || '').split('/').pop()}/maxresdefault.jpg`}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${getYouTubeEmbedUrl(video.fileUrl || '').split('/').pop()}/hqdefault.jpg`;
                    }}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <PlayCircle className="w-16 h-16 text-white opacity-90 group-hover:scale-110 transition-transform" />
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-slate-800 dark:text-white line-clamp-2 mb-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                    {video.title}
                  </h3>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(video.uploadDate).toLocaleDateString()}
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleBookmark(video.id); }}
                      className={`p-1.5 rounded-md transition-colors ${bookmarks.includes(video.id) ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600'}`}
                    >
                      <Bookmark className={`w-4 h-4 ${bookmarks.includes(video.id) ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
