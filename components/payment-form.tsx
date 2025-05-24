"use client"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CreditCard, Check } from "lucide-react"
import { useEffect, useState } from "react"

interface PaymentFormProps {
  onDataChange: (data: Record<string, any>) => void
  initialData?: Record<string, any>
}

export function PaymentForm({ onDataChange, initialData = {} }: PaymentFormProps) {
  const [paymentData, setPaymentData] = useState<Record<string, any>>({
    cardNumber: "",
    cardholderName: "",
    expiryDate: "",
    cvv: "",
    billingAddress: "",
    savePaymentInfo: false,
    ...initialData,
  })

  // Update parent component when payment data changes
  useEffect(() => {
    // Only update parent when there are actual changes to payment data
    if (Object.keys(paymentData).length > 0) {
      onDataChange(paymentData)
    }
  }, [paymentData]) // Remove onDataChange from dependencies

  const handleInputChange = (field: string, value: string | boolean) => {
    setPaymentData({
      ...paymentData,
      [field]: value,
    })
  }

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ""
    const parts = []

    for (let i = 0; i < match.length; i += 4) {
      parts.push(match.substring(i, i + 4))
    }

    if (parts.length) {
      return parts.join(" ")
    } else {
      return value
    }
  }

  // Format expiry date (MM/YY)
  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")

    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`
    }

    return value
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="h-5 w-5 text-blue-600" />
          <h3 className="font-medium text-blue-800">Card Information</h3>
        </div>

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="cardNumber">Card Number *</Label>
            <Input
              id="cardNumber"
              value={paymentData.cardNumber}
              onChange={(e) => handleInputChange("cardNumber", formatCardNumber(e.target.value))}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cardholderName">Cardholder Name *</Label>
            <Input
              id="cardholderName"
              value={paymentData.cardholderName}
              onChange={(e) => handleInputChange("cardholderName", e.target.value)}
              placeholder="Enter name as it appears on card"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date (MM/YY) *</Label>
              <Input
                id="expiryDate"
                value={paymentData.expiryDate}
                onChange={(e) => handleInputChange("expiryDate", formatExpiryDate(e.target.value))}
                placeholder="MM/YY"
                maxLength={5}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cvv">CVV *</Label>
              <Input
                id="cvv"
                type="password"
                value={paymentData.cvv}
                onChange={(e) => handleInputChange("cvv", e.target.value.replace(/\D/g, ""))}
                placeholder="123"
                maxLength={4}
                required
              />
            </div>
          </div>
        </div>
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
