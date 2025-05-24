import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Star,
  Users,
  Shield,
  Bus,
} from "lucide-react";
import { ScrollToSection } from "@/components/scroll-to-section";
import { AnimatedSection } from "@/components/animated-section";
import { HeroSection } from "@/components/hero-section";
import Link from "next/link";
import Navbar from "@/components/navbar";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar
        middleContent={
          <>
            <ScrollToSection
              href="#about"
              className="text-sm font-medium text-blue-900 hover:text-blue-700"
            >
              About Us
            </ScrollToSection>
            <ScrollToSection
              href="#routes"
              className="text-sm font-medium text-blue-900 hover:text-blue-700"
            >
              Routes
            </ScrollToSection>
            <ScrollToSection
              href="#testimonials"
              className="text-sm font-medium text-blue-900 hover:text-blue-700"
            >
              Testimonials
            </ScrollToSection>
            <ScrollToSection
              href="#contact"
              className="text-sm font-medium text-blue-900 hover:text-blue-700"
            >
              Contact
            </ScrollToSection>
          </>
        }
      />
      <main className="flex-1">
        {/* Hero Section - Replace with the new component */}
        <HeroSection />

        {/* About Us Section */}
        <AnimatedSection
          id="about"
          className="py-16 md:py-24 bg-blue-50"
          animation="fade-up"
        >
          <div className="container">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-blue-800 mb-6 font-display">
                  About Our Family Business
                </h2>
                <p className="text-blue-900 mb-4">
                  Founded in 1998, FamilyTransit has been providing safe,
                  reliable, and comfortable transportation services to our
                  community for over 25 years. What started as a small operation
                  with just two vehicles has grown into a trusted transportation
                  company serving thousands of passengers annually.
                </p>
                <p className="text-blue-900 mb-6">
                  As a family-owned business, we take pride in treating every
                  passenger like a member of our own family. Our commitment to
                  safety, punctuality, and customer service has made us the
                  preferred choice for short-distance travel in the region.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-2">
                    <Shield className="h-5 w-5 text-blue-600 mt-1" />
                    <div>
                      <h3 className="font-medium text-blue-800 font-display">
                        Safety First
                      </h3>
                      <p className="text-sm text-blue-700">
                        Rigorous vehicle maintenance and trained drivers
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="h-5 w-5 text-blue-600 mt-1" />
                    <div>
                      <h3 className="font-medium text-blue-800 font-display">
                        Punctuality
                      </h3>
                      <p className="text-sm text-blue-700">
                        On-time departures and arrivals
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Users className="h-5 w-5 text-blue-600 mt-1" />
                    <div>
                      <h3 className="font-medium text-blue-800 font-display">
                        Family Values
                      </h3>
                      <p className="text-sm text-blue-700">
                        Personal attention to every passenger
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Bus className="h-5 w-5 text-blue-600 mt-1" />
                    <div>
                      <h3 className="font-medium text-blue-800 font-display">
                        Modern Fleet
                      </h3>
                      <p className="text-sm text-blue-700">
                        Comfortable and well-maintained vehicles
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative h-[400px] rounded-lg overflow-hidden">
                <Image
                  src="/placeholder.svg?height=400&width=600"
                  alt="Family business"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Routes Map Section */}
        <AnimatedSection
          id="routes"
          className="py-16 md:py-24"
          animation="fade-in"
        >
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-blue-800 mb-4 font-display">
                Our Popular Routes
              </h2>
              <p className="text-blue-700 max-w-2xl mx-auto">
                We connect communities with frequent and reliable service on
                these popular routes. Check our schedule for more destinations
                and times.
              </p>
            </div>
            <div className="relative h-[400px] md:h-[500px] rounded-lg overflow-hidden border border-blue-100 shadow-md">
              <Image
                src="/placeholder.svg?height=500&width=1200"
                alt="Route map"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white/90 backdrop-blur-sm p-6 rounded-lg max-w-md">
                  <h3 className="text-xl font-bold text-blue-800 mb-4 font-display">
                    Frequently Traveled Routes
                  </h3>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      <span className="text-blue-900">
                        Downtown ↔ Northside (30 min)
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      <span className="text-blue-900">
                        Eastside ↔ Westside (45 min)
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      <span className="text-blue-900">
                        Downtown ↔ Southside (25 min)
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      <span className="text-blue-900">
                        Northside ↔ Eastside (40 min)
                      </span>
                    </li>
                  </ul>
                  <Button className="mt-4 w-full bg-blue-600 hover:bg-blue-700">
                    View Full Schedule
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Testimonials Section */}
        <AnimatedSection
          id="testimonials"
          className="py-16 md:py-24 bg-blue-50"
          animation="fade-up"
        >
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-blue-800 mb-4 font-display">
                What Our Passengers Say
              </h2>
              <p className="text-blue-700 max-w-2xl mx-auto">
                Don't just take our word for it. Here's what our regular
                passengers have to say about their experience with
                FamilyTransit.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  name: "Sarah Johnson",
                  comment:
                    "I've been using FamilyTransit for my daily commute for over 3 years. Always on time and the drivers are so friendly. It really does feel like family!",
                  rating: 5,
                },
                {
                  name: "Michael Rodriguez",
                  comment:
                    "As a senior citizen, I appreciate the extra care and attention I receive from the drivers. They always help me with my bags and make sure I'm comfortable.",
                  rating: 5,
                },
                {
                  name: "Emily Chen",
                  comment:
                    "The online booking system is so convenient, and the buses are always clean and comfortable. FamilyTransit is my go-to for getting around the city.",
                  rating: 4,
                },
              ].map((testimonial, index) => (
                <AnimatedSection
                  key={index}
                  as="div"
                  animation="fade-up"
                  delay={index * 200}
                >
                  <Card className="border-blue-100">
                    <CardContent className="p-6">
                      <div className="flex mb-4">
                        {Array(testimonial.rating)
                          .fill(0)
                          .map((_, i) => (
                            <Star
                              key={i}
                              className="h-5 w-5 text-yellow-400 fill-yellow-400"
                            />
                          ))}
                      </div>
                      <p className="text-blue-900 mb-4">
                        "{testimonial.comment}"
                      </p>
                      <p className="font-medium text-blue-800">
                        {testimonial.name}
                      </p>
                    </CardContent>
                  </Card>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </AnimatedSection>

        {/* CTA Section */}
        <AnimatedSection
          className="py-16 md:py-24 bg-blue-800 text-white"
          animation="fade-in"
        >
          <div className="container text-center">
            <h2 className="text-3xl font-bold mb-6 font-display">
              Ready to Experience the FamilyTransit Difference?
            </h2>
            <p className="max-w-2xl mx-auto mb-8 text-blue-100">
              Book your next trip with us and discover why our passengers keep
              coming back. Safe, reliable, and comfortable transportation with a
              personal touch.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                size="lg"
                className="bg-white text-blue-800 hover:bg-blue-50"
              >
                Book Your Trip Now
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-white border-white hover:bg-blue-700"
              >
                View Schedule
              </Button>
            </div>
          </div>
        </AnimatedSection>

        {/* Contact Section */}
        <AnimatedSection
          id="contact"
          className="py-16 md:py-24"
          animation="slide-in-right"
        >
          <div className="container">
            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <h2 className="text-3xl font-bold text-blue-800 mb-6 font-display">
                  Contact Us
                </h2>
                <p className="text-blue-900 mb-8">
                  Have questions or need assistance? Our friendly team is here
                  to help. Reach out to us through any of the following
                  channels.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-blue-600 mt-1" />
                    <div>
                      <h3 className="font-medium text-blue-800 font-display">
                        Main Office
                      </h3>
                      <p className="text-blue-700">
                        123 Transit Way, Downtown, City, 12345
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-blue-600 mt-1" />
                    <div>
                      <h3 className="font-medium text-blue-800 font-display">
                        Phone
                      </h3>
                      <p className="text-blue-700">(555) 123-4567</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-blue-600 mt-1" />
                    <div>
                      <h3 className="font-medium text-blue-800 font-display">
                        Email
                      </h3>
                      <p className="text-blue-700">info@familytransit.com</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-blue-600 mt-1" />
                    <div>
                      <h3 className="font-medium text-blue-800 font-display">
                        Operating Hours
                      </h3>
                      <p className="text-blue-700">
                        Monday - Friday: 5:00 AM - 10:00 PM
                      </p>
                      <p className="text-blue-700">
                        Saturday - Sunday: 6:00 AM - 9:00 PM
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <AnimatedSection as="div" animation="slide-in-left" delay={200}>
                <Card className="border-blue-100">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-blue-800 mb-4 font-display">
                      Send Us a Message
                    </h3>
                    <form className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-blue-900">
                            First Name
                          </label>
                          <Input placeholder="Enter your first name" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-blue-900">
                            Last Name
                          </label>
                          <Input placeholder="Enter your last name" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-blue-900">
                          Email
                        </label>
                        <Input type="email" placeholder="Enter your email" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-blue-900">
                          Phone
                        </label>
                        <Input placeholder="Enter your phone number" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-blue-900">
                          Message
                        </label>
                        <textarea
                          className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="How can we help you?"
                        />
                      </div>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700">
                        Send Message
                      </Button>
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
