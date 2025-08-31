"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ChevronDown, ChevronUp, User } from "lucide-react"
import { useEffect, useState } from "react"

interface PassengerFormProps {
  passengerCount: number
  onDataChange: (data: Record<string, any>[]) => void
  initialData?: Record<string, any>[]
}

export function PassengerForm({ passengerCount, onDataChange, initialData = [] }: PassengerFormProps) {
  const [expandedPassenger, setExpandedPassenger] = useState(0)
  const [passengers, setPassengers] = useState<Record<string, any>[]>([])

  // Initialize passenger data
  useEffect(() => {
    if (initialData.length === passengerCount) {
      setPassengers(initialData)
    } else {
      const initialPassengers = Array(passengerCount)
        .fill(0)
        .map((_, i) => ({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          documentNumber: "",
          dateOfBirth: "",
          specialRequests: "",
        }))
      setPassengers(initialPassengers)
    }
  }, [passengerCount, initialData])

  // Update parent component when passenger data changes
  useEffect(() => {
    // Only update parent when passengers state changes, not on every render
    if (passengers.length > 0) {
      onDataChange(passengers)
    }
  }, [passengers]) // Remove onDataChange from dependencies

  const handleInputChange = (index: number, field: string, value: string) => {
    const updatedPassengers = [...passengers]
    updatedPassengers[index] = {
      ...updatedPassengers[index],
      [field]: value,
    }
    setPassengers(updatedPassengers)
  }

  const toggleExpand = (index: number) => {
    setExpandedPassenger(expandedPassenger === index ? -1 : index)
  }

  return (
    <div className="space-y-4">
      {Array(passengerCount)
        .fill(0)
        .map((_, index) => (
          <Card key={index} className={`border-blue-100 ${expandedPassenger === index ? "ring-1 ring-blue-200" : ""}`}>
            <CardContent className="p-0">
              <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => toggleExpand(index)}>
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-medium">
                      Pasajero {index + 1}
                      {passengers[index]?.firstName && passengers[index]?.lastName
                        ? `: ${passengers[index].firstName} ${passengers[index].lastName}`
                        : ""}
                    </h3>
                    {passengers[index]?.email && <p className="text-sm text-gray-500">{passengers[index].email}</p>}
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  {expandedPassenger === index ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {expandedPassenger === index && (
                <div className="p-4 pt-0 border-t">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`firstName-${index}`}>Nombre *</Label>
                      <Input
                        id={`firstName-${index}`}
                        value={passengers[index]?.firstName || ""}
                        onChange={(e) => handleInputChange(index, "firstName", e.target.value)}
                        placeholder="Enter first name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`lastName-${index}`}>Apellido *</Label>
                      <Input
                        id={`lastName-${index}`}
                        value={passengers[index]?.lastName || ""}
                        onChange={(e) => handleInputChange(index, "lastName", e.target.value)}
                        placeholder="Enter last name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`email-${index}`}>Email *</Label>
                      <Input
                        id={`email-${index}`}
                        type="email"
                        value={passengers[index]?.email || ""}
                        onChange={(e) => handleInputChange(index, "email", e.target.value)}
                        placeholder="Enter email address"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`phone-${index}`}>Teléfono</Label>
                      <Input
                        id={`phone-${index}`}
                        type="tel"
                        value={passengers[index]?.phone || ""}
                        onChange={(e) => handleInputChange(index, "phone", e.target.value)}
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`documentNumber-${index}`}>Número de Documento *</Label>
                      <Input
                        id={`documentNumber-${index}`}
                        value={passengers[index]?.documentNumber || ""}
                        onChange={(e) => handleInputChange(index, "documentNumber", e.target.value)}
                        placeholder="DNI, Cédula, Pasaporte"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`dateOfBirth-${index}`}>Fecha de Nacimiento</Label>
                      <Input
                        id={`dateOfBirth-${index}`}
                        type="date"
                        value={passengers[index]?.dateOfBirth || ""}
                        onChange={(e) => handleInputChange(index, "dateOfBirth", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`passengerType-${index}`}>Tipo de pasajero</Label>
                      <Select
                        value={passengers[index]?.passengerType || "adult"}
                        onValueChange={(value) => handleInputChange(index, "passengerType", value)}
                      >
                        <SelectTrigger id={`passengerType-${index}`}>
                          <SelectValue placeholder="Select passenger type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="adult">Adult</SelectItem>
                          <SelectItem value="child">Child (2-12 years)</SelectItem>
                          <SelectItem value="infant">Infant (under 2 years)</SelectItem>
                          <SelectItem value="senior">Senior (65+ years)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <Label htmlFor={`specialRequests-${index}`}>Solicitudes especiales o adaptaciones</Label>
                    <Textarea
                      id={`specialRequests-${index}`}
                      value={passengers[index]?.specialRequests || ""}
                      onChange={(e) => handleInputChange(index, "specialRequests", e.target.value)}
                      placeholder="Ingrese cualquier solicitud especial o adaptaciones necesarias"
                      className="resize-none"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      <p className="text-sm text-gray-500">* Campos requeridos</p>
    </div>
  )
}
