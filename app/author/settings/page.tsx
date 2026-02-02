import { prisma } from "@/lib/db";
import { AvailabilityEditor } from "./AvailabilityEditor";

export default async function AuthorSettingsPage() {
  const author = await prisma.authorProfile.findFirst({
    include: { user: true, availability: true, overrides: true }
  });

  if (!author) {
    return <p>No author profile found.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Author settings</h1>
        <p className="text-muted-foreground">
          Manage availability for {author.user.name}
        </p>
      </div>
      <AvailabilityEditor
        data={{
          authorId: author.id,
          timezone: author.user.timezone,
          rules: author.availability,
          overrides: author.overrides
        }}
      />
    </div>
  );
}
