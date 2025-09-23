import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";

type Prescription = { id: number; medication: string; dosage: string; quantity: number; refill_on: string; refill_schedule: string | null };

const AllPrescriptions = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
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
        .from("prescriptions")
        .select("*")
        .eq("patient_id", session.user.id)
        .order("refill_on", { ascending: true });

      if (fetchError) {
        throw fetchError;
      }
      setPrescriptions(data || []);

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
    return <p>Loading prescriptions...</p>;
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
          <CardTitle>All Your Prescriptions</CardTitle>
        </CardHeader>
        <CardContent>
          {prescriptions.length > 0 ? (
            <ul className="divide-y">
              {prescriptions.map((rx) => (
                <li key={rx.id} className="py-3">
                  <p className="font-semibold">{rx.medication} ({rx.dosage})</p>
                  <p className="text-sm text-gray-600">Quantity: {rx.quantity}</p>
                  <p className="text-sm text-gray-600">Next Refill: {format(new Date(rx.refill_on), "PPP")}</p>
                  {rx.refill_schedule && <p className="text-sm text-gray-600">Schedule: {rx.refill_schedule}</p>}
                </li>
              ))}
            </ul>
          ) : (
            <p>You have no active prescriptions.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AllPrescriptions;