"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/use-toast";

export function AppointmentActions({ appointmentId }: { appointmentId: string }) {
  const { push } = useToast();

  async function cancel() {
    const response = await fetch(`/api/appointments/${appointmentId}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "Customer requested" })
    });
    if (response.ok) {
      push({ title: "Appointment cancelled" });
    } else {
      push({ title: "Unable to cancel", variant: "destructive" });
    }
  }

  async function reschedule() {
    push({
      title: "Reschedule requested",
      description: "Provide a new time via the booking flow."
    });
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Button type="button" variant="outline" onClick={reschedule}>
        Request reschedule
      </Button>
      <Button type="button" variant="ghost" onClick={cancel}>
        Cancel appointment
      </Button>
    </div>
  );
}
