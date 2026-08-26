import {
  ExecutiveStateProvider,
} from "@/contexts/ExecutiveStateContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ExecutiveStateProvider>
      {children}
    </ExecutiveStateProvider>
  );
}
