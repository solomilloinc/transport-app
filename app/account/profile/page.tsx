import { PageHeader } from '@/components/dashboard/page-header';
import { ClientAccountProfile } from '@/components/account/client-account-profile';

export default function AccountProfilePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Mis datos"
        description="Revisa y actualiza la informacion de tu cuenta."
      />
      <ClientAccountProfile />
    </div>
  );
}
