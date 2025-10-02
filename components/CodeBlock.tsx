
import React, { useState } from 'react';
import { Icon } from './Icon';

interface CodeBlockProps {
  language: string;
  code: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="bg-[#0d1117] rounded-md my-4 overflow-hidden">
      <div className="flex justify-between items-center px-4 py-1 bg-gray-800/50 text-xs text-gray-400">
        <span>{language || 'code'}</span>
        <button onClick={handleCopy} className="flex items-center gap-1.5 hover:text-white transition-colors">
          {copied ? <Icon.Check className="w-4 h-4 text-green-400" /> : <Icon.Copy className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Copy code'}
        </button>
      </div>
      <pre className="p-4 text-sm overflow-x-auto">
        <code className={`language-${language}`}>{code}</code>
      </pre>
    </div>
  );
};

export default CodeBlock;
