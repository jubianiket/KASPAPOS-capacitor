
import MenuManagement from '@/components/menu-management';

export default function MenuPage() {
  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <h1 className="text-3xl font-bold mb-6">Menu Management</h1>
      <MenuManagement />
    </div>
  );
}
