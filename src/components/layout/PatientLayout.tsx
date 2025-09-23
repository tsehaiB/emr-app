"use client";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { LayoutDashboard, Pill, Calendar, LogOut } from "lucide-react";

const PatientLayout = () => {
  const navigate = useNavigate();
  const [profileName, setProfileName] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data, error } = await supabase
          .from("profiles")
          .select("name")
          .eq("id", session.user.id)
          .single();
        if (data) {
          setProfileName(data.name);
        }
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Patient Portal</h1>
            {profileName && <p className="text-sm text-gray-600">Welcome, {profileName}</p>}
          </div>
          <div className="flex items-center gap-4">
             <nav className="hidden md:flex items-center gap-2">
                <Button variant="ghost" asChild>
                    <Link to="/portal"><LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard</Link>
                </Button>
                <Button variant="ghost" asChild>
                    <Link to="/portal/appointments"><Calendar className="mr-2 h-4 w-4" /> Appointments</Link>
                </Button>
                <Button variant="ghost" asChild>
                    <Link to="/portal/prescriptions"><Pill className="mr-2 h-4 w-4" /> Prescriptions</Link>
                </Button>
             </nav>
            <Button onClick={handleLogout} variant="outline">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto p-4 lg:p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default PatientLayout;