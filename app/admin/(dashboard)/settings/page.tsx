import SettingsForm from "@/components/admin/SettingsForm";
import { getStoreSettings } from "@/lib/db";

export const metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const settings = await getStoreSettings();
  return <SettingsForm settings={settings} />;
}
