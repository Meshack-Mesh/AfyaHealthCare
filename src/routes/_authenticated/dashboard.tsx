import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  adminBootstrap,
  adminListContent,
  adminListProviders,
  adminListReminders,
  adminListUsers,
  adminGetStats,
  adminGetGatewayInfo,
  adminSaveContent,
  adminDeleteContent,
  adminSaveProvider,
  adminDeleteProvider,
  adminGenerateContent,
} from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Activity,
  Copy,
  FileText,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  Bell,
  Users,
  LogOut,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [{ title: "Admin Dashboard — AfyaCare" }],
  }),
  loader: async () => {
    const boot = await adminBootstrap();
    if (!boot.isAdmin) return { authorized: false as const };
    const [content, providers, reminders, users, stats, gateway] = await Promise.all([
      adminListContent(),
      adminListProviders(),
      adminListReminders(),
      adminListUsers(),
      adminGetStats(),
      adminGetGatewayInfo(),
    ]);
    return { authorized: true as const, content, providers, reminders, users, stats, gateway };
  },
  component: DashboardPage,
});

type ContentRow = {
  id: string;
  category_id: string;
  title_en: string;
  title_sw: string;
  body_en: string;
  body_sw: string;
  status: string;
  sort_order: number;
};

type ProviderRow = {
  id: string;
  name: string;
  county: string;
  location: string;
  services: string;
  phone: string;
  sort_order: number;
};

type LoaderData = {
  authorized: boolean;
  content?: Awaited<ReturnType<typeof adminListContent>>;
  providers?: Awaited<ReturnType<typeof adminListProviders>>;
  reminders?: Awaited<ReturnType<typeof adminListReminders>>;
  users?: Awaited<ReturnType<typeof adminListUsers>>;
  stats?: Awaited<ReturnType<typeof adminGetStats>>;
  gateway?: Awaited<ReturnType<typeof adminGetGatewayInfo>>;
};

function DashboardPage() {
  const data = Route.useLoaderData() as LoaderData;
  const router = useRouter();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (!data.authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="max-w-md text-center">
          <CardHeader>
            <ShieldAlert className="mx-auto h-10 w-10 text-destructive" />
            <CardTitle>Not authorised</CardTitle>
            <CardDescription>
              Your account does not have staff access to AfyaCare. Ask an
              administrator to add your role.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = data.stats!;
  const gateway = data.gateway!;
  const callbackUrl = window.location.origin + gateway.callbackPath;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary">
              <Activity className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="font-semibold">AfyaCare Admin</p>
              <p className="text-xs text-muted-foreground">USSD health platform</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.invalidate()}>
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <Tabs defaultValue="overview">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="content">Health content</TabsTrigger>
            <TabsTrigger value="providers">Facilities</TabsTrigger>
            <TabsTrigger value="reminders">Reminders</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <StatCard icon={<Users className="h-4 w-4" />} label="USSD users" value={stats.users} />
              <StatCard icon={<Activity className="h-4 w-4" />} label="Sessions" value={stats.sessions} />
              <StatCard icon={<Bell className="h-4 w-4" />} label="Pending reminders" value={stats.pendingReminders} />
              <StatCard icon={<FileText className="h-4 w-4" />} label="Published articles" value={stats.publishedContent} />
              <StatCard icon={<MapPin className="h-4 w-4" />} label="Facilities" value={stats.providers} />
            </div>
            <Card>
              <CardHeader>
                <CardTitle>USSD gateway setup</CardTitle>
                <CardDescription>
                  In your Africa's Talking account, create a USSD channel and set
                  its callback URL to the address below. Dial the assigned
                  service code to test the live service.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <code className="flex-1 overflow-x-auto rounded-md bg-secondary px-3 py-2 text-sm text-secondary-foreground">
                    {callbackUrl}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(callbackUrl);
                      toast.success("Callback URL copied");
                    }}
                  >
                    <Copy className="mr-2 h-4 w-4" /> Copy
                  </Button>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Keep this URL private — it contains the access key for the
                  gateway connection.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content">
            <ContentManager
              content={data.content!}
              router={router}
            />
          </TabsContent>

          <TabsContent value="providers">
            <ProviderManager providers={data.providers!} router={router} />
          </TabsContent>

          <TabsContent value="reminders">
            <Card>
              <CardHeader>
                <CardTitle>Reminder opt-ins</CardTitle>
                <CardDescription>
                  Users who opted in to SMS reminders over USSD. Sending is
                  scheduled for a later phase.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.reminders!.reminders.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No reminders yet. They appear here when users opt in from the
                    USSD menu (option 7).
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Phone</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.reminders!.reminders.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell>{r.ussd_user?.phone_number ?? "—"}</TableCell>
                          <TableCell className="capitalize">
                            {r.reminder_type.replace("_", " ")}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{r.status}</Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(r.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>USSD users</CardTitle>
                <CardDescription>
                  Phone numbers that accepted the privacy notice, with their
                  chosen language.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.users!.users.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No users yet. Users appear here after their first live USSD
                    session.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Phone</TableHead>
                        <TableHead>Language</TableHead>
                        <TableHead>Consent</TableHead>
                        <TableHead>Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.users!.users.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell>{u.phone_number}</TableCell>
                          <TableCell className="uppercase">{u.language}</TableCell>
                          <TableCell>
                            <Badge variant={u.consent_given ? "default" : "secondary"}>
                              {u.consent_given ? "granted" : "none"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(u.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
          {icon}
        </div>
        <div>
          <p className="text-2xl font-semibold leading-none">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

const emptyContent = {
  id: undefined as string | undefined,
  categoryId: "",
  titleEn: "",
  titleSw: "",
  bodyEn: "",
  bodySw: "",
  status: "draft" as string,
  sortOrder: 10,
};

type GeneratedDraft = {
  titleEn: string;
  titleSw: string;
  bodyEn: string;
  bodySw: string;
};

function AiContentGenerator({
  categories,
  onSaved,
}: {
  categories: Awaited<ReturnType<typeof adminListContent>>["categories"];
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [source, setSource] = useState("");
  const [draft, setDraft] = useState<GeneratedDraft | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const generateFn = useServerFn(adminGenerateContent);
  const saveFn = useServerFn(adminSaveContent);

  async function generate() {
    if (!categoryId || source.trim().length < 3) {
      toast.error("Choose a topic and describe it in a few words first");
      return;
    }
    setGenerating(true);
    setDraft(null);
    try {
      const result = await generateFn({ data: { categoryId, source } });
      setDraft(result);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  async function saveDraft(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;
    setSaving(true);
    try {
      await saveFn({
        data: { ...draft, categoryId, status: "draft", sortOrder: 10 },
      });
      toast.success("Draft saved — review it before publishing");
      setOpen(false);
      setDraft(null);
      setSource("");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setDraft(null); }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" onClick={() => { setCategoryId(categories[0]?.id ?? ""); }}>
          <Sparkles className="mr-2 h-4 w-4" /> Generate with AI
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Draft content with AI</DialogTitle>
          <DialogDescription>
            Describe a health topic or paste source text. AfyaCare drafts
            English and Kiswahili copy; you review and save it as a draft.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={saveDraft} className="space-y-4">
          <div className="space-y-2">
            <Label>Topic</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a topic" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Topic description or source text</Label>
            <Textarea
              rows={4}
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="e.g. Malaria prevention for pregnant women — bed nets, clinic visits, fever warning signs"
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={generate}
            disabled={generating || saving}
          >
            {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {generating ? "Drafting…" : "Generate draft"}
          </Button>
          {generating && (
            <p className="text-sm text-muted-foreground">
              This usually takes under a minute.
            </p>
          )}
          {draft && (
            <div className="space-y-3 rounded-lg border border-border p-3">
              <p className="text-sm font-semibold">Suggested draft (editable)</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>Title (English)</Label>
                  <Input
                    value={draft.titleEn}
                    onChange={(e) => setDraft({ ...draft, titleEn: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Kichwa (Kiswahili)</Label>
                  <Input
                    value={draft.titleSw}
                    onChange={(e) => setDraft({ ...draft, titleSw: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Body (English)</Label>
                <Textarea
                  rows={4}
                  value={draft.bodyEn}
                  onChange={(e) => setDraft({ ...draft, bodyEn: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Maudhui (Kiswahili)</Label>
                <Textarea
                  rows={4}
                  value={draft.bodySw}
                  onChange={(e) => setDraft({ ...draft, bodySw: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save as draft
              </Button>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ContentManager({
  content,
  router,
}: {
  content: Awaited<ReturnType<typeof adminListContent>>;
  router: ReturnType<typeof useRouter>;
}) {
  const [editing, setEditing] = useState<typeof emptyContent | null>(null);
  const [busy, setBusy] = useState(false);
  const saveFn = useServerFn(adminSaveContent);
  const deleteFn = useServerFn(adminDeleteContent);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setBusy(true);
    try {
      await saveFn({ data: { ...editing, id: editing.id ?? undefined } });
      toast.success("Content saved");
      setEditing(null);
      router.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    try {
      await deleteFn({ data: { id } });
      toast.success("Deleted");
      router.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Health content</CardTitle>
          <CardDescription>
            Bilingual guidance shown over USSD. Only published items appear to
            users.
          </CardDescription>
        </div>
        <Button
          size="sm"
          onClick={() =>
            setEditing({ ...emptyContent, categoryId: content.categories[0]?.id ?? "" })
          }
        >
          <Plus className="mr-2 h-4 w-4" /> New
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {content.categories.map((cat) => {
          const items = content.content.filter((c) => c.category_id === cat.id);
          return (
            <div key={cat.id}>
              <p className="mb-2 text-sm font-semibold">
                {cat.name_en} <span className="text-muted-foreground">/ {cat.name_sw}</span>
              </p>
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">No items yet.</p>
              ) : (
                <ul className="divide-y divide-border rounded-lg border border-border">
                  {items.map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-3 px-3 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{c.title_en}</p>
                        <p className="truncate text-xs text-muted-foreground">{c.title_sw}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Badge
                          variant={c.status === "published" ? "default" : c.status === "reviewed" ? "secondary" : "outline"}
                        >
                          {c.status}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setEditing({
                              id: c.id,
                              categoryId: c.category_id,
                              titleEn: c.title_en,
                              titleSw: c.title_sw,
                              bodyEn: c.body_en,
                              bodySw: c.body_sw,
                              status: c.status,
                              sortOrder: c.sort_order,
                            })
                          }
                        >
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => remove(c.id)} disabled={busy}>
                          Delete
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </CardContent>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit content" : "New content"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <form onSubmit={save} className="space-y-4">
              <div className="space-y-2">
                <Label>Topic</Label>
                <Select
                  value={editing.categoryId}
                  onValueChange={(v) => setEditing({ ...editing, categoryId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a topic" />
                  </SelectTrigger>
                  <SelectContent>
                    {content.categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Title (English)</Label>
                  <Input
                    required
                    value={editing.titleEn}
                    onChange={(e) => setEditing({ ...editing, titleEn: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Kichwa (Kiswahili)</Label>
                  <Input
                    required
                    value={editing.titleSw}
                    onChange={(e) => setEditing({ ...editing, titleSw: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Body (English)</Label>
                <Textarea
                  required
                  rows={4}
                  value={editing.bodyEn}
                  onChange={(e) => setEditing({ ...editing, bodyEn: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Maudhui (Kiswahili)</Label>
                <Textarea
                  required
                  rows={4}
                  value={editing.bodySw}
                  onChange={(e) => setEditing({ ...editing, bodySw: e.target.value })}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={editing.status}
                    onValueChange={(v) => setEditing({ ...editing, status: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="reviewed">Reviewed</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Menu order</Label>
                  <Input
                    type="number"
                    min={0}
                    max={999}
                    value={editing.sortOrder}
                    onChange={(e) =>
                      setEditing({ ...editing, sortOrder: Number(e.target.value) })
                    }
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save content
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

const emptyProvider = {
  id: undefined as string | undefined,
  name: "",
  county: "",
  location: "",
  services: "",
  phone: "",
  sortOrder: 10,
};

function ProviderManager({
  providers,
  router,
}: {
  providers: Awaited<ReturnType<typeof adminListProviders>>;
  router: ReturnType<typeof useRouter>;
}) {
  const [editing, setEditing] = useState<typeof emptyProvider | null>(null);
  const [busy, setBusy] = useState(false);
  const saveFn = useServerFn(adminSaveProvider);
  const deleteFn = useServerFn(adminDeleteProvider);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setBusy(true);
    try {
      await saveFn({ data: { ...editing, id: editing.id ?? undefined } });
      toast.success("Facility saved");
      setEditing(null);
      router.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    try {
      await deleteFn({ data: { id } });
      toast.success("Deleted");
      router.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Facility directory</CardTitle>
          <CardDescription>
            Facilities listed under "Find a facility" on USSD, grouped by county.
          </CardDescription>
        </div>
        <Button size="sm" onClick={() => setEditing({ ...emptyProvider })}>
          <Plus className="mr-2 h-4 w-4" /> New
        </Button>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-border rounded-lg border border-border">
          {providers.providers.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{p.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {p.county} · {p.location} · {p.phone}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setEditing({
                      id: p.id,
                      name: p.name,
                      county: p.county,
                      location: p.location,
                      services: p.services,
                      phone: p.phone,
                      sortOrder: p.sort_order,
                    })
                  }
                >
                  Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => remove(p.id)} disabled={busy}>
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit facility" : "New facility"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <form onSubmit={save} className="space-y-4">
              <div className="space-y-2">
                <Label>Facility name</Label>
                <Input
                  required
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>County</Label>
                  <Input
                    required
                    value={editing.county}
                    onChange={(e) => setEditing({ ...editing, county: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    required
                    value={editing.location}
                    onChange={(e) => setEditing({ ...editing, location: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Services (comma separated)</Label>
                <Input
                  required
                  value={editing.services}
                  onChange={(e) => setEditing({ ...editing, services: e.target.value })}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    required
                    value={editing.phone}
                    onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Menu order</Label>
                  <Input
                    type="number"
                    min={0}
                    max={999}
                    value={editing.sortOrder}
                    onChange={(e) =>
                      setEditing({ ...editing, sortOrder: Number(e.target.value) })
                    }
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save facility
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
