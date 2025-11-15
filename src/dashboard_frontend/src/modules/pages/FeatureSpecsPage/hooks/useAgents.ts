import { useState, useEffect } from 'react';
import { AIAgentDTO } from '../../../../types';
import { useApi } from '../../../api/api';

export function useAgents() {
  const { projectId } = useApi();
  const [agents, setAgents] = useState<AIAgentDTO[]>([]);

  useEffect(() => {
    const loadAgents = async () => {
      if (!projectId) return;

      try {
        const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/agents`);
        if (response.ok) {
          const data = await response.json();
          setAgents(data.agents || []);
        }
      } catch (error) {
        console.error('Failed to load agents:', error);
      }
    };

    loadAgents();
  }, [projectId]);

  return { agents };
}
