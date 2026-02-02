import Link from "next/link";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";

export default async function AdminAppointmentsPage({
  searchParams
}: {
  searchParams: { authorId?: string; status?: string; date?: string };
}) {
  const authors = await prisma.authorProfile.findMany({
    include: { user: true }
  });

  const dateFilter = searchParams.date
    ? {
        gte: new Date(`${searchParams.date}T00:00:00.000Z`),
        lte: new Date(`${searchParams.date}T23:59:59.999Z`)
      }
    : undefined;

  const appointments = await prisma.appointment.findMany({
    where: {
      authorId: searchParams.authorId,
      status: searchParams.status as any,
      startAtUtc: dateFilter
    },
    include: {
      author: { include: { user: true } },
      customer: true,
      interviewType: true
    },
    orderBy: { startAtUtc: "asc" }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Admin appointment dashboard</h1>
        <p className="text-muted-foreground">
          Filter bookings and assist with reschedules or cancellations.
        </p>
      </div>
      <form className="grid gap-4 rounded-lg border bg-white p-4 md:grid-cols-4">
        <label className="space-y-2 text-sm">
          <span className="font-medium">Author</span>
          <select
            name="authorId"
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            defaultValue={searchParams.authorId ?? ""}
          >
            <option value="">All</option>
            {authors.map((author) => (
              <option key={author.id} value={author.id}>
                {author.user.name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-medium">Status</span>
          <select
            name="status"
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            defaultValue={searchParams.status ?? ""}
          >
            <option value="">All</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-medium">Date</span>
          <input
            type="date"
            name="date"
            defaultValue={searchParams.date ?? ""}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          />
        </label>
        <Button type="submit">Apply filters</Button>
      </form>

      <div className="overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left">Author</th>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Start</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appointment) => (
              <tr key={appointment.id} className="border-t">
                <td className="px-4 py-3">{appointment.author.user.name}</td>
                <td className="px-4 py-3">{appointment.customer.name}</td>
                <td className="px-4 py-3">{appointment.interviewType.name}</td>
                <td className="px-4 py-3">
                  {appointment.startAtUtc.toISOString()}
                </td>
                <td className="px-4 py-3">{appointment.status}</td>
                <td className="px-4 py-3">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/appointments/${appointment.id}`}>View</Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
