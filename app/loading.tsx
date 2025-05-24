import { RefreshCw } from 'lucide-react';

export default function Loading() {
  return (
    <div className="p-8 text-center">
      <div className="flex items-center justify-center">
        <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
      <p className="mt-4 text-gray-600">Loading</p>
    </div>
  );
}
