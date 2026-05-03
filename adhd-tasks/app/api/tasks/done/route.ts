import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { markTaskDoneWithSession } from "@/lib/tasks/completeTask";

const BodySchema = z.object({
  instanceId: z.string().uuid(),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Ongeldige JSON" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ongeldige invoer" }, { status: 400 });
  }

  try {
    await markTaskDoneWithSession(session, parsed.data.instanceId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Onbekende fout";
    if (message === "Taak niet gevonden") {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    if (message === "Dit is niet jouw taak") {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    if (message === "Taak is al afgerond") {
      return NextResponse.json({ error: message }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
