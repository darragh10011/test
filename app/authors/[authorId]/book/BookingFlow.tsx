"use client";

import * as React from "react";
import { DateTime } from "luxon";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/lib/use-toast";

export type InterviewTypeOption = {
  id: string;
  name: string;
  durationOptionsMin: number[];
  minNoticeHours: number | null;
  bufferBeforeMin: number;
  bufferAfterMin: number;
  locationRequired: boolean;
};

type AuthorPayload = {
  id: string;
  name: string;
  timezone: string;
  interviewTypes: InterviewTypeOption[];
};

type Slot = {
  startAtUtc: string;
  endAtUtc: string;
  startAtLocal: string;
  endAtLocal: string;
};

export function BookingFlow({ author }: { author: AuthorPayload }) {
  const [typeId, setTypeId] = React.useState(author.interviewTypes[0]?.id ?? "");
  const [duration, setDuration] = React.useState<number>(
    author.interviewTypes[0]?.durationOptionsMin[0] ?? 30
  );
  const [fromDate, setFromDate] = React.useState(
    DateTime.now().plus({ days: 1 }).toISODate()
  );
  const [toDate, setToDate] = React.useState(
    DateTime.now().plus({ days: 14 }).toISODate()
  );
  const [timezone, setTimezone] = React.useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );
  const [slots, setSlots] = React.useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = React.useState<Slot | null>(null);
  const [locationText, setLocationText] = React.useState("");
  const [customerEmail, setCustomerEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const { push } = useToast();

  const interviewType = author.interviewTypes.find((type) => type.id === typeId);

  async function loadSlots() {
    setLoading(true);
    setSelectedSlot(null);
    try {
      const response = await fetch(
        `/api/authors/${author.id}/slots?typeId=${typeId}&duration=${duration}&from=${fromDate}&to=${toDate}&tz=${timezone}`
      );
      const data = await response.json();
      setSlots(data.slots ?? []);
    } catch (error) {
      push({
        title: "Unable to load slots",
        description: "Please try again in a moment.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  async function submitBooking() {
    if (!selectedSlot) {
      push({
        title: "Select a slot",
        description: "Choose a time to continue."
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorId: author.id,
          interviewTypeId: typeId,
          startAtUtc: selectedSlot.startAtUtc,
          endAtUtc: selectedSlot.endAtUtc,
          customerTimezone: timezone,
          customerEmail,
          locationText
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Booking failed");
      }
      push({
        title: "Booking confirmed",
        description: "Check your email for confirmation."
      });
    } catch (error) {
      push({
        title: "Booking failed",
        description: error instanceof Error ? error.message : "Try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Step 1: Choose your interview</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span className="font-medium">Interview type</span>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={typeId}
              onChange={(event) => {
                setTypeId(event.target.value);
                const nextType = author.interviewTypes.find(
                  (type) => type.id === event.target.value
                );
                if (nextType) {
                  setDuration(nextType.durationOptionsMin[0]);
                }
              }}
            >
              {author.interviewTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm">
            <span className="font-medium">Duration</span>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={duration}
              onChange={(event) => setDuration(Number(event.target.value))}
            >
              {interviewType?.durationOptionsMin.map((option) => (
                <option key={option} value={option}>
                  {option} minutes
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm">
            <span className="font-medium">Timezone</span>
            <Input
              value={timezone}
              onChange={(event) => setTimezone(event.target.value)}
            />
          </label>
          <label className="space-y-2 text-sm">
            <span className="font-medium">Preferred date range</span>
            <div className="grid gap-2 md:grid-cols-2">
              <Input
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
              />
              <Input
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
              />
            </div>
          </label>
          <Button type="button" onClick={loadSlots} disabled={loading}>
            {loading ? "Loading..." : "Find available slots"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Step 2: Select a slot</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {slots.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No slots loaded yet. Select your preferences above.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {slots.map((slot) => {
                const label = DateTime.fromISO(slot.startAtLocal).toFormat(
                  "ccc, LLL d 'at' h:mm a"
                );
                return (
                  <button
                    key={slot.startAtUtc}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`rounded-md border px-3 py-2 text-left text-sm transition hover:border-primary ${
                      selectedSlot?.startAtUtc === slot.startAtUtc
                        ? "border-primary bg-primary/10"
                        : "border-border"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Step 3: Confirm details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="space-y-2 text-sm">
            <span className="font-medium">Email address</span>
            <Input
              type="email"
              value={customerEmail}
              onChange={(event) => setCustomerEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </label>
          {interviewType?.locationRequired ? (
            <label className="space-y-2 text-sm">
              <span className="font-medium">Location details</span>
              <Input
                value={locationText}
                onChange={(event) => setLocationText(event.target.value)}
                placeholder="Enter location"
              />
            </label>
          ) : null}
          <Button type="button" onClick={submitBooking} disabled={loading}>
            {loading ? "Booking..." : "Confirm booking"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
