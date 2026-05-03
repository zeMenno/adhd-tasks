import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getHousehold } from "@/lib/db/queries/household";

export default async function RootPage() {
  const household = await getHousehold();
  if (!household) redirect("/setup");

  const session = await getSession();
  if (session) redirect("/today");

  redirect("/pin");
}
