import { getAppSettings } from "@/lib/app-settings";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const settings = await getAppSettings();
  return <LoginForm appName={settings.appName} logoBase64={settings.logoBase64} />;
}
