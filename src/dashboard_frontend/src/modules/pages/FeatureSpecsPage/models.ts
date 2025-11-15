export interface Task {
  id: string;
  completed: boolean;
  parallel: boolean;
  userStory?: string;
  description: string;
  line: string;
}

export interface Phase {
  name: string;
  description: string;
  tasks: Task[];
}
