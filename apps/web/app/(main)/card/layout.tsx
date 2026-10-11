
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main className="mt-20">{children}</main>
    </>
  );
}
