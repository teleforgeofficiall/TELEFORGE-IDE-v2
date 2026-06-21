'use client';

import Editor, { loader } from '@monaco-editor/react';

loader.config({
  paths: {
    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.50.0/min/vs',
  },
});

const CUSTOM_THEME = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '6A9955' },
    { token: 'keyword', foreground: 'C586C0' },
    { token: 'string', foreground: 'CE9178' },
    { token: 'number', foreground: 'B5CEA8' },
    { token: 'type', foreground: '4EC9B0' },
    { token: 'function', foreground: 'DCDCAA' },
    { token: 'variable', foreground: '9CDCFE' },
    { token: 'constant', foreground: '4FC1FF' },
    { token: 'operator', foreground: 'D4D4D4' },
  ],
  colors: {
    'editor.background': '#0f0f1a',
    'editor.foreground': '#d4d4d4',
    'editor.lineHighlightBackground': '#1a1a2e',
    'editor.selectionBackground': '#264f78',
    'editor.inactiveSelectionBackground': '#3a3d41',
    'editorCursor.foreground': '#ec4899',
    'editorLineNumber.foreground': '#858585',
    'editorLineNumber.activeForeground': '#ec4899',
    'editor.selectionHighlightBackground': '#264f7840',
    'editorBracketMatch.background': '#0d3a58',
    'editorBracketMatch.border': '#ec4899',
    'editorGutter.background': '#0f0f1a',
    'editorWidget.background': '#1a1a2e',
    'editorWidget.border': '#2a2a4a',
    'editorSuggestWidget.background': '#1a1a2e',
    'editorSuggestWidget.border': '#2a2a4a',
    'editorSuggestWidget.selectedBackground': '#264f78',
    'tab.activeBackground': '#0f0f1a',
    'tab.activeForeground': '#ec4899',
    'tab.inactiveBackground': '#1a1a2e',
    'tab.border': '#2a2a4a',
    'editorBracketHighlight.foreground1': '#ffd700',
    'editorBracketHighlight.foreground2': '#da70d6',
    'editorBracketHighlight.foreground3': '#87ceeb',
  },
};

export default function MonacoEditorWrapper({ language, value, onChange, path }) {
  const handleBeforeMount = (monaco) => {
    monaco.editor.defineTheme('freecode-dark', CUSTOM_THEME);
  };

  return (
    <Editor
      height="100%"
      language={language || 'plaintext'}
      value={value || ''}
      onChange={onChange}
      theme="freecode-dark"
      path={path}
      options={{
        fontSize: 14,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontLigatures: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        lineNumbers: 'on',
        renderWhitespace: 'selection',
        tabSize: 2,
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
        smoothScrolling: true,
        padding: { top: 12, bottom: 12 },
        automaticLayout: true,
        bracketPairColorization: { enabled: true },
        wordWrap: 'on',
        formatOnPaste: true,
        renderLineHighlight: 'all',
        folding: true,
        foldingHighlight: true,
        foldingStrategy: 'indentation',
        autoClosingBrackets: 'always',
        autoClosingQuotes: 'always',
        matchBrackets: 'always',
        occurrencesHighlight: 'singleFile',
        selectionHighlight: true,
        codeLens: true,
        contextmenu: true,
        mouseWheelZoom: true,
        multiCursorModifier: 'alt',
        copyWithSyntaxHighlighting: true,
        dragAndDrop: true,
        linkedEditing: true,
        suggestOnTriggerCharacters: true,
        quickSuggestions: true,
      }}
      beforeMount={handleBeforeMount}
    />
  );
}
