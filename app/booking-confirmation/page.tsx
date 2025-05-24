"use client";

import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle,
  Bus,
  Calendar,
  Clock,
  MapPin,
  Download,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function BookingConfirmationPage() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success") === "true";
  const [bookingNumber, setBookingNumber] = useState("");

  useEffect(() => {
    // Generate a random booking number
    const randomBookingNumber = `FT-${Math.floor(
      100000 + Math.random() * 900000
    )}`;
    setBookingNumber(randomBookingNumber);
  }, []);

  if (!success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="text-red-500 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mx-auto"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Booking Failed
            </h1>
            <p className="text-gray-600 mb-6">
              There was an issue processing your booking. Please try again or
              contact customer support.
            </p>
            <div className="flex flex-col gap-2">
              <Link href="/results">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Return to Search Results
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="w-full">
                  Return to Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container py-12">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Return to Home
          </Link>

          <Card className="border-green-100 shadow-lg overflow-hidden">
            <div className="bg-green-50 p-6 border-b border-green-100 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl md:text-3xl font-bold text-green-800 font-display">
                Booking Confirmed!
              </h1>
              <p className="text-green-700 mt-2">
                Your trip has been successfully booked. We've sent a
                confirmation email with all the details.
              </p>
            </div>
            <CardContent className="p-6">
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <div className="text-sm text-blue-600 font-medium">
                      Booking Reference
                    </div>
                    <div className="text-xl font-bold text-blue-800">
                      {bookingNumber}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="border-blue-200 text-blue-600 hover:bg-blue-100"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Ticket
                  </Button>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-3">
                    Trip Details
                  </h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <div className="text-sm text-gray-500">From</div>
                          <div className="font-medium">Downtown Terminal</div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <div className="text-sm text-gray-500">To</div>
                          <div className="font-medium">Northside Terminal</div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <div className="text-sm text-gray-500">Date</div>
                          <div className="font-medium">
                            Monday, April 15, 2024
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <div className="text-sm text-gray-500">Time</div>
                          <div className="font-medium">10:30 AM - 11:15 AM</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-3">
                    Important Information
                  </h2>
                  <div className="bg-yellow-50 p-4 rounded-lg text-sm space-y-2">
                    <p>
                      <span className="font-medium">Check-in:</span> Please
                      arrive at least 15 minutes before departure.
                    </p>
                    <p>
                      <span className="font-medium">Luggage:</span> Each
                      passenger is allowed one piece of luggage (max 20kg) and
                      one carry-on item.
                    </p>
                    <p>
                      <span className="font-medium">Cancellation:</span> Free
                      cancellation up to 24 hours before departure. A 50% fee
                      applies for cancellations made less than 24 hours before
                      departure.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 pt-4">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Download className="h-4 w-4 mr-2" />
                    Download Ticket
                  </Button>
                  <Button variant="outline">Manage Booking</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 text-center">
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              Need Assistance?
            </h2>
            <p className="text-gray-600 mb-4">
              Our customer service team is available to help you with any
              questions or concerns.
            </p>
            <div className="flex flex-col md:flex-row justify-center gap-4">
              <Button variant="outline" className="border-blue-200">
                Contact Support
              </Button>
              <Link href="/">
                <Button variant="outline" className="border-blue-200">
                  Book Another Trip
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
