import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/current-user";

/** "/profile" her zaman giriş yapmış kullanıcının kendi profiline yönlenir. */
export default async function OwnProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  redirect(`/profile/${user.username}`);
}
