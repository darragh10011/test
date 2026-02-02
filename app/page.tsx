import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const authors = await prisma.authorProfile.findMany({
    include: {
      user: true,
      interviewTypes: true
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Book your interview</h1>
        <p className="text-muted-foreground">
          Choose a StoryKeeper author and reserve your interview slot.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {authors.map((author) => (
          <Card key={author.id}>
            <CardHeader>
              <CardTitle>{author.user.name ?? "Author"}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {author.bio ?? ""}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium">Interview types</p>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {author.interviewTypes.map((type) => (
                    <li key={type.id}>
                      {type.name} ({type.durationOptionsMin.join("/" )} min)
                    </li>
                  ))}
                </ul>
              </div>
              <Button asChild>
                <Link href={`/authors/${author.id}/book`}>Book interview</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
