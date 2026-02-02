import { prisma } from "@/lib/db";
import { BookingFlow } from "./BookingFlow";
import { notFound } from "next/navigation";

export default async function BookPage({
  params
}: {
  params: { authorId: string };
}) {
  const author = await prisma.authorProfile.findUnique({
    where: { id: params.authorId },
    include: { user: true, interviewTypes: true }
  });

  if (!author) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Book with {author.user.name}</h1>
        <p className="text-muted-foreground">Timezone: {author.user.timezone}</p>
      </div>
      <BookingFlow
        author={{
          id: author.id,
          name: author.user.name ?? "Author",
          timezone: author.user.timezone,
          interviewTypes: author.interviewTypes.map((type) => ({
            id: type.id,
            name: type.name,
            durationOptionsMin: type.durationOptionsMin,
            minNoticeHours: type.minNoticeHours,
            bufferBeforeMin: type.bufferBeforeMin,
            bufferAfterMin: type.bufferAfterMin,
            locationRequired: type.locationRequired
          }))
        }}
      />
    </div>
  );
}
