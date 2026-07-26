import { AtlasDashboard } from "@/components/dashboard/AtlasDashboard";
import { I18nProvider } from "@/lib/i18n/I18nProvider";

export default function DashboardPage() {
  return <I18nProvider><AtlasDashboard /></I18nProvider>;
}
