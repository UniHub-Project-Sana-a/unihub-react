import { AdminLayout } from "@/components/layout/AdminLayout";

interface PlaceholderPageProps {
  title: string;
}

export default function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <AdminLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <h1 className="text-3xl font-bold text-center">{title}</h1>
      </div>
    </AdminLayout>
  );
}
