import { authIsDisabled, isAdmin } from "../../lib/admin-auth";
import AdminDashboard from "./AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  return <AdminDashboard initialAuthenticated={await isAdmin()} authDisabled={authIsDisabled()} />;
}
