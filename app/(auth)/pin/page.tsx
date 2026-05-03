import { redirect } from "next/navigation";
import { getHousehold, getUsers } from "@/lib/db/queries/household";
import { getSession } from "@/lib/auth/session";
import { PinClient } from "./PinClient";

export default async function PinPage() {
  // Already logged in → go to today
  const session = await getSession();
  if (session) redirect("/today");

  const household = await getHousehold();
  if (!household) redirect("/setup");

  const users = await getUsers(household.id);

  return <PinClient household={household} users={users} />;
}
