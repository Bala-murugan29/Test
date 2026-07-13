import MonacoEditor from '@monaco-editor/react';
import { Language, LANGUAGE_MONACO_MAP } from '@/types/coding.types';
import { useTheme } from '@/hooks/useTheme';

interface CodeEditorProps {
  language: Language;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  height?: string;
}

export function CodeEditor({ language, value, onChange, readOnly = false, height = '100%' }: CodeEditorProps) {
  const { theme } = useTheme();

  return (
    <MonacoEditor
      height={height}
      language={LANGUAGE_MONACO_MAP[language]}
      value={value}
      theme={theme === 'dark' ? 'vs-dark' : 'vs'}
      onChange={(v) => onChange(v ?? '')}
      options={{
        fontSize: 14,
        fontFamily: '"Fira Code", "JetBrains Mono", "Cascadia Code", monospace',
        fontLigatures: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        readOnly,
        tabSize: 4,
        insertSpaces: true,
        wordWrap: 'on',
        lineNumbers: 'on',
        renderLineHighlight: 'line',
        automaticLayout: true,
        padding: { top: 12, bottom: 12 },
        scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
        overviewRulerLanes: 0,
        guides: { indentation: true },
        contextmenu: false,
        bracketPairColorization: { enabled: true },
        suggestOnTriggerCharacters: true,
        quickSuggestions: true,
      }}
    />
  );
}
