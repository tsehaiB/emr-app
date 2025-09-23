import { useParams } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Appointments } from "@/components/admin/Appointments";
import { Prescriptions } from "@/components/admin/Prescriptions";

type Profile = { id: string; name: string | null; email: string | null };
type Appointment = { id: number; provider: string; datetime: string; repeat: string | null };
type Prescription = { id: number; medication: string; dosage: string; quantity: number; refill_on: string; refill_schedule: string | null };

const PatientDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);

    try {
      const [profileRes, appointmentsRes, prescriptionsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", id).single(),
        supabase.from("appointments").select("*").eq("patient_id", id).order("datetime", { ascending: false }),
        supabase.from("prescriptions").select("*").eq("patient_id", id).order("created_at", { ascending: false }),
      ]);

      if (profileRes.error) throw profileRes.error;
      setProfile(profileRes.data);

      if (appointmentsRes.error) throw appointmentsRes.error;
      setAppointments(appointmentsRes.data || []);

      if (prescriptionsRes.error) throw prescriptionsRes.error;
      setPrescriptions(prescriptionsRes.data || []);
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <div>Loading patient details...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!profile) {
    return <div>Patient not found.</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Patient Details</h1>

      <Card>
        <CardHeader>
          <CardTitle>{profile.name || "N/A"}</CardTitle>
        </CardHeader>
        <CardContent>
          <p><strong>Email:</strong> {profile.email || "N/A"}</p>
        </CardContent>
      </Card>

      <Appointments
        patientId={profile.id}
        appointments={appointments}
        onAppointmentAdded={(newAppt) => setAppointments((prev) => [newAppt, ...prev])}
      />

      <Prescriptions
        patientId={profile.id}
        prescriptions={prescriptions}
        onPrescriptionAdded={(newRx) => setPrescriptions((prev) => [newRx, ...prev])}
      />
    </div>
  );
};

export default PatientDetails;