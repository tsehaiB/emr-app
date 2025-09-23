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
  medication: z.string().min(2, "Medication is required."),
  dosage: z.string().min(1, "Dosage is required."),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
  refill_on: z.string().min(1, "Refill date is required."),
  refill_schedule: z.string().optional(),
});

type Prescription = {
  id: number;
  medication: string;
  dosage: string;
  quantity: number;
  refill_on: string;
  refill_schedule: string | null;
};

type PrescriptionsProps = {
  patientId: string;
  prescriptions: Prescription[];
  onPrescriptionAdded: (newPrescription: Prescription) => void;
};

export const Prescriptions = ({ patientId, prescriptions, onPrescriptionAdded }: PrescriptionsProps) => {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { medication: "", dosage: "", quantity: 0, refill_on: "", refill_schedule: "" },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const { data, error } = await supabase
      .from("prescriptions")
      .insert([{ ...values, patient_id: patientId }])
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Prescription added." });
      onPrescriptionAdded(data as Prescription);
      form.reset();
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Prescriptions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {prescriptions.length > 0 ? (
            <ul className="divide-y">
              {prescriptions.map((rx) => (
                <li key={rx.id} className="py-2">
                  <p><strong>Medication:</strong> {rx.medication} ({rx.dosage})</p>
                  <p><strong>Quantity:</strong> {rx.quantity}</p>
                  <p><strong>Next Refill:</strong> {format(new Date(rx.refill_on), "PPP")}</p>
                  {rx.refill_schedule && <p><strong>Schedule:</strong> {rx.refill_schedule}</p>}
                </li>
              ))}
            </ul>
          ) : (
            <p>No prescriptions found.</p>
          )}
        </div>

        <hr className="my-6" />

        <h3 className="text-lg font-semibold mb-4">Add New Prescription</h3>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="medication" render={({ field }) => (
              <FormItem>
                <FormLabel>Medication</FormLabel>
                <FormControl><Input placeholder="e.g., Lisinopril" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="dosage" render={({ field }) => (
              <FormItem>
                <FormLabel>Dosage</FormLabel>
                <FormControl><Input placeholder="e.g., 10mg" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="quantity" render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity</FormLabel>
                <FormControl><Input type="number" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="refill_on" render={({ field }) => (
              <FormItem>
                <FormLabel>Next Refill Date</FormLabel>
                <FormControl><Input type="date" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="refill_schedule" render={({ field }) => (
              <FormItem>
                <FormLabel>Refill Schedule (Optional)</FormLabel>
                <FormControl><Input placeholder="e.g., Every 30 days" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <Button type="submit">Add Prescription</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};