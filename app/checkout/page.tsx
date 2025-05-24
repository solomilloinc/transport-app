"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { format, parseISO } from "date-fns";
import {
  ArrowRight,
  Bus,
  Calendar,
  ChevronLeft,
  Clock,
  CreditCard,
  Shield,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { PassengerForm } from "@/components/passenger-form";
import { PaymentForm } from "@/components/payment-form";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

export default function CheckoutPage() {
  // Get trip details from URL parameters first
  const searchParams = useSearchParams();
  const router = useRouter();
  const tripId = searchParams.get("tripId") || "";
  const origin = searchParams.get("origin") || "";
  const destination = searchParams.get("destination") || "";
  const departureDate = searchParams.get("departureDate") || "";
  const departureTime = searchParams.get("departureTime") || "";
  const arrivalTime = searchParams.get("arrivalTime") || "";
  const duration = searchParams.get("duration") || "";
  const price = searchParams.get("price") || "0";
  const passengers = Number.parseInt(searchParams.get("passengers") || "1", 10);
  const busType = searchParams.get("busType") || "Standard";

  // Then initialize state variables
  const [currentStep, setCurrentStep] = useState<
    "passengers" | "payment" | "review"
  >("passengers");
  const [passengerData, setPassengerData] = useState<Record<string, any>[]>(
    () => {
      // Initialize with empty array of passenger objects based on passenger count
      return Array(passengers)
        .fill(0)
        .map(() => ({}));
    }
  );
  const [paymentData, setPaymentData] = useState<Record<string, any>>(
    () => ({})
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Format dates for display
  const formattedDepartureDate = departureDate
    ? format(parseISO(departureDate), "EEEE, MMMM d, yyyy")
    : "";

  // Calculate total price
  const pricePerPerson = Number.parseFloat(price);
  const totalPrice = pricePerPerson * passengers;
  const serviceFee = 2.5 * passengers;
  const finalTotal = totalPrice + serviceFee;

  // Handle passenger data updates
  const handlePassengerDataChange = (data: Record<string, any>[]) => {
    // Only update if data is different
    if (JSON.stringify(data) !== JSON.stringify(passengerData)) {
      setPassengerData(data);
    }
  };

  // Handle payment data updates
  const handlePaymentDataChange = (data: Record<string, any>) => {
    // Only update if data is different
    if (JSON.stringify(data) !== JSON.stringify(paymentData)) {
      setPaymentData(data);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // In a real app, you would send this data to your backend
      console.log("Booking data:", {
        tripDetails: {
          tripId,
          origin,
          destination,
          departureDate,
          departureTime,
          arrivalTime,
          busType,
        },
        passengers: passengerData,
        payment: paymentData,
        totalAmount: finalTotal,
      });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Redirect to confirmation page
      router.push("/booking-confirmation?success=true");
    } catch (error) {
      console.error("Error processing booking:", error);
      setIsSubmitting(false);
    }
  };

  // Navigate between steps
  const goToNextStep = () => {
    if (currentStep === "passengers") {
      setCurrentStep("payment");
    } else if (currentStep === "payment") {
      setCurrentStep("review");
    } else if (currentStep === "review") {
      handleSubmit();
    }
  };

  const goToPreviousStep = () => {
    if (currentStep === "payment") {
      setCurrentStep("passengers");
    } else if (currentStep === "review") {
      setCurrentStep("payment");
    }
  };

  // Check if current step is complete
  const isCurrentStepComplete = () => {
    if (currentStep === "passengers") {
      return (
        passengerData.length === passengers &&
        passengerData.every((p) => p.firstName && p.lastName && p.email)
      );
    }
    if (currentStep === "payment") {
      return (
        paymentData.cardNumber &&
        paymentData.cardholderName &&
        paymentData.expiryDate &&
        paymentData.cvv &&
        paymentData.billingAddress
      );
    }
    return true;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container py-8">
        {/* Back button */}
        <div className="mb-6">
          <Link
            href="/results"
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Results
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main content - 2/3 width */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-lg border shadow-sm p-6">
              <h1 className="text-2xl font-bold text-blue-800 font-display mb-4">
                Complete Your Booking
              </h1>

              {/* Progress steps */}
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  <div
                    className={`flex flex-col items-center ${
                      currentStep === "passengers"
                        ? "text-blue-600"
                        : "text-gray-500"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                        currentStep === "passengers"
                          ? "bg-blue-600 text-white"
                          : currentStep === "payment" ||
                            currentStep === "review"
                          ? "bg-green-500 text-white"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      <Users className="h-4 w-4" />
                    </div>
                    <span className="text-xs">Passengers</span>
                  </div>
                  <div className="flex-1 h-1 mx-2 bg-gray-200">
                    <div
                      className={`h-full bg-blue-600 ${
                        currentStep === "payment" || currentStep === "review"
                          ? "w-full"
                          : "w-0"
                      }`}
                    ></div>
                  </div>
                  <div
                    className={`flex flex-col items-center ${
                      currentStep === "payment"
                        ? "text-blue-600"
                        : "text-gray-500"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                        currentStep === "payment"
                          ? "bg-blue-600 text-white"
                          : currentStep === "review"
                          ? "bg-green-500 text-white"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <span className="text-xs">Payment</span>
                  </div>
                  <div className="flex-1 h-1 mx-2 bg-gray-200">
                    <div
                      className={`h-full bg-blue-600 ${
                        currentStep === "review" ? "w-full" : "w-0"
                      }`}
                    ></div>
                  </div>
                  <div
                    className={`flex flex-col items-center ${
                      currentStep === "review"
                        ? "text-blue-600"
                        : "text-gray-500"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                        currentStep === "review"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      <Shield className="h-4 w-4" />
                    </div>
                    <span className="text-xs">Review</span>
                  </div>
                </div>
              </div>

              {/* Step content */}
              <div>
                {currentStep === "passengers" && (
                  <div>
                    <h2 className="text-xl font-medium text-blue-800 mb-4">
                      Passenger Information
                    </h2>
                    <p className="text-gray-600 mb-6">
                      Please provide details for all {passengers} passenger
                      {passengers > 1 ? "s" : ""}.
                    </p>
                    <PassengerForm
                      passengerCount={passengers}
                      onDataChange={handlePassengerDataChange}
                      initialData={passengerData}
                    />
                  </div>
                )}

                {currentStep === "payment" && (
                  <div>
                    <h2 className="text-xl font-medium text-blue-800 mb-4">
                      Payment Details
                    </h2>
                    <p className="text-gray-600 mb-6">
                      Your payment information is secure and encrypted. We
                      accept all major credit cards.
                    </p>
                    <PaymentForm
                      onDataChange={handlePaymentDataChange}
                      initialData={paymentData}
                    />
                  </div>
                )}

                {currentStep === "review" && (
                  <div>
                    <h2 className="text-xl font-medium text-blue-800 mb-4">
                      Review Your Booking
                    </h2>
                    <p className="text-gray-600 mb-6">
                      Please review your booking details before confirming your
                      purchase.
                    </p>

                    <div className="space-y-6">
                      {/* Trip details summary */}
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h3 className="font-medium text-blue-800 mb-2">
                          Trip Details
                        </h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="text-gray-600">Route:</div>
                          <div className="font-medium">
                            {origin} to {destination}
                          </div>
                          <div className="text-gray-600">Date:</div>
                          <div className="font-medium">
                            {formattedDepartureDate}
                          </div>
                          <div className="text-gray-600">Departure Time:</div>
                          <div className="font-medium">{departureTime}</div>
                          <div className="text-gray-600">Arrival Time:</div>
                          <div className="font-medium">{arrivalTime}</div>
                          <div className="text-gray-600">Bus Type:</div>
                          <div className="font-medium">{busType}</div>
                        </div>
                      </div>

                      {/* Passenger summary */}
                      <div>
                        <h3 className="font-medium text-blue-800 mb-2">
                          Passenger Information
                        </h3>
                        <div className="space-y-3">
                          {passengerData.map((passenger, index) => (
                            <div
                              key={index}
                              className="bg-gray-50 p-3 rounded-lg text-sm"
                            >
                              <div className="font-medium">
                                Passenger {index + 1}: {passenger.firstName}{" "}
                                {passenger.lastName}
                              </div>
                              <div className="text-gray-600">
                                {passenger.email}
                              </div>
                              {passenger.specialRequests && (
                                <div className="text-gray-600 mt-1">
                                  <span className="font-medium">
                                    Special Requests:
                                  </span>{" "}
                                  {passenger.specialRequests}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Payment summary */}
                      <div>
                        <h3 className="font-medium text-blue-800 mb-2">
                          Payment Information
                        </h3>
                        <div className="bg-gray-50 p-3 rounded-lg text-sm">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-blue-600" />
                            <span>
                              Card ending in {paymentData.cardNumber?.slice(-4)}{" "}
                              • {paymentData.cardholderName}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Terms and conditions */}
                      <div className="bg-yellow-50 p-4 rounded-lg text-sm">
                        <h3 className="font-medium text-yellow-800 mb-2">
                          Terms and Conditions
                        </h3>
                        <p className="text-yellow-700 mb-2">
                          By completing this booking, you agree to
                          FamilyTransit's terms and conditions, including our
                          cancellation policy.
                        </p>
                        <p className="text-yellow-700">
                          Free cancellation up to 24 hours before departure. A
                          50% fee applies for cancellations made less than 24
                          hours before departure.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation buttons */}
              <div className="flex justify-between mt-8">
                {currentStep !== "passengers" ? (
                  <Button
                    variant="outline"
                    onClick={goToPreviousStep}
                    disabled={isSubmitting}
                  >
                    Back
                  </Button>
                ) : (
                  <div></div>
                )}
                <Button
                  onClick={goToNextStep}
                  disabled={!isCurrentStepComplete() || isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Processing...
                    </div>
                  ) : currentStep === "review" ? (
                    "Confirm and Pay"
                  ) : (
                    "Continue"
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Sidebar - 1/3 width */}
          <div>
            <div className="bg-white rounded-lg border shadow-sm sticky top-24">
              <div className="p-4 border-b bg-blue-50">
                <h2 className="font-bold text-blue-800 font-display">
                  Trip Summary
                </h2>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-lg font-medium">
                    {origin} to {destination}
                  </div>
                </div>

                <div className="space-y-3 text-sm mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span>{formattedDepartureDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <div className="flex items-center">
                      <span>{departureTime}</span>
                      <ArrowRight className="h-3 w-3 mx-1 text-gray-400" />
                      <span>{arrivalTime}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bus className="h-4 w-4 text-blue-600" />
                    <span>{busType} Bus</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span>
                      {passengers} Passenger{passengers > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      Ticket price ({passengers} x ${pricePerPerson})
                    </span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Service fee</span>
                    <span>${serviceFee.toFixed(2)}</span>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${finalTotal.toFixed(2)}</span>
                </div>

                <div className="mt-4 text-xs text-gray-500">
                  <p>
                    By proceeding with this booking, you agree to our{" "}
                    <Link href="#" className="text-blue-600 hover:underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="#" className="text-blue-600 hover:underline">
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
