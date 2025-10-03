
import { ChatMessage, Role, SearchResult } from '../types.js';

// This is a mocked service. In a real application, this would use @google/genai.
export const fetchChatResponse = (prompt: string): Promise<ChatMessage> => {
  return new Promise(resolve => {
    setTimeout(() => {
      const mockSearchResult: SearchResult = {
        answer: `I've analyzed your request regarding **"${prompt}"**. Here is a summary of my findings and a relevant code snippet to help you get started.

1.  **Understand the Core Problem**: The key is to manage state effectively in React.
2.  **Choose the Right Hook**: For this scenario, \`useState\` and \`useCallback\` are essential.
3.  **Implement the Solution**: See the code example below for a practical implementation.

This approach ensures performance and avoids common pitfalls like unnecessary re-renders.`,
        sources: [
          { url: '#', title: 'React Hooks Documentation', snippet: 'Official documentation for React Hooks, covering useState, useEffect, and more.' },
          { url: '#', title: 'Guide to useCallback', snippet: 'A deep dive into how and when to use the useCallback hook for performance optimization.' },
        ],
        followUpQuestions: [
            "How can I optimize this further?",
            "What is the difference between useCallback and useMemo?",
            "Show me an example with TypeScript."
        ]
      };

      const response: ChatMessage = {
        id: Date.now().toString(),
        role: Role.Assistant,
        content: {
            ...mockSearchResult,
            answer: `${mockSearchResult.answer}
\`\`\`typescript
import React, { useState, useCallback } from 'react';

const Counter: React.FC = () => {
  const [count, setCount] = useState(0);

  const increment = useCallback(() => {
    setCount(c => c + 1);
  }, []);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>Increment</button>
    </div>
  );
};

export default Counter;
\`\`\``
        },
        timestamp: new Date(),
      };
      resolve(response);
    }, 1500);
  });
};
