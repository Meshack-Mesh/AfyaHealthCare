import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  Apple,
  Baby,
  BellRing,
  HeartPulse,
  Landmark,
  MapPin,
  MessagesSquare,
  ShieldCheck,
  Syringe,
  UserRoundSearch,
} from "lucide-react";
import { UssdSimulator } from "@/components/ussd-simulator";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import heroImage from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "AfyaCare — Health guidance on any phone, no internet needed",
      },
      {
        name: "description",
        content:
          "AfyaCare is a USSD self-care platform: reproductive health, nutrition, breastfeeding, immunization and chronic disease guidance, plus nearby facilities — in English and Kiswahili, on any mobile phone.",
      },
      {
        property: "og:title",
        content: "AfyaCare — Health guidance on any phone",
      },
      {
        property: "og:description",
        content:
          "Try the USSD menu demo: bilingual health information, facility finder and SMS reminders — no mobile internet required.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

const steps = [
  {
    icon: Landmark,
    title: "Dial the service code",
    body: "From any phone — no smartphone, app or mobile internet required.",
  },
  {
    icon: MessagesSquare,
    title: "Choose your language",
    body: "Menus and health content are available in English and Kiswahili.",
  },
  {
    icon: UserRoundSearch,
    title: "Navigate numbered menus",
    body: "Pick a topic, read reviewed guidance, and get pointed to real care.",
  },
];

const topics = [
  {
    icon: HeartPulse,
    title: "Reproductive health",
    body: "Family planning, menstrual health and when to see a health worker.",
  },
  {
    icon: Apple,
    title: "Nutrition",
    body: "Balanced diets, pregnancy nutrition and feeding children well.",
  },
  {
    icon: Baby,
    title: "Breastfeeding",
    body: "Getting started, common challenges and feeding while working.",
  },
  {
    icon: Syringe,
    title: "Immunization",
    body: "Why vaccines matter, the schedule and what to do about missed doses.",
  },
  {
    icon: Activity,
    title: "Chronic disease support",
    body: "Living well with diabetes, high blood pressure and asthma.",
  },
  {
    icon: MapPin,
    title: "Facility finder",
    body: "Nearby health facilities by county, with services and contacts.",
  },
  {
    icon: BellRing,
    title: "SMS reminders",
    body: "Opt in to reminders for immunization visits and clinic appointments.",
  },
];

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary">
              <Activity className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-semibold">AfyaCare</span>
          </div>
          <Link to="/auth">
            <Button variant="outline" size="sm">
              Staff sign in
            </Button>
          </Link>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 lg:grid-cols-2 lg:py-20">
          <div>
            <Badge variant="secondary" className="mb-4">
              USSD health service · English &amp; Kiswahili
            </Badge>
            <h1 className="heading-display text-4xl font-bold leading-tight sm:text-5xl">
              Essential health guidance on any phone — no internet needed.
            </h1>
            <p className="mt-4 max-w-xl text-lg text-muted-foreground">
              AfyaCare puts reviewed health information, nearby facilities and
              appointment reminders on the phone people already have. Dial a
              service code, choose your language, and navigate simple numbered
              menus.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <a href="#simulator">Try the demo</a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/auth">Staff sign in</Link>
              </Button>
            </div>
            <p className="mt-6 flex items-start gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              Educational information only — never a diagnosis. Emergencies are
              always escalated to qualified health workers.
            </p>
          </div>
          <div className="relative">
            <img
              src={heroImage}
              alt="A mother reading health information on her phone outside a rural health clinic"
              width={1024}
              height={1024}
              className="rounded-3xl border border-border object-cover shadow-lg"
            />
          </div>
        </section>

        {/* How it works */}
        <section className="border-y border-border bg-secondary/50 py-14">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="heading-display text-center text-3xl font-semibold">
              How it works
            </h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {steps.map((step, i) => (
                <Card key={step.title} className="border-none bg-card shadow-sm">
                  <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
                      <step.icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <p className="text-xs font-semibold text-muted-foreground">
                      STEP {i + 1}
                    </p>
                    <h3 className="font-display text-lg font-semibold">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Topics */}
        <section className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="heading-display text-center text-3xl font-semibold">
            What people find on the menu
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-muted-foreground">
            Content is reviewed by health professionals and managed by staff in
            the AfyaCare dashboard.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topics.map((topic) => (
              <Card key={topic.title} className="shadow-sm">
                <CardContent className="flex gap-4 p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                    <topic.icon className="h-5 w-5 text-secondary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold">{topic.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{topic.body}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Simulator */}
        <section id="simulator" className="border-t border-border bg-secondary/50 py-14">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 lg:grid-cols-2">
            <div>
              <Badge variant="secondary" className="mb-4">
                Interactive demo
              </Badge>
              <h2 className="heading-display text-3xl font-semibold">
                Try the menu flow right here
              </h2>
              <p className="mt-3 max-w-lg text-muted-foreground">
                This is the exact menu a caller navigates on their phone —
                powered by the same service that answers the gateway. Press the
                numbers to move through the screens: choose a language, accept
                the privacy notice, then explore health topics, find facilities
                or opt in to reminders.
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                On a real phone this happens over the mobile network in any
                language the caller prefers — the demo below runs in English.
              </p>
            </div>
            <UssdSimulator />
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 text-center text-sm text-muted-foreground">
          <p>
            AfyaCare provides educational health information, not medical
            diagnosis. In an emergency, call 999 or 112.
          </p>
          <p>
            Staff?{" "}
            <Link to="/auth" className="text-primary underline-offset-4 hover:underline">
              Sign in to the dashboard
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
