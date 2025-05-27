import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function BrowseProfilesPage() {
  const [usernames, setUsernames] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchUsernames = () => {
    setLoading(true);
    fetch('/api/users/profiles')
      .then((res) => res.json())
      .then((data) => setUsernames(data.usernames))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsernames();
  }, []);

  return (
    <SidebarProvider className="flex flex-row min-h-screen">
      <AppSidebar />
      <main className="flex flex-col h-screen w-full">
        <div className="w-full flex items-center justify-between p-4">
          <SidebarTrigger />
          <ModeToggle />
        </div>
        <div className="flex-1 p-4 overflow-y-auto">
          <h1 className="text-2xl font-semibold mb-4">Browse Public Profiles</h1>

          <div className="mt-4">
            <h2 className="text-lg font-semibold mb-2">All Users</h2>
            <div className="grid grid-cols-2 gap-2">
              {usernames.map((username) => (
                <div key={username} className="flex items-center justify-between border p-2 rounded">
                  <span>{username}</span>
                  <Button variant="outline" onClick={() => navigate(`/profile/${username}`)}>
                    Check Profile
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {loading && <p className="mt-4">Loading...</p>}
        </div>
      </main>
    </SidebarProvider>
  );
}