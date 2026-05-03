import { redirect } from "next/navigation";
import { getHousehold } from "@/lib/db/queries/household";
import { getSession } from "@/lib/auth/session";
import { SetupClient } from "./SetupClient";

export default async function SetupPage() {
  // Already set up → go to pin (or today if logged in)
  const household = await getHousehold();
  if (household) {
    const session = await getSession();
    redirect(session ? "/today" : "/pin");
  }

  return <SetupClient />;
}
