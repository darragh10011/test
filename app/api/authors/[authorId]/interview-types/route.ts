import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: { authorId: string } }
) {
  const types = await prisma.interviewType.findMany({
    where: { authorId: params.authorId }
  });

  return Response.json({ types });
}
