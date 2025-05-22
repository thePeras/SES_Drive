import { AppSidebar } from '@/components/app-sidebar';
import ModeToggle from '@/components/mode-toggle';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export default function ProfilePreviewPage() {
  const { username } = useParams();
  const [error, setError] = useState('');
  const [iframeLoaded, setIframeLoaded] = useState(false);

  useEffect(() => {
    document.title = `Profile Preview - ${username ?? 'Unknown User'}`;
  }, [username]);

  const handleIframeError = () => {
    setError("Failed to load profile page. Make sure the user has uploaded a valid HTML file.");
  };

  if (!username) {
    return (
      <SidebarProvider className="flex flex-row min-h-screen">
        <AppSidebar />
        <div className="flex-1 p-6">
          <p className="text-red-500">No username provided in URL.</p>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider className="flex flex-row min-h-screen">
      <AppSidebar />
      <div className="flex-1 p-6 flex flex-col h-screen overflow-hidden">
        <div className="w-full flex items-center justify-between p-4">
          <SidebarTrigger />
          <ModeToggle />
        </div>
        <h1 className="text-2xl font-semibold mb-4">{username}'s Profile Page</h1>

        {error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <div className="relative flex-1 border rounded-md shadow overflow-hidden">
            {!iframeLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
            )}
            <iframe
              src={`/api/files/profile/render/${username}`}
              className="w-full h-full"
              title={`Profile Preview of ${username}`}
              onLoad={() => setIframeLoaded(true)}
              onError={handleIframeError}
              sandbox=''
            />
          </div>
        )}
      </div>
    </SidebarProvider>
  );
}
