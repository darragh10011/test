"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/lib/use-toast";

type AvailabilityRule = {
  id: string;
  dayOfWeek: number;
  startTimeLocal: string;
  endTimeLocal: string;
  active: boolean;
};

type AvailabilityOverride = {
  id: string;
  dateLocal: string;
  type: "ADD" | "REMOVE";
  startTimeLocal: string | null;
  endTimeLocal: string | null;
  note: string | null;
};

type AvailabilityPayload = {
  authorId: string;
  timezone: string;
  rules: AvailabilityRule[];
  overrides: AvailabilityOverride[];
};

export function AvailabilityEditor({ data }: { data: AvailabilityPayload }) {
  const { push } = useToast();
  const [rule, setRule] = React.useState({
    dayOfWeek: 1,
    startTimeLocal: "09:00",
    endTimeLocal: "12:00"
  });
  const [override, setOverride] = React.useState({
    dateLocal: "",
    type: "ADD",
    startTimeLocal: "",
    endTimeLocal: "",
    note: ""
  });

  async function addRule() {
    const response = await fetch("/api/author/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authorId: data.authorId, rule })
    });
    if (!response.ok) {
      push({ title: "Unable to add rule", variant: "destructive" });
      return;
    }
    push({ title: "Rule added" });
  }

  async function addOverride() {
    const response = await fetch("/api/author/availability", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authorId: data.authorId, override })
    });
    if (!response.ok) {
      push({ title: "Unable to add override", variant: "destructive" });
      return;
    }
    push({ title: "Override added" });
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Weekly availability</h2>
          <p className="text-sm text-muted-foreground">
            Author timezone: {data.timezone}
          </p>
        </div>
        <div className="rounded-md border p-4 text-sm">
          <ul className="space-y-1">
            {data.rules.map((ruleItem) => (
              <li key={ruleItem.id}>
                Day {ruleItem.dayOfWeek} · {ruleItem.startTimeLocal} - {ruleItem.endTimeLocal}
              </li>
            ))}
          </ul>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={rule.dayOfWeek}
            onChange={(event) =>
              setRule((prev) => ({
                ...prev,
                dayOfWeek: Number(event.target.value)
              }))
            }
          >
            {[0, 1, 2, 3, 4, 5, 6].map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
          <Input
            type="time"
            value={rule.startTimeLocal}
            onChange={(event) =>
              setRule((prev) => ({ ...prev, startTimeLocal: event.target.value }))
            }
          />
          <Input
            type="time"
            value={rule.endTimeLocal}
            onChange={(event) =>
              setRule((prev) => ({ ...prev, endTimeLocal: event.target.value }))
            }
          />
          <Button type="button" onClick={addRule}>
            Add rule
          </Button>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Date overrides</h2>
          <p className="text-sm text-muted-foreground">
            Add extra availability or block time.
          </p>
        </div>
        <div className="rounded-md border p-4 text-sm">
          <ul className="space-y-1">
            {data.overrides.map((item) => (
              <li key={item.id}>
                {item.dateLocal} · {item.type}
                {item.startTimeLocal ? ` ${item.startTimeLocal}-${item.endTimeLocal}` : ""}
                {item.note ? ` (${item.note})` : ""}
              </li>
            ))}
          </ul>
        </div>
        <div className="grid gap-3 md:grid-cols-5">
          <Input
            type="date"
            value={override.dateLocal}
            onChange={(event) =>
              setOverride((prev) => ({ ...prev, dateLocal: event.target.value }))
            }
          />
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={override.type}
            onChange={(event) =>
              setOverride((prev) => ({
                ...prev,
                type: event.target.value as "ADD" | "REMOVE"
              }))
            }
          >
            <option value="ADD">Add</option>
            <option value="REMOVE">Remove</option>
          </select>
          <Input
            type="time"
            value={override.startTimeLocal}
            onChange={(event) =>
              setOverride((prev) => ({
                ...prev,
                startTimeLocal: event.target.value
              }))
            }
          />
          <Input
            type="time"
            value={override.endTimeLocal}
            onChange={(event) =>
              setOverride((prev) => ({
                ...prev,
                endTimeLocal: event.target.value
              }))
            }
          />
          <Input
            value={override.note}
            onChange={(event) =>
              setOverride((prev) => ({ ...prev, note: event.target.value }))
            }
            placeholder="Note"
          />
          <Button type="button" onClick={addOverride}>
            Add override
          </Button>
        </div>
      </section>
    </div>
  );
}
