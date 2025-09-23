"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const formSchema = z.object({
  provider: z.string().min(2, "Provider is required."),
  datetime: z.string().min(1, "Date and time are required."),
  repeat: z.string().optional(),
});

type Appointment = {
  id: number;
  provider: string;
  datetime: string;
  repeat: string | null;
};

type AppointmentsProps = {
  patientId: string;
  appointments: Appointment[];
  onAppointmentAdded: (newAppointment: Appointment) => void;
};

export const Appointments = ({ patientId, appointments, onAppointmentAdded }: AppointmentsProps) => {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { provider: "", datetime: "", repeat: "" },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const { data, error } = await supabase
      .from("appointments")
      .insert([{ ...values, patient_id: patientId }])
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Appointment added." });
      onAppointmentAdded(data as Appointment);
      form.reset();
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appointments</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {appointments.length > 0 ? (
            <ul className="divide-y">
              {appointments.map((appt) => (
                <li key={appt.id} className="py-2">
                  <p><strong>Provider:</strong> {appt.provider}</p>
                  <p><strong>When:</strong> {format(new Date(appt.datetime), "PPP p")}</p>
                  {appt.repeat && <p><strong>Repeat:</strong> {appt.repeat}</p>}
                </li>
              ))}
            </ul>
          ) : (
            <p>No appointments scheduled.</p>
          )}
        </div>

        <hr className="my-6" />

        <h3 className="text-lg font-semibold mb-4">Add New Appointment</h3>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="provider" render={({ field }) => (
              <FormItem>
                <FormLabel>Provider</FormLabel>
                <FormControl><Input placeholder="Dr. Smith" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="datetime" render={({ field }) => (
              <FormItem>
                <FormLabel>Date & Time</FormLabel>
                <FormControl><Input type="datetime-local" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="repeat" render={({ field }) => (
              <FormItem>
                <FormLabel>Repeat Schedule (Optional)</FormLabel>
                <FormControl><Input placeholder="e.g., Every 6 months" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <Button type="submit">Add Appointment</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};