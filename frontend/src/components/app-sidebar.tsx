import { Home, User, Network } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import Logo from "./ui/logo";
import { Link, useNavigate } from "react-router-dom";

export function AppSidebar() {
  const navigate = useNavigate();
  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;
  const username = user?.name;

  const items = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
    },
    {
      title: "Profile",
      url: username ? `/profile/${username}` : "/profile",
      icon: User,
    },
    {
      title: "Users Network",
      url: "/network",
      icon: Network,
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <Sidebar>
      <SidebarContent className="flex flex-col h-full justify-between">
        <div>
          <SidebarHeader className="flex justify-center py-6">
            <Logo className="text-primary h-12" />
          </SidebarHeader>

          <SidebarGroupContent>
            <SidebarMenu className="flex flex-col items-center gap-4">
              {items.map((item) => (
                <SidebarMenuItem key={item.title} className="w-full px-4">
                  <SidebarMenuButton asChild className="w-full justify-start">
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="w-5 h-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </div>

        <SidebarFooter className="p-4">
          <Button variant="outline" onClick={handleLogout} className="w-full">
            Logout
          </Button>
        </SidebarFooter>
      </SidebarContent>
    </Sidebar>
  );
}