"use client"
import { useEffect, useState } from "react"
import { initMercadoPago, Payment, Wallet } from "@mercadopago/sdk-react"

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

  const handlePaymentWallet = async () => {
    // This function is called when the wallet payment is submitted.
    // You can send the wallet payment data to your server here.
  }

  return (
    <div className="space-y-6">
        <Payment
          initialization={{ amount: amount }}
          locale="es-AR"
          customization={{
            paymentMethods: {
              creditCard: "all",
              debitCard: "all",
            },
            visual: {
              hideFormTitle: true,
              hidePaymentButton: true,
            }
          }}
          onSubmit={handlePayment}
        />
        <Wallet 
          initialization={{ redirectMode: 'self' }}
          locale="es-AR"
          onSubmit={handlePaymentWallet} />
    </div>
  )
}
