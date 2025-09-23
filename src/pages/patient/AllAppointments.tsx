import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { format, addMonths, isBefore, isAfter } from "date-fns";
import { ArrowLeft } from "lucide-react";

type Appointment = { id: number; provider: string; datetime: string; repeat: string | null };

const AllAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
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

    try {
      const { data, error: fetchError } = await supabase
        .from("appointments")
        .select("*")
        .eq("patient_id", session.user.id)
        .order("datetime", { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      const now = new Date();
      const threeMonthsFromNow = addMonths(now, 3);
      
      const filteredAppointments = (data || []).filter(appointment => {
        const appointmentDate = new Date(appointment.datetime);
        return isAfter(appointmentDate, now) && isBefore(appointmentDate, threeMonthsFromNow);
      });
      setAppointments(filteredAppointments);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <p>Loading appointments...</p>;
  }

  if (error) {
    return <p className="text-red-600">Error: {error}</p>;
  }

  return (
    <div className="space-y-4">
      <Button asChild variant="outline">
        <Link to="/portal">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>All Upcoming Appointments (Next 3 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          {appointments.length > 0 ? (
            <ul className="divide-y">
              {appointments.map((appt) => (
                <li key={appt.id} className="py-3">
                  <p className="font-semibold">Provider: {appt.provider}</p>
                  <p className="text-sm text-gray-600">When: {format(new Date(appt.datetime), "PPP p")}</p>
                  {appt.repeat && <p className="text-sm text-gray-600">Repeat: {appt.repeat}</p>}
                </li>
              ))}
            </ul>
          ) : (
            <p>You have no upcoming appointments in the next 3 months.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AllAppointments;