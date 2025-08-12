"use client"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CreditCard, Check } from "lucide-react"
import { useEffect, useState } from "react"
import { initMercadoPago, Payment } from "@mercadopago/sdk-react"

// TODO: Replace with your Mercado Pago public key
initMercadoPago("APP_USR-eeaadcbb-5c00-4f9e-a647-3ae4648aa705")

interface PaymentFormProps {
  onDataChange: (data: Record<string, any>) => void
  initialData?: Record<string, any>
  // TODO: Pass the amount from the parent component
  amount: number
}

export function PaymentForm({
  onDataChange,
  initialData = {},
  amount,
}: PaymentFormProps) {
  const [paymentData, setPaymentData] = useState<Record<string, any>>({
    billingAddress: "",
    savePaymentInfo: false,
    ...initialData,
  })

  useEffect(() => {
    if (Object.keys(paymentData).length > 0) {
      onDataChange(paymentData)
    }
  }, [paymentData])

  const handleInputChange = (field: string, value: string | boolean) => {
    setPaymentData({
      ...paymentData,
      [field]: value,
    })
  }

  const handlePayment = async (formData: any) => {
    // This function is called when the payment is submitted.
    // You can send the payment data to your server here.
    console.log(formData)
    onDataChange({ ...paymentData, ...formData })
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="h-5 w-5 text-blue-600" />
          <h3 className="font-medium text-blue-800">Card Information</h3>
        </div>

        <Payment
          initialization={{ amount: amount }}
          customization={{
            paymentMethods: {
              creditCard: "all",
              debitCard: "all",
            },
          }}
          onSubmit={handlePayment}
        />
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <Check className="h-5 w-5 text-blue-600" />
          <h3 className="font-medium text-blue-800">Billing Address</h3>
        </div>

        <div className="space-y-2">
          <Label htmlFor="billingAddress">Billing Address *</Label>
          <Textarea
            id="billingAddress"
            value={paymentData.billingAddress}
            onChange={(e) => handleInputChange("billingAddress", e.target.value)}
            placeholder="Enter your billing address"
            className="resize-none"
            required
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="savePaymentInfo"
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          checked={paymentData.savePaymentInfo}
          onChange={(e) => handleInputChange("savePaymentInfo", e.target.checked)}
        />
        <Label htmlFor="savePaymentInfo" className="text-sm text-gray-600">
          Save this payment information for future bookings
        </Label>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg text-sm">
        <p className="text-blue-800">
          <span className="font-medium">Secure Payment:</span> Your payment information is encrypted and secure. We do
          not store your full card details.
        </p>
      </div>
    </div>
  )
}

