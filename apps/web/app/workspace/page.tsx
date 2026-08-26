import ExecutiveShell from "@/components/dashboard/ExecutiveShell";

import { ExecutiveStateProvider } from "@/contexts/ExecutiveStateContext";

export default function WorkspacePage() {

  return (

    <ExecutiveStateProvider>

      <ExecutiveShell />

    </ExecutiveStateProvider>

  );

}
