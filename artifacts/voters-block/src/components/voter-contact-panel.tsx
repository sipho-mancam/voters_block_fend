import { useState } from "react";
import { Mail, MapPin, Phone, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function VoterContactPanel() {
  const [form, setForm] = useState({ name: "", surname: "", email: "", message: "" });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const subject = encodeURIComponent(`Voters Block message from ${form.name} ${form.surname}`.trim());
    const body = encodeURIComponent(`Name: ${form.name} ${form.surname}\nEmail: ${form.email}\n\n${form.message}`);
    window.location.href = `mailto:info@seb4vision.co.za?subject=${subject}&body=${body}`;
  };

  return (
    <section className="border-y border-white/10 bg-secondary px-4 py-12 text-secondary-foreground">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-xl border border-white/10 bg-white/5 shadow-2xl lg:grid-cols-[0.75fr_1.25fr]">
        <div className="bg-primary p-6 text-primary-foreground sm:p-8">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.22em] text-primary-foreground/70">Contact us</p>
          <h2 className="mt-2 text-3xl font-black uppercase tracking-tight">Send us a message</h2>
          <p className="mt-3 text-sm text-primary-foreground/75">Questions about Voters Block or Seb4Vision services? Our team is ready to help.</p>
          <div className="mt-8 space-y-5">
            <ContactLine icon={<MapPin size={17} />}>345 West Ave, Ferndale, Randburg 2194</ContactLine>
            <ContactLine icon={<Mail size={17} />}><a href="mailto:info@seb4vision.co.za" className="underline underline-offset-4">info@seb4vision.co.za</a></ContactLine>
            <ContactLine icon={<Phone size={17} />}><a href="tel:+27117870008" className="underline underline-offset-4">+27 11 787 0008</a></ContactLine>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4 bg-secondary p-6 sm:p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name"><Input required autoComplete="given-name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="border-white/15 bg-white/10 text-white" /></Field>
            <Field label="Surname"><Input required autoComplete="family-name" value={form.surname} onChange={(event) => setForm((current) => ({ ...current, surname: event.target.value }))} className="border-white/15 bg-white/10 text-white" /></Field>
          </div>
          <Field label="Email"><Input required type="email" autoComplete="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} className="border-white/15 bg-white/10 text-white" /></Field>
          <Field label="Message">
            <textarea required maxLength={2000} rows={5} value={form.message} onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))} className="flex w-full rounded-md border border-white/15 bg-white/10 px-3 py-2 text-sm text-white ring-offset-secondary placeholder:text-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
          </Field>
          <Button type="submit" className="clip-diagonal h-11 uppercase"><Send className="mr-2" size={17} /> Send message</Button>
          <p className="font-mono text-[11px] text-white/50">Opens your email app with the message addressed to Seb4Vision.</p>
        </form>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-2"><span className="font-mono text-[11px] font-bold uppercase tracking-wider text-white/60">{label}</span>{children}</label>;
}

function ContactLine({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return <div className="flex items-start gap-3 text-sm font-bold"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-white">{icon}</span><span className="pt-1.5">{children}</span></div>;
}