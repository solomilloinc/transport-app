'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Phone, Mail, Clock, Star, Users, Shield, Bus, ArrowRight } from 'lucide-react';
import { AnimatedSection } from '@/components/animated-section';
import { useTenant } from '@/contexts/TenantContext';
import type { LucideIcon } from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  Shield,
  Clock,
  Users,
  Bus,
  MapPin,
  Phone,
  Mail,
  Star,
};

function getIcon(name: string): LucideIcon {
  return iconMap[name] || Bus;
}

export function LandingContent() {
  const { landing, contact, images } = useTenant();

  return (
    <>
      <AnimatedSection id="about" className="px-3 py-10 sm:px-4 md:py-16" animation="fade-up">
        <div className="container">
          <div className="glass-panel overflow-hidden rounded-[2rem]">
            <div className="grid gap-10 px-6 py-8 md:grid-cols-[0.95fr_1.05fr] md:px-10 md:py-12">
              <div className="relative min-h-[320px] overflow-hidden rounded-[1.5rem]">
                <Image
                  src={images.aboutPhoto || '/placeholder.svg?height=700&width=800'}
                  alt={landing.about.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(11,28,35,0.58))]" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <p className="text-xs uppercase tracking-[0.28em] text-white/70">a bordo</p>
                  <h2 className="mt-2 text-3xl font-display">{landing.about.title}</h2>
                </div>
              </div>

              <div className="flex flex-col justify-center">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">experiencia</p>
                <div className="mt-5 space-y-4 text-slate-700">
                  {landing.about.paragraphs.map((paragraph, index) => (
                    <p key={index} className="leading-7">
                      {paragraph}
                    </p>
                  ))}
                </div>
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  {landing.about.features.map((feature, index) => {
                    const Icon = getIcon(feature.icon);
                    return (
                      <div key={index} className="rounded-[1.25rem] border border-black/5 bg-white/75 p-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-amber-300">
                          <Icon className="h-4 w-4" />
                        </div>
                        <h3 className="mt-4 font-display text-xl text-slate-900">{feature.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection id="routes" className="px-3 py-8 sm:px-4 md:py-12" animation="fade-in">
        <div className="container">
          <div className="grid gap-6 lg:grid-cols-[0.78fr_1.22fr]">
            <div className="glass-panel rounded-[2rem] p-6 md:p-8">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">red de viaje</p>
              <h2 className="mt-3 text-3xl text-slate-900 font-display">{landing.routesTitle}</h2>
              <p className="mt-4 max-w-lg leading-7 text-slate-600">{landing.routesSubtitle}</p>

              <div className="mt-8 space-y-3">
                {landing.routes.map((route, index) => (
                  <div key={index} className="flex items-center justify-between rounded-[1.25rem] border border-black/5 bg-white/80 px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{route.label}</div>
                        <div className="text-sm text-slate-500">{route.duration}</div>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>

            <div className="section-shell overflow-hidden rounded-[2rem]">
              <div className="relative min-h-[420px] overflow-hidden rounded-[2rem] border border-black/5 shadow-[0_28px_60px_rgba(17,31,37,0.14)]">
                <Image
                  src={images.routesMap || '/placeholder.svg?height=900&width=1400'}
                  alt="Mapa de rutas"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(11,30,36,0.8),rgba(11,30,36,0.18)_50%,rgba(251,191,36,0.22))]" />
                <div className="absolute left-6 top-6 max-w-md rounded-[1.5rem] border border-white/10 bg-white/12 p-5 text-white backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.28em] text-white/65">rutas frecuentes</p>
                  <h3 className="mt-3 text-2xl font-display">Cobertura pensada para salir y llegar sin rodeos</h3>
                  <p className="mt-3 text-sm leading-6 text-white/75">
                    Visualiza tramos activos, puntos clave y el ritmo de salida de los servicios mas consultados.
                  </p>
                  <Button className="mt-5 rounded-full bg-white text-slate-900 hover:bg-white/90">
                    Ver horarios completos
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection id="testimonials" className="px-3 py-10 sm:px-4 md:py-16" animation="fade-up">
        <div className="container">
          <div className="mb-8 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">confianza</p>
            <h2 className="mt-3 text-3xl text-slate-900 font-display">{landing.testimonialsTitle}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-600">{landing.testimonialsSubtitle}</p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {landing.testimonials.map((testimonial, index) => (
              <AnimatedSection key={index} as="div" animation="fade-up" delay={index * 160}>
                <Card className="glass-panel h-full rounded-[1.75rem] border-0">
                  <CardContent className="p-6">
                    <div className="flex gap-1">
                      {Array(testimonial.rating).fill(0).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="mt-5 text-lg leading-8 text-slate-700">&ldquo;{testimonial.comment}&rdquo;</p>
                    <p className="mt-6 text-sm uppercase tracking-[0.24em] text-slate-500">{testimonial.name}</p>
                  </CardContent>
                </Card>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection className="px-3 py-8 sm:px-4 md:py-14" animation="fade-in">
        <div className="container">
          <div className="overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#12353d,#0b2229_64%,#70521a)] px-6 py-10 text-white shadow-[0_30px_80px_rgba(12,25,31,0.22)] md:px-10">
            <p className="text-xs uppercase tracking-[0.3em] text-white/55">salida rapida</p>
            <h2 className="mt-4 max-w-3xl text-3xl leading-tight font-display md:text-5xl">{landing.cta.title}</h2>
            <p className="mt-5 max-w-2xl text-white/75">{landing.cta.subtitle}</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button size="lg" className="rounded-full bg-amber-400 px-7 text-slate-950 hover:bg-amber-300">
                {landing.cta.ctaPrimary}
              </Button>
              <Button size="lg" variant="outline" className="rounded-full border-white/20 bg-white/10 px-7 text-white hover:bg-white/15">
                {landing.cta.ctaSecondary}
              </Button>
            </div>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection id="contact" className="px-3 py-10 sm:px-4 md:py-16" animation="slide-in-right">
        <div className="container">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="glass-panel rounded-[2rem] p-6 md:p-8">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">contacto</p>
              <h2 className="mt-3 text-3xl text-slate-900 font-display">Hablemos</h2>
              <p className="mt-4 leading-7 text-slate-600">
                Si necesitas ayuda con horarios, rutas o reservas, tienes a mano un equipo real para responderte.
              </p>

              <div className="mt-8 space-y-5">
                <div className="flex items-start gap-4">
                  <MapPin className="mt-1 h-5 w-5 text-slate-700" />
                  <div>
                    <h3 className="font-medium text-slate-900">Oficina principal</h3>
                    <p className="text-slate-600">{contact.address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Phone className="mt-1 h-5 w-5 text-slate-700" />
                  <div>
                    <h3 className="font-medium text-slate-900">Telefono</h3>
                    <p className="text-slate-600">{contact.phone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Mail className="mt-1 h-5 w-5 text-slate-700" />
                  <div>
                    <h3 className="font-medium text-slate-900">Correo</h3>
                    <p className="text-slate-600">{contact.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Clock className="mt-1 h-5 w-5 text-slate-700" />
                  <div>
                    <h3 className="font-medium text-slate-900">Horarios</h3>
                    {contact.schedule.map((line, i) => (
                      <p key={i} className="text-slate-600">{line}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <AnimatedSection as="div" animation="slide-in-left" delay={200}>
              <Card className="glass-panel rounded-[2rem] border-0">
                <CardContent className="p-6 md:p-8">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">mensaje</p>
                  <h3 className="mt-3 text-3xl text-slate-900 font-display">Escribenos</h3>
                  <form className="mt-8 space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-800">Nombre</label>
                        <Input className="h-12 rounded-2xl border-black/5 bg-white/80" placeholder="Ingresa tu nombre" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-800">Apellido</label>
                        <Input className="h-12 rounded-2xl border-black/5 bg-white/80" placeholder="Ingresa tu apellido" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-800">Email</label>
                      <Input className="h-12 rounded-2xl border-black/5 bg-white/80" type="email" placeholder="Ingresa tu email" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-800">Telefono</label>
                      <Input className="h-12 rounded-2xl border-black/5 bg-white/80" placeholder="Ingresa tu numero de telefono" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-800">Mensaje</label>
                      <textarea
                        className="flex min-h-[140px] w-full rounded-[1.5rem] border border-black/5 bg-white/80 px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                        placeholder="Cuéntanos como podemos ayudarte"
                      />
                    </div>
                    <Button className="h-12 w-full rounded-2xl bg-[linear-gradient(135deg,#12353d,#255d6a)] text-white hover:opacity-95">
                      Enviar mensaje
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </AnimatedSection>
          </div>
        </div>
      </AnimatedSection>
    </>
  );
}
