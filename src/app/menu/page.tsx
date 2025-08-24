import { getMenuItems } from '@/lib/supabase';
import MenuClientPage from './menu-client-page';

// This is now a Next.js Server Component.
// It fetches data on the server and passes it to a Client Component.
export default async function MenuPage() {
  const menuItems = await getMenuItems();

  return <MenuClientPage initialMenuItems={menuItems} />;
}
