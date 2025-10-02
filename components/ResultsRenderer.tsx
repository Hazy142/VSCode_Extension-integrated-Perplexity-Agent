
import React from 'react';
import { SearchResult, Source } from '../types';
import CodeBlock from './CodeBlock';

interface ResultsRendererProps {
  result: string | SearchResult;
}

const SimpleMarkdownParser: React.FC<{ text: string }> = ({ text }) => {
    const parts = text.split(/(```[\s\S]*?```)/g);

    return (
        <>
            {parts.map((part, index) => {
                if (part.startsWith('```')) {
                    const codeMatch = part.match(/```(\w*)\n([\s\S]*?)```/);
                    if (codeMatch) {
                        const [, language, code] = codeMatch;
                        return <CodeBlock key={index} language={language} code={code.trim()} />;
                    }
                    return null;
                }
                
                const lines = part.split('\n').map((line, lineIndex) => {
                    // Simple bold and list support
                    const formattedLine = line
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/^- (.*)/g, '<li class="ml-4 list-disc">$1</li>');

                    return (
                        <span key={lineIndex} dangerouslySetInnerHTML={{ __html: formattedLine }} className="block" />
                    );
                });

                return <div key={index}>{lines}</div>;
            })}
        </>
    );
};


const ResultsRenderer: React.FC<ResultsRendererProps> = ({ result }) => {
  if (typeof result === 'string') {
    return <div className="prose prose-invert max-w-none text-gray-300"><SimpleMarkdownParser text={result} /></div>;
  }

  const { answer, sources, followUpQuestions } = result;

  return (
    <div className="space-y-6 text-gray-300">
      <div className="prose prose-invert max-w-none prose-p:text-gray-300 prose-strong:text-white prose-li:text-gray-300">
         <SimpleMarkdownParser text={answer} />
      </div>
      
      {sources && sources.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-400 mb-2">Sources</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {sources.map((source: Source, index: number) => (
              <a key={index} href={source.url} target="_blank" rel="noopener noreferrer" className="block p-2 bg-white/5 hover:bg-white/10 rounded-md text-xs">
                <p className="font-semibold text-blue-400 truncate">{source.title}</p>
                <p className="text-gray-400 line-clamp-2">{source.snippet}</p>
              </a>
            ))}
          </div>
        </div>
      )}

      {followUpQuestions && followUpQuestions.length > 0 && (
        <div>
           <h3 className="text-sm font-semibold text-gray-400 mb-2">Follow-up</h3>
           <div className="flex flex-wrap gap-2">
                {followUpQuestions.map((q, index) => (
                    <button key={index} className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-full text-xs text-gray-300">
                        {q}
                    </button>
                ))}
           </div>
        </div>
      )}
    </div>
  );
};

export default ResultsRenderer;
