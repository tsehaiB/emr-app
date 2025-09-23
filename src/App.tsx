import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import PatientDashboard from "./pages/PatientDashboard";
import AdminDashboard from "./pages/admin/Dashboard";
import NewPatient from "./pages/admin/NewPatient";
import PatientDetails from "./pages/admin/PatientDetails";
import SeedData from "./pages/SeedData";
import AdminLayout from "@/components/layout/AdminLayout";
import PatientLayout from "@/components/layout/PatientLayout";
import AllAppointments from "@/pages/patient/AllAppointments";
import AllPrescriptions from "@/pages/patient/AllPrescriptions";

const queryClient = new QueryClient();

const ProtectedRoute = ({ session }: { session: Session | null }) => {
  if (!session) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
};

const App = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={!session ? <Login /> : <Navigate to="/portal" />} />
            
            {/* Admin Routes - Publicly Accessible */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="new-patient" element={<NewPatient />} />
              <Route path="patient/:id" element={<PatientDetails />} />
            </Route>

            {/* Patient Portal Routes - Protected */}
            <Route element={<ProtectedRoute session={session} />}>
              <Route path="/portal" element={<PatientLayout />}>
                <Route index element={<PatientDashboard />} />
                <Route path="appointments" element={<AllAppointments />} />
                <Route path="prescriptions" element={<AllPrescriptions />} />
              </Route>
            </Route>

            {/* Utility Routes */}
            <Route path="/seed" element={<SeedData />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;