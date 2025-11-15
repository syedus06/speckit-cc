import { Phase, Task } from './models';

export function parseTasksMarkdown(content: string): Phase[] {
  const normalizedContent = content
    .replace(/\r\n/g, '\n')
    // Ensure each checkbox task starts on a new line even if markdown formatting placed them inline
    .replace(/([^\n])(-\s*\[(?:x|X| )\].*)/g, '$1\n$2')
    // Some sections omit a newline between headers, so insert one before each new phase declaration
    .replace(/([^\n])(#{1,2}\s+Phase\s+\d+)/g, '$1\n$2');

  const phases: Phase[] = [];
  const lines = normalizedContent.split('\n');
  let currentPhase: Phase | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Phase header - matches both "# Phase X" and "## Phase X"
    if (line.match(/^#{1,2}\s+Phase\s+\d+/i)) {
      if (currentPhase) {
        phases.push(currentPhase);
      }
      currentPhase = {
        name: line.replace(/^#+\s*/, '').trim(),
        description: '',
        tasks: []
      };
    }
    // Description lines after phase header
    else if (line.startsWith('**Purpose**:') || line.startsWith('**Goal**:')) {
      if (currentPhase) {
        currentPhase.description = line.replace(/^\*\*[^*]+\*\*:\s*/, '').trim();
      }
    }
    // Tasks - match checkbox format
    else if (line.match(/^-\s*\[(x| |X)\]/i)) {
      if (!currentPhase) {
        // Create a default phase if we find tasks without a phase header
        currentPhase = {
          name: 'Tasks',
          description: '',
          tasks: []
        };
      }

      const completed = line.match(/\[(x|X)\]/i) !== null;
      let taskId = '';
      let description = '';

      // Format 1: **T001**: Description (bold with colon)
      let match = line.match(/\*\*([A-Z]+\d+)\*\*?:?\s*(.+)/i);
      if (match) {
        taskId = match[1].trim();
        description = match[2].trim();
      } else {
        // Format 2: T001 [P] [US1] Description (plain with optional markers)
        // Remove checkbox and extract task ID
        match = line.match(/^-\s*\[(x| |X)\]\s+([A-Z]+\d+)\s+(.+)/i);
        if (match) {
          taskId = match[2].trim();
          let rest = match[3].trim();

          // Remove [P] and [US#] markers from description
          rest = rest.replace(/\ \[P\]/g, '').replace(/\ \[US\d+\]/g, '').trim();
          description = rest;
        }
      }

      // Extract metadata
      const parallelMatch = line.match(/\ \[P\]/);
      const userStoryMatch = line.match(/\ \[US\d+\]/);

      if (taskId) {
        const task: Task = {
          id: taskId,
          completed,
          parallel: parallelMatch !== null,
          userStory: userStoryMatch ? userStoryMatch[0] : undefined,
          description: description || line.replace(/^-\s*\[(x| |X)\]\s*/i, '').trim(),
          line: line.trim()
        };
        currentPhase.tasks.push(task);
      }
    }
  }

  if (currentPhase && currentPhase.tasks.length > 0) {
    phases.push(currentPhase);
  }

  return phases;
}
