"use client";

import { useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, LayoutDashboard, LogOut, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const AdminSidebarNav = ({ onLinkClick }: { onLinkClick?: () => void }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleLinkClick = (path: string) => {
    navigate(path);
    if (onLinkClick) {
      onLinkClick();
    }
  };

  return (
    <nav className="flex flex-col h-full text-sm font-medium">
      <div className="flex-grow space-y-1">
        <Button variant="ghost" className="w-full justify-start" onClick={() => handleLinkClick("/admin")}>
          <LayoutDashboard className="mr-2 h-4 w-4" />
          Dashboard
        </Button>
        <Button variant="ghost" className="w-full justify-start" onClick={() => handleLinkClick("/admin/new-patient")}>
          <UserPlus className="mr-2 h-4 w-4" />
          New Patient
        </Button>
      </div>
      <div className="mt-auto">
        <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </nav>
  );
};

const AdminLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link to="/admin" className="flex items-center gap-2 font-semibold">
              <span className="">EMR Admin</span>
            </Link>
          </div>
          <div className="flex-1 p-2">
            <AdminSidebarNav />
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6 md:hidden">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0">
              <div className="flex h-14 items-center border-b px-4">
                 <Link to="/admin" className="flex items-center gap-2 font-semibold" onClick={() => setMobileMenuOpen(false)}>
                    <span className="">EMR Admin</span>
                 </Link>
              </div>
              <div className="flex-1 p-2">
                <AdminSidebarNav onLinkClick={() => setMobileMenuOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1">
            <h1 className="font-semibold text-lg">EMR Admin</h1>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-gray-50/50 dark:bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;