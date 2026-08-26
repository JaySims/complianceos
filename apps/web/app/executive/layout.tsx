import {
  ExecutiveStateProvider,
} from "@/contexts/ExecutiveStateContext";

export default function ExecutiveLayout({
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
