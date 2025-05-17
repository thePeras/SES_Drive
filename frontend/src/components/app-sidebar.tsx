import { Home, User } from "lucide-react"

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
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import Logo from "./ui/logo"
import { useNavigate } from "react-router-dom"

const items = [
  {
    title: "Home",
    url: "#",
    icon: Home,
  },
  {
    title: "My page",
    url: "#",
    icon: User,
  },
]

export function AppSidebar() {
  const navigate = useNavigate()
  const handleLogout = () => {
      localStorage.removeItem('token')
      navigate('/')
  }

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarHeader>
            <Logo className="text-primary h-16 w-full" />
          </SidebarHeader>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
          <SidebarFooter>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </SidebarFooter>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
