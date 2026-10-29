import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

// Integration-managed auth gate: client-only session check, redirects
// unauthenticated visitors to /auth. Do not author additional gates here.
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { supabase } = await import("@/integrations/supabase/client");
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw redirect({ to: "/auth" });
  },
  component: () => <Outlet />,
});
