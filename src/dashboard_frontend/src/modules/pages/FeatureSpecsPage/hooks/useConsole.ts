import { useState } from 'react';

export function useConsole() {
  const [showConsole, setShowConsole] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [consoleCommand, setConsoleCommand] = useState<string>('');
  const [consoleTaskId, setConsoleTaskId] = useState<string>('');
  const [consoleProgress, setConsoleProgress] = useState<number>(0);

  const openConsole = (taskId: string, agentName: string) => {
    setConsoleTaskId(taskId);
    setConsoleCommand(`${agentName} - Task ${taskId}`);
    setConsoleOutput([`Initializing ${agentName} agent...`, '']);
    setConsoleProgress(0);
    setShowConsole(true);
  };

  const closeConsole = () => {
    setShowConsole(false);
  };

  return {
    showConsole,
    consoleOutput,
    consoleCommand,
    consoleTaskId,
    consoleProgress,
    openConsole,
    closeConsole,
    setConsoleOutput,
    setConsoleProgress,
  };
}
