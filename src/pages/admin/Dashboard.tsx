import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "react-router-dom";

type Profile = {
  id: string;
  name: string | null;
  email: string | null;
};

const AdminDashboard = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfiles = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, email");

      if (error) {
        setError(error.message);
        console.error("Error fetching profiles:", error);
      } else {
        setProfiles(data || []);
      }
      setLoading(false);
    };

    fetchProfiles();
  }, []);

  if (loading) {
    return <div>Loading patients...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Patients</h1>
      
      <div className="border rounded-lg bg-card text-card-foreground shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles.length > 0 ? (
              profiles.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell>{profile.name || "N/A"}</TableCell>
                  <TableCell>{profile.email || "N/A"}</TableCell>
                  <TableCell>
                    <Button variant="outline" asChild>
                      <Link to={`/admin/patient/${profile.id}`}>View Details</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center">
                  No patients found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminDashboard;