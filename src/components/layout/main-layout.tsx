import SideBar from "./side-bar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-50">
      <SideBar />
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  );
} 