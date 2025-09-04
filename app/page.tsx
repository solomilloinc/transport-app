export const revalidate = 86400;
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { get } from '@/services/api';
import { City } from '@/interfaces/city';
import { SelectOption } from '@/components/dashboard/select';

import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Phone, Mail, Clock, Star, Users, Shield, Bus } from 'lucide-react';
import { ScrollToSection } from '@/components/scroll-to-section';
import { AnimatedSection } from '@/components/animated-section';
import { HeroSection } from '@/components/hero-section';
import Link from 'next/link';
import Navbar from '@/components/navbar';
import { PagedResponse } from '@/services/types';
async function loadCities(): Promise<SelectOption[]> {
  try {
    // Usamos skipAuth: true asumiendo que esta data es pública.
    const response = await get<any, PagedResponse<City>>('/city-report', {
      pageNumber: 1,
      pageSize: 100,
      sortBy: 'Name',
      sortDescending: false,
      filters: {},
    });

    if (response && response.Items) {
      const formattedCities: SelectOption[] = response.Items.map((city) => ({
        id: city.Id,
        value: city.Name,
        label: city.Name,
      }));
      const uniqueCities = Array.from(new Map(formattedCities.map((item) => [item.label, item])).values());
      return uniqueCities;
    }
  } catch (error) {
    console.error('Failed to load cities for landing page:', error);
    return [];
  }
  return [];
}
export default async function Home() {
  const cities = await loadCities();
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar
        middleContent={
          <>
            <ScrollToSection href="#about" className="text-sm font-medium text-blue-900 hover:text-blue-700">
              Nosotros
            </ScrollToSection>
            <ScrollToSection href="#routes" className="text-sm font-medium text-blue-900 hover:text-blue-700">
              Rutas
            </ScrollToSection>
            <ScrollToSection href="#testimonials" className="text-sm font-medium text-blue-900 hover:text-blue-700">
              Testimonios
            </ScrollToSection>
            <ScrollToSection href="#contact" className="text-sm font-medium text-blue-900 hover:text-blue-700">
              Contacto
            </ScrollToSection>
          </>
        }
      />
      <main className="flex-1">
        {/* Hero Section - Replace with the new component */}
        <HeroSection cities={cities} />

        {/* About Us Section */}
        <AnimatedSection id="about" className="py-16 md:py-24 bg-blue-50" animation="fade-up">
          <div className="container">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-blue-800 mb-6 font-display">Sobre Nuestra Empresa Familiar</h2>
                <p className="text-blue-900 mb-4">
                  Fundada en 1998, Zeros Tour ha brindado servicios de transporte seguros, confiables y cómodos a nuestra comunidad durante más de 25
                  años. Lo que comenzó como una pequeña operación con solo dos vehículos se ha convertido en una empresa de transporte de confianza
                  que atiende a miles de pasajeros anualmente.
                </p>
                <p className="text-blue-900 mb-6">
                  Como empresa familiar, nos enorgullece tratar a cada pasajero como un miembro de nuestra propia familia. Nuestro compromiso con la
                  seguridad, la puntualidad y el servicio al cliente nos ha convertido en la opción preferida para viajes de corta distancia en la
                  región.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-2">
                    <Shield className="h-5 w-5 text-blue-600 mt-1" />
                    <div>
                      <h3 className="font-medium text-blue-800 font-display">Seguridad Primero</h3>
                      <p className="text-sm text-blue-700">Mantenimiento riguroso y conductores capacitados</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="h-5 w-5 text-blue-600 mt-1" />
                    <div>
                      <h3 className="font-medium text-blue-800 font-display">Puntualidad</h3>
                      <p className="text-sm text-blue-700">Salidas y llegadas a tiempo</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Users className="h-5 w-5 text-blue-600 mt-1" />
                    <div>
                      <h3 className="font-medium text-blue-800 font-display">Valores Familiares</h3>
                      <p className="text-sm text-blue-700">Atención personalizada a cada pasajero</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Bus className="h-5 w-5 text-blue-600 mt-1" />
                    <div>
                      <h3 className="font-medium text-blue-800 font-display">Flota Moderna</h3>
                      <p className="text-sm text-blue-700">Vehículos cómodos y bien mantenidos</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative h-[400px] rounded-lg overflow-hidden">
                <Image
                  src="/placeholder.svg?height=400&width=600" // Reemplazar con una imagen real
                  alt="Empresa familiar de transporte"
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
              <h2 className="text-3xl font-bold text-blue-800 mb-4 font-display">Nuestras Rutas Populares</h2>
              <p className="text-blue-700 max-w-2xl mx-auto">
                Conectamos comunidades con un servicio frecuente y confiable en estas rutas populares. Consultá nuestros horarios para ver más
                destinos y horarios.
              </p>
            </div>
            <div className="relative h-[400px] md:h-[500px] rounded-lg overflow-hidden border border-blue-100 shadow-md">
              <Image
                src="/placeholder.svg?height=500&width=1200" // Reemplazar con un mapa de rutas real
                alt="Mapa de rutas"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white/90 backdrop-blur-sm p-6 rounded-lg max-w-md">
                  <h3 className="text-xl font-bold text-blue-800 mb-4 font-display">Rutas Frecuentes</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      <span className="text-blue-900">Lobos ↔ Buenos Aires (90 min)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      <span className="text-blue-900">La Plata ↔ Luján (120 min)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      <span className="text-blue-900">Cañuelas ↔ Navarro (45 min)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      <span className="text-blue-900">Mercedes ↔ Roque Pérez (60 min)</span>
                    </li>
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
              <h2 className="text-3xl font-bold text-blue-800 mb-4 font-display">Lo que Dicen Nuestros Pasajeros</h2>
              <p className="text-blue-700 max-w-2xl mx-auto">
                No te fíes solo de nuestra palabra. Esto es lo que nuestros pasajeros habituales tienen que decir sobre su experiencia con Zeros Tour.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  name: 'Sara Johnson',
                  comment:
                    'Uso FamilyTransit para mi viaje diario desde hace más de 3 años. Siempre puntuales y los conductores son muy amables. ¡Realmente se siente como en familia!',
                  rating: 5,
                },
                {
                  name: 'Miguel Rodríguez',
                  comment:
                    'Como persona mayor, valoro mucho el cuidado y la atención extra que recibo de los conductores. Siempre me ayudan con las valijas y se aseguran de que esté cómodo.',
                  rating: 5,
                },
                {
                  name: 'Emilia Chen',
                  comment:
                    'El sistema de reservas online es súper práctico y los colectivos siempre están limpios y cómodos. FamilyTransit es mi opción para moverme por la zona.',
                  rating: 4,
                },
              ].map((testimonial, index) => (
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
                      <p className="text-blue-900 mb-4">"{testimonial.comment}"</p>
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
            <h2 className="text-3xl font-bold mb-6 font-display">¿Listo para Vivir la Experiencia FamilyTransit?</h2>
            <p className="max-w-2xl mx-auto mb-8 text-blue-100">
              Reservá tu próximo viaje con nosotros y descubrí por qué nuestros pasajeros nos siguen eligiendo. Transporte seguro, confiable y cómodo
              con un toque personal.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="bg-white text-blue-800 hover:bg-blue-50">
                Reservá tu Viaje Ahora
              </Button>
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-blue-700">
                Ver Horarios
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
                      <p className="text-blue-700">Av. Alem 123, Lobos, Buenos Aires</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-blue-600 mt-1" />
                    <div>
                      <h3 className="font-medium text-blue-800 font-display">Teléfono</h3>
                      <p className="text-blue-700">(555) 123-4567</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-blue-600 mt-1" />
                    <div>
                      <h3 className="font-medium text-blue-800 font-display">Correo Electrónico</h3>
                      <p className="text-blue-700">info@familytransit.com</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-blue-600 mt-1" />
                    <div>
                      <h3 className="font-medium text-blue-800 font-display">Horarios de Atención</h3>
                      <p className="text-blue-700">Lunes a Viernes: 5:00 AM - 10:00 PM</p>
                      <p className="text-blue-700">Sábados y Domingos: 6:00 AM - 9:00 PM</p>
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
      </main>
    </div>
  );
}
