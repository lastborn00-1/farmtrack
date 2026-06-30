import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="flex h-full flex-col bg-background overflow-y-auto mobile-scroll scrollbar-hide">
      <Outlet />
    </div>
  );
}
