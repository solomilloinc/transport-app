import { PageHeader } from '@/components/dashboard/page-header';
import { ClientAccountBookings } from '@/components/account/client-account-bookings';

export default function AccountBookingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Mis reservas"
        description="Consulta las reservas pendientes asociadas a tu cuenta."
      />
      <ClientAccountBookings />
    </div>
  );
}
