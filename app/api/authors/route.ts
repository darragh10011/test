import { prisma } from "@/lib/db";

export async function GET() {
  const authors = await prisma.authorProfile.findMany({
    include: { user: true }
  });

  return Response.json({
    authors: authors.map((author) => ({
      id: author.id,
      name: author.user.name,
      timezone: author.user.timezone,
      bio: author.bio
    }))
  });
}
