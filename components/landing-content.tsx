'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Phone, Mail, Clock, Star, Users, Shield, Bus } from 'lucide-react';
import { ScrollToSection } from '@/components/scroll-to-section';
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
  const { landing, contact, images, identity } = useTenant();

  return (
    <>
      {/* About Us Section */}
      <AnimatedSection id="about" className="py-16 md:py-24 bg-blue-50" animation="fade-up">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-blue-800 mb-6 font-display">{landing.about.title}</h2>
              {landing.about.paragraphs.map((paragraph, index) => (
                <p key={index} className="text-blue-900 mb-4">
                  {paragraph}
                </p>
              ))}
              <div className="grid grid-cols-2 gap-4">
                {landing.about.features.map((feature, index) => {
                  const Icon = getIcon(feature.icon);
                  return (
                    <div key={index} className="flex items-start gap-2">
                      <Icon className="h-5 w-5 text-blue-600 mt-1" />
                      <div>
                        <h3 className="font-medium text-blue-800 font-display">{feature.title}</h3>
                        <p className="text-sm text-blue-700">{feature.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="relative h-[400px] rounded-lg overflow-hidden">
              <Image
                src={images.aboutPhoto || '/placeholder.svg?height=400&width=600'}
                alt={landing.about.title}
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Routes Map Section */}
      <AnimatedSection id="routes" className="py-16 md:py-24" animation="fade-in">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-blue-800 mb-4 font-display">{landing.routesTitle}</h2>
            <p className="text-blue-700 max-w-2xl mx-auto">
              {landing.routesSubtitle}
            </p>
          </div>
          <div className="relative h-[400px] md:h-[500px] rounded-lg overflow-hidden border border-blue-100 shadow-md">
            <Image
              src={images.routesMap || '/placeholder.svg?height=500&width=1200'}
              alt="Mapa de rutas"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white/90 backdrop-blur-sm p-6 rounded-lg max-w-md">
                <h3 className="text-xl font-bold text-blue-800 mb-4 font-display">Rutas Frecuentes</h3>
                <ul className="space-y-2">
                  {landing.routes.map((route, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      <span className="text-blue-900">{route.label} ({route.duration})</span>
                    </li>
                  ))}
                </ul>
                <Button className="mt-4 w-full bg-blue-600 hover:bg-blue-700">Ver Horarios Completos</Button>
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Testimonials Section */}
      <AnimatedSection id="testimonials" className="py-16 md:py-24 bg-blue-50" animation="fade-up">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-blue-800 mb-4 font-display">{landing.testimonialsTitle}</h2>
            <p className="text-blue-700 max-w-2xl mx-auto">
              {landing.testimonialsSubtitle}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {landing.testimonials.map((testimonial, index) => (
              <AnimatedSection key={index} as="div" animation="fade-up" delay={index * 200}>
                <Card className="border-blue-100">
                  <CardContent className="p-6">
                    <div className="flex mb-4">
                      {Array(testimonial.rating)
                        .fill(0)
                        .map((_, i) => (
                          <Star key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                        ))}
                    </div>
                    <p className="text-blue-900 mb-4">&ldquo;{testimonial.comment}&rdquo;</p>
                    <p className="font-medium text-blue-800">{testimonial.name}</p>
                  </CardContent>
                </Card>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* CTA Section */}
      <AnimatedSection className="py-16 md:py-24 bg-blue-800 text-white" animation="fade-in">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-6 font-display">{landing.cta.title}</h2>
          <p className="max-w-2xl mx-auto mb-8 text-blue-100">
            {landing.cta.subtitle}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="bg-white text-blue-800 hover:bg-blue-50">
              {landing.cta.ctaPrimary}
            </Button>
            <Button size="lg" variant="outline" className="text-white border-white hover:bg-blue-700">
              {landing.cta.ctaSecondary}
            </Button>
          </div>
        </div>
      </AnimatedSection>

      {/* Contact Section */}
      <AnimatedSection id="contact" className="py-16 md:py-24" animation="slide-in-right">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold text-blue-800 mb-6 font-display">Contáctanos</h2>
              <p className="text-blue-900 mb-8">
                ¿Tenés preguntas o necesitás ayuda? Nuestro amable equipo está aquí para ayudarte. Comunicate con nosotros a través de cualquiera de
                los siguientes canales.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-blue-600 mt-1" />
                  <div>
                    <h3 className="font-medium text-blue-800 font-display">Oficina Principal</h3>
                    <p className="text-blue-700">{contact.address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-blue-600 mt-1" />
                  <div>
                    <h3 className="font-medium text-blue-800 font-display">Teléfono</h3>
                    <p className="text-blue-700">{contact.phone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-blue-600 mt-1" />
                  <div>
                    <h3 className="font-medium text-blue-800 font-display">Correo Electrónico</h3>
                    <p className="text-blue-700">{contact.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-blue-600 mt-1" />
                  <div>
                    <h3 className="font-medium text-blue-800 font-display">Horarios de Atención</h3>
                    {contact.schedule.map((line, i) => (
                      <p key={i} className="text-blue-700">{line}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <AnimatedSection as="div" animation="slide-in-left" delay={200}>
              <Card className="border-blue-100">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-blue-800 mb-4 font-display">Envíanos un Mensaje</h3>
                  <form className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-blue-900">Nombre</label>
                        <Input placeholder="Ingresá tu nombre" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-blue-900">Apellido</label>
                        <Input placeholder="Ingresá tu apellido" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-blue-900">Email</label>
                      <Input type="email" placeholder="Ingresá tu email" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-blue-900">Teléfono</label>
                      <Input placeholder="Ingresá tu número de teléfono" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-blue-900">Mensaje</label>
                      <textarea
                        className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="¿Cómo podemos ayudarte?"
                      />
                    </div>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">Enviar Mensaje</Button>
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
