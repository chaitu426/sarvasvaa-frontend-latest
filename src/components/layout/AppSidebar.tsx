import { useState } from "react";
import {
  BarChart3,
  Milk,
  Package,
  Factory,
  Archive,
  ShoppingCart,
  FileText,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import logo from "/image.png";

const navigationItems = [
  { title: "Dashboard", url: "/", icon: BarChart3 },
  { title: "Milk Collections", url: "/milk-collections", icon: Milk },
  { title: "Products", url: "/products", icon: Package },
  { title: "Productions", url: "/productions", icon: Factory },
  { title: "Stocks", url: "/stocks", icon: Archive },
  { title: "Sales", url: "/sales", icon: ShoppingCart },
  { title: "Reports", url: "/reports", icon: FileText },
  {title: "DownloadReports", url: "/reportpage", icon: FileText },
  {title: "SQLAgent", url: "/ai", icon: FileText }
];

export function AppSidebar() {
  const { logout } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;
  const [isOpen, setIsOpen] = useState(false);

  const isActiveRoute = (path: string) => {
    return path === "/" ? currentPath === "/" : currentPath.startsWith(path);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Menu className="w-6 h-6" />
        </Button>
      </div>

      {/* Overlay for mobile drawer */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* Mobile Drawer Sidebar */}
      <div
        className={`fixed z-50 top-0 left-0 h-full w-64 bg-card border-r border-border transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:hidden`}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <img src={logo} alt="Logo" className="h-12" />
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        <div className="p-4 space-y-1">
          {navigationItems.map((item) => (
            <NavLink
              key={item.title}
              to={item.url}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActiveRoute(item.url)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
            </NavLink>
          ))}
        </div>

        <div className="mt-auto p-4 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <Sidebar className="w-64 border-r border-border bg-card hidden lg:flex">
        <SidebarHeader className="p-2 border-b border-border">
          <div className="flex items-center justify-center">
            <img src={logo} className="w-40 h-18" />
          </div>
        </SidebarHeader>

        <SidebarContent className="p-4">
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Main Navigation
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {navigationItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          isActiveRoute(item.url)
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent"
                        }`}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <div className="mt-auto pt-4 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </SidebarContent>
      </Sidebar>
    </>
  );
}
