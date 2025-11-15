import { useState, useEffect } from 'react';
import { SpecDirectoryDTO } from '../../../../types';
import { useApi } from '../../../api/api';

export function useSpecs() {
  const { projectId } = useApi();
  const [specs, setSpecs] = useState<SpecDirectoryDTO[]>([]);
  const [selectedSpec, setSelectedSpec] = useState<SpecDirectoryDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSpecs = async () => {
      if (!projectId) return;

      setLoading(true);
      try {
        const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/specs/list`);
        if (response.ok) {
          const data = await response.json();
          setSpecs(data.specs || []);
          if (data.specs && data.specs.length > 0) {
            setSelectedSpec(data.specs[0]);
          }
        }
      } catch (error) {
        console.error('Failed to load specs:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSpecs();
  }, [projectId]);

  return { specs, selectedSpec, setSelectedSpec, loading };
}
