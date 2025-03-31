interface AiSuggestionProps {
  suggestion: string;
  onAccept: () => void;
  onDismiss: () => void;
}

export function AiSuggestion({ suggestion, onAccept, onDismiss }: AiSuggestionProps) {
  return (
    <div className="ml-4 pl-4 border-l-4 border-primary/40 py-1">
      <p className="text-sm text-gray-500">AI suggestion:</p>
      <p className="text-sm font-medium text-gray-800 ai-suggestion">{suggestion}</p>
      <div className="mt-1 flex space-x-2">
        <button 
          className="text-xs text-primary hover:text-primary/80"
          onClick={onAccept}
        >
          Accept
        </button>
        <button 
          className="text-xs text-gray-500 hover:text-gray-700"
          onClick={onDismiss}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
