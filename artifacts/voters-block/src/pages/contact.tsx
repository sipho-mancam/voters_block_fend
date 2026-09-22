import { useState } from "react";
import { ArrowLeft, Mail, MapPin, Phone, Send } from "lucide-react";
import { Link } from "wouter";
import { BrandLogo } from "@/components/brand-logo";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function Contact() {
  const [form, setForm] = useState({ name: "", surname: "", email: "", message: "" });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const subject = encodeURIComponent(`Voters Block message from ${form.name} ${form.surname}`.trim());
    const body = encodeURIComponent(`Name: ${form.name} ${form.surname}\nEmail: ${form.email}\n\n${form.message}`);
    window.location.href = `mailto:info@seb4vision.co.za?subject=${subject}&body=${body}`;
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <header className="bg-secondary px-4 py-4 text-secondary-foreground shadow-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <BrandLogo variant="white" className="h-9 w-36 sm:w-44" />
          <Button asChild variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white hover:text-secondary">
            <Link href="/"><ArrowLeft className="mr-2" size={17} /> Back to voting</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <section className="bg-secondary px-5 pb-20 pt-14 text-secondary-foreground md:pb-28 md:pt-20">
          <div className="mx-auto max-w-6xl">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.24em] text-primary">Contact Seb4Vision</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-black uppercase tracking-tighter md:text-6xl">Send us a message</h1>
            <p className="mt-4 max-w-xl font-mono text-sm text-white/60">Questions about Voters Block, match-day voting, or Seb4Vision services? Get in touch with our team.</p>
          </div>
        </section>

        <section className="-mt-10 px-5 pb-16 md:-mt-14">
          <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <Card className="border-0 bg-primary text-primary-foreground shadow-xl">
              <CardContent className="space-y-8 p-7 md:p-9">
                <div><p className="font-mono text-xs font-bold uppercase tracking-widest text-primary-foreground/70">Visit or contact us</p><h2 className="mt-2 text-2xl font-black uppercase">Seb4Vision</h2></div>
                <ContactItem icon={<MapPin />} label="Address"><address className="not-italic">345 West Ave<br />Ferndale, Randburg 2194</address></ContactItem>
                <ContactItem icon={<Mail />} label="Email"><a href="mailto:info@seb4vision.co.za" className="underline underline-offset-4">info@seb4vision.co.za</a></ContactItem>
                <ContactItem icon={<Phone />} label="Telephone"><a href="tel:+27117870008" className="underline underline-offset-4">+27 11 787 0008</a></ContactItem>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl">
              <CardContent className="p-7 md:p-9">
                <form onSubmit={submit} className="space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Name"><Input required autoComplete="given-name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></Field>
                    <Field label="Surname"><Input required autoComplete="family-name" value={form.surname} onChange={(event) => setForm((current) => ({ ...current, surname: event.target.value }))} /></Field>
                  </div>
                  <Field label="Email"><Input required type="email" autoComplete="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} /></Field>
                  <Field label="Message">
                    <textarea required maxLength={2000} rows={7} value={form.message} onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                  </Field>
                  <Button type="submit" className="clip-diagonal h-11 min-w-36 uppercase"><Send className="mr-2" size={17} /> Send</Button>
                  <p className="font-mono text-xs text-muted-foreground">Submitting opens your email app with the message addressed to Seb4Vision.</p>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <SiteFooter showContactLink />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-2"><span className="font-mono text-xs font-bold uppercase text-muted-foreground">{label}</span>{children}</label>;
}

function ContactItem({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return <div className="flex gap-4"><div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-white">{icon}</div><div><p className="mb-1 font-mono text-[10px] font-bold uppercase tracking-widest text-primary-foreground/70">{label}</p><div className="font-bold">{children}</div></div></div>;
}