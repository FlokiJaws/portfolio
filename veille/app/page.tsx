import App from "@/components/App";
import Login from "@/components/Login";
import { isAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Page() {
  let authed = false;
  let dbError = false;
  try {
    authed = await isAuthenticated();
  } catch {
    dbError = true;
  }
  return authed ? <App /> : <Login dbError={dbError} />;
}
