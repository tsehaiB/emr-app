import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, addDays, isWithinInterval, isAfter } from "date-fns";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

type Appointment = { id: number; provider: string; datetime: string; repeat: string | null };
type Prescription = { id: number; medication: string; dosage: string; quantity: number; refill_on: string; refill_schedule: string | null };
type Profile = { name: string | null; email: string | null };

const PatientDashboard = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [upcomingRefills, setUpcomingRefills] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setLoading(false);
      return;
    }
    const userId = session.user.id;

    try {
      const [profileRes, appointmentsRes, prescriptionsRes] = await Promise.all([
        supabase.from("profiles").select("name, email").eq("id", userId).single(),
        supabase.from("appointments").select("*").eq("patient_id", userId).order("datetime", { ascending: true }),
        supabase.from("prescriptions").select("*").eq("patient_id", userId).order("refill_on", { ascending: true }),
      ]);

      if (profileRes.error) throw profileRes.error;
      setProfile(profileRes.data);

      if (appointmentsRes.error) throw appointmentsRes.error;
      if (prescriptionsRes.error) throw prescriptionsRes.error;

      const now = new Date();
      const sevenDaysFromNow = addDays(now, 7);
      
      const filteredAppointments = (appointmentsRes.data || []).filter(appt => {
        const apptDate = new Date(appt.datetime);
        return isAfter(apptDate, now) && isWithinInterval(apptDate, { start: now, end: sevenDaysFromNow });
      });
      setUpcomingAppointments(filteredAppointments);

      const filteredPrescriptions = (prescriptionsRes.data || []).filter(rx => {
        const refillDate = new Date(rx.refill_on);
        return isAfter(refillDate, now) && isWithinInterval(refillDate, { start: now, end: sevenDaysFromNow });
      });
      setUpcomingRefills(filteredPrescriptions);

    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <div className="text-center p-8">Loading your dashboard...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard Summary</h1>
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Name:</strong> {profile?.name || "N/A"}</p>
            <p><strong>Email:</strong> {profile?.email || "N/A"}</p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Upcoming in the Next 7 Days</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Appointments</h3>
              {upcomingAppointments.length > 0 ? (
                <ul className="divide-y">
                  {upcomingAppointments.map((appt) => (
                    <li key={appt.id} className="py-2">
                      <p><strong>Provider:</strong> {appt.provider}</p>
                      <p className="text-sm text-gray-600"><strong>When:</strong> {format(new Date(appt.datetime), "PPP p")}</p>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-gray-500">No appointments in the next 7 days.</p>}
               <Button variant="link" asChild className="p-0 h-auto mt-2">
                  <Link to="/portal/appointments">View All Appointments <ArrowRight className="ml-1 h-4 w-4" /></Link>
               </Button>
            </div>
            <hr/>
            <div>
              <h3 className="font-semibold mb-2">Medication Refills</h3>
              {upcomingRefills.length > 0 ? (
                <ul className="divide-y">
                  {upcomingRefills.map((rx) => (
                    <li key={rx.id} className="py-2">
                      <p><strong>Medication:</strong> {rx.medication} ({rx.dosage})</p>
                      <p className="text-sm text-gray-600"><strong>Refill on:</strong> {format(new Date(rx.refill_on), "PPP")}</p>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-gray-500">No refills due in the next 7 days.</p>}
              <Button variant="link" asChild className="p-0 h-auto mt-2">
                  <Link to="/portal/prescriptions">View All Prescriptions <ArrowRight className="ml-1 h-4 w-4" /></Link>
               </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PatientDashboard;