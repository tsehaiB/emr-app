import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const seedData = {
  users: [
    {
      name: "Mark Johnson",
      email: "mark@some-email-provider.net",
      password: "Password123!",
      appointments: [
        { provider: "Dr Kim West", datetime: "2025-09-16T16:30:00.000-07:00", repeat: "weekly" },
        { provider: "Dr Lin James", datetime: "2025-09-19T18:30:00.000-07:00", repeat: "monthly" }
      ],
      prescriptions: [
        { medication: "Lexapro", dosage: "5mg", quantity: 2, refill_on: "2025-10-05", refill_schedule: "monthly" },
        { medication: "Ozempic", dosage: "1mg", quantity: 1, refill_on: "2025-10-10", refill_schedule: "monthly" }
      ]
    },
    {
      name: "Lisa Smith",
      email: "lisa@some-email-provider.net",
      password: "Password123!",
      appointments: [
        { provider: "Dr Sally Field", datetime: "2025-09-22T18:15:00.000-07:00", repeat: "monthly" },
        { provider: "Dr Lin James", datetime: "2025-09-25T20:00:00.000-07:00", repeat: "weekly" }
      ],
      prescriptions: [
        { medication: "Metformin", dosage: "500mg", quantity: 2, refill_on: "2025-10-15", refill_schedule: "monthly" },
        { medication: "Diovan", dosage: "100mg", quantity: 1, refill_on: "2025-10-25", refill_schedule: "monthly" }
      ]
    }
  ]
};

const SeedData = () => {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const { toast } = useToast();

  const addLog = (message: string) => {
    setLogs(prevLogs => [...prevLogs, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const handleSeedData = async () => {
    setLoading(true);
    setLogs([]);
    addLog("Seeding process started...");

    try {
      // Step 1: Reset existing seed data by calling the edge function
      addLog("Attempting to reset previous seed data...");
      const seedEmails = seedData.users.map(u => u.email);
      
      const { data: resetData, error: resetError } = await supabase.functions.invoke('reset-seed-data', {
        body: { emails: seedEmails },
      });

      if (resetError) {
        throw new Error(`Edge function error: ${resetError.message}`);
      }
      
      if (resetData.logs) {
        resetData.logs.forEach((log: string) => addLog(`[RESET] ${log}`));
      }
      addLog("Reset step completed.");

      // Step 2: Create new seed data
      addLog("Creating new seed data...");
      for (const user of seedData.users) {
        addLog(`Processing user: ${user.name} (${user.email})`);

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: user.email,
          password: user.password,
          options: {
            data: { name: user.name },
          },
        });

        if (signUpError) {
          if (signUpError.message.includes("User already registered")) {
             addLog(`WARN: User ${user.email} already exists. Skipping creation.`);
             continue;
          }
          throw new Error(`Error signing up ${user.name}: ${signUpError.message}`);
        }
        if (!signUpData.user) {
          throw new Error(`User object not returned for ${user.name} after sign up.`);
        }
        addLog(`Successfully created user account for ${user.name}.`);
        
        const userId = signUpData.user.id;

        addLog(`Adding appointments...`);
        const appointmentsToInsert = user.appointments.map(appt => ({ ...appt, patient_id: userId }));
        const { error: apptError } = await supabase.from("appointments").insert(appointmentsToInsert);
        if (apptError) throw new Error(`Error adding appointments for ${user.name}: ${apptError.message}`);
        
        addLog(`Adding prescriptions...`);
        const prescriptionsToInsert = user.prescriptions.map(rx => ({ ...rx, patient_id: userId }));
        const { error: rxError } = await supabase.from("prescriptions").insert(prescriptionsToInsert);
        if (rxError) throw new Error(`Error adding prescriptions for ${user.name}: ${rxError.message}`);
        
        addLog(`--- Finished processing ${user.name} ---`);
      }

      addLog("Signing out to clear session...");
      await supabase.auth.signOut();
      addLog("Seeding process completed successfully!");
      toast({ title: "Seeding complete!", description: "Database has been reset and seeded." });

    } catch (error: any) {
      addLog(`ERROR: ${error.message}`);
      toast({ title: "Seeding failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 flex justify-center items-center min-h-screen">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Seed Database</CardTitle>
          <CardDescription>
            Click the button to reset and populate the database with sample patient data. This process is safe to run multiple times.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-4">
            <Button onClick={handleSeedData} disabled={loading}>
              {loading ? "Processing..." : "Reset and Seed Database"}
            </Button>
          </div>
          
          {logs.length > 0 && (
            <div className="mt-6 p-4 border rounded-md bg-gray-50/50 dark:bg-gray-900/50 max-h-96 overflow-y-auto">
              <h3 className="font-bold text-lg mb-2">Process Log</h3>
              <pre className="text-sm whitespace-pre-wrap font-mono">
                {logs.join('\n')}
              </pre>
              {!loading && (
                 <Button variant="outline" asChild className="mt-4 w-full">
                    <Link to="/">Go to Login Page</Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SeedData;