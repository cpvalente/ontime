import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { TRANSFORMERS } from '@lexical/markdown';
import { $getRoot, $getSelection, EditorState, FORMAT_TEXT_COMMAND, LexicalEditor, $isRangeSelection, SELECTION_CHANGE_COMMAND, COMMAND_PRIORITY_LOW, $createParagraphNode, $createTextNode, $patchStyleText } from 'lexical';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';
import { LinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import { ListItemNode, ListNode } from '@lexical/list';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import { TableNode, TableCellNode, TableRowNode } from '@lexical/table';

// Define initial editor configuration
const editorConfig = {
  namespace: 'MyEditor',
  theme: {
    ltr: 'ltr',
    rtl: 'rtl',
    placeholder: 'editor-placeholder',
    paragraph: 'editor-paragraph',
    quote: 'editor-quote',
    heading: {
      h1: 'editor-heading-h1',
      h2: 'editor-heading-h2',
      h3: 'editor-heading-h3',
      h4: 'editor-heading-h4',
      h5: 'editor-heading-h5',
    },
    list: {
      nested: {
        listitem: 'editor-nested-listitem',
      },
      ol: 'editor-list-ol',
      ul: 'editor-list-ul',
      listitem: 'editor-listitem',
    },
    link: 'editor-link',
    text: {
      bold: 'editor-text-bold',
      italic: 'editor-text-italic',
      underline: 'editor-text-underline',
      strikethrough: 'editor-text-strikethrough',
      underlineStrikethrough: 'editor-text-underlineStrikethrough',
      code: 'editor-text-code',
    },
    code: 'editor-code',
    codeHighlight: {
      atrule: 'editor-tokenAttr',
      attr: 'editor-tokenAttr',
      boolean: 'editor-tokenProperty',
      builtin: 'editor-tokenSelector',
      cdata: 'editor-tokenComment',
      char: 'editor-tokenSelector',
      clike: 'editor-tokenComment',
      comment: 'editor-tokenComment',
      contentType: 'editor-tokenComment',
      coord: 'editor-tokenComment',
      deleted: 'editor-tokenProperty',
      doctype: 'editor-tokenComment',
      doi: 'editor-tokenComment',
      entity: 'editor-tokenOperator',
      function: 'editor-tokenFunction',
      important: 'editor-tokenVariable',
      inserted: 'editor-tokenSelector',
      keyword: 'editor-tokenAttr',
      markup: 'editor-tokenComment',
      merged: 'editor-tokenComment',
      namespace: 'editor-tokenVariable',
      number: 'editor-tokenProperty',
      operator: 'editor-tokenOperator',
      prolog: 'editor-tokenComment',
      property: 'editor-tokenProperty',
      punctuation: 'editor-tokenPunctuation',
      regex: 'editor-tokenVariable',
      selector: 'editor-tokenSelector',
      string: 'editor-tokenSelector',
      style: 'editor-tokenComment',
      symbol: 'editor-tokenProperty',
      tag: 'editor-tokenProperty',
      url: 'editor-tokenOperator',
      variable: 'editor-tokenVariable',
    },
  },
  onError(error: Error) {
    throw error;
  },
  nodes: [
    HeadingNode,
    ListNode,
    ListItemNode,
    QuoteNode,
    CodeNode,
    CodeHighlightNode,
    TableNode,
    TableCellNode,
    TableRowNode,
    LinkNode,
  ],
};

interface RichTextEditorProps {
  initialValue?: string;
  onChange?: (value: string) => void;
}

export default function RichTextEditor({ initialValue, onChange }: RichTextEditorProps) {
  const [isFocused, setIsFocused] = useState(false);
  const editorRef = useRef<LexicalEditor | null>(null); // Use ref for editor instance
  const editorWrapperRef = useRef<HTMLDivElement>(null); // Ref for the entire editor + toolbar wrapper

  const handleEditorFocus = () => {
    setIsFocused(true);
  };

  // This handleBlur is for the wrapper around the editor and toolbar
  const handleWrapperBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    // Check if the new focused element is still within the editor wrapper
    if (editorWrapperRef.current && !editorWrapperRef.current.contains(event.relatedTarget as Node)) {
      setIsFocused(false);
    }
  };

  const handleChange = useCallback((editorState: EditorState) => {
    if (onChange) {
      editorState.read(() => {
        const root = $getRoot();
        // For now, sending plain text. Could be HTML or Lexical's format.
        onChange(root.getTextContent());
      });
    }
  }, [onChange]);

  // Placeholder for initial value loading
  useEffect(() => {
    const currentEditor = editorRef.current;
    if (currentEditor && initialValue && isFocused) { // only update if focused and has initial value
      currentEditor.update(() => {
        const root = $getRoot();
        root.clear();
        const paragraph = $createParagraphNode();
        paragraph.append($createTextNode(initialValue));
        root.append(paragraph);
        root.selectEnd(); // Move cursor to the end
      });
    }
  }, [initialValue, isFocused]); // Rerun when isFocused changes or initialValue changes (though initialValue should be stable)


  if (!isFocused) {
    return (
      <div
        onClick={handleEditorFocus}
        onFocus={handleEditorFocus}
        tabIndex={0}
        style={{ border: '1px solid #ccc', padding: '10px', minHeight: '50px', cursor: 'text' }}
        role="textbox" // for accessibility
        aria-placeholder="Click to edit..."
      >
        {initialValue || 'Click to edit...'}
      </div>
    );
  }

  // Prepare initial config for when the editor mounts
  const localEditorConfig = {
    ...editorConfig,
    editorState: initialValue && !editorRef.current // Only set initial state if editor hasn't been initialized yet with a value
      ? () => {
          const root = $getRoot();
          const paragraph = $createParagraphNode();
          paragraph.append($createTextNode(initialValue));
          root.append(paragraph);
        }
      : undefined,
  };

  return (
    <div ref={editorWrapperRef} onBlur={handleWrapperBlur} tabIndex={-1} style={{ border: '1px solid #ccc', position: 'relative', marginTop: '5px' }}>
      <LexicalComposer initialConfig={localEditorConfig}>
        <EditorInitializer editorRef={editorRef} />
        <ToolbarPlugin />
        <div style={{position: 'relative'}}> {/* Container for ContentEditable and Placeholder */}
          <RichTextPlugin
            contentEditable={<ContentEditable style={{ minHeight: '150px', padding: '10px', outline: 'none', resize: 'vertical', userSelect: 'text' }} />}
            placeholder={<div style={{ position: 'absolute', top: '10px', left: '10px', color: '#aaa', pointerEvents: 'none', userSelect: 'none' }}>Enter text...</div>}
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>
        <HistoryPlugin />
        <OnChangePlugin onChange={handleChange} />
        <LinkPlugin /> {/* LinkPlugin provides TOGGLE_LINK_COMMAND */}
        <ListPlugin />
        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
      </LexicalComposer>
    </div>
  );
}

// Helper component to get editor instance and attach it to a ref
function EditorInitializer({ editorRef }: { editorRef: React.MutableRefObject<LexicalEditor | null> }) {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    editorRef.current = editor;
    return () => {
      editorRef.current = null;
    };
  }, [editor, editorRef]);
  return null;
}


function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isLink, setIsLink] = useState(false);
  const [isBold, setIsBold] = useState(false);
  // Add states for other formats if needed, e.g., selectedTextColor, selectedBgColor

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat('bold'));
      // Update link state
      const node = selection.anchor.getNode();
      const parent = node.getParent();
      setIsLink(parent?.getType() === 'link' || node.getType() === 'link');
      // Could also get current text color/bg color here if needed
      // const style = selection.style;
      // setSelectedTextColor(style.color);
      // setSelectedBgColor(style.backgroundColor);
    }
  }, [editor]); // editor dependency is implicit via useLexicalComposerContext

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateToolbar();
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      // Potentially other listeners here, e.g., for text format changes
    );
  }, [editor, updateToolbar]);


  const toggleBold = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
  };

  const toggleLink = useCallback(() => {
    if (isLink) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null); // Remove link
    } else {
      const url = prompt('Enter link URL:');
      if (url) {
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
      }
    }
  }, [editor, isLink]);

  return (
    <div style={{ padding: '8px', borderBottom: '1px solid #ccc', display: 'flex', gap: '8px', userSelect: 'none' }}
      onMouseDown={(e) => e.preventDefault()} // Prevent editor blur when clicking toolbar
    >
      <button onClick={toggleBold} style={{ fontWeight: isBold ? 'bold' : 'normal' }}>B</button>
      <button onClick={toggleLink} style={{ fontWeight: isLink ? 'bold' : 'normal' }}>{isLink ? 'Unlink' : 'Link'}</button>
      <button onClick={applyTextColor}>Color</button>
      <button onClick={applyBackgroundColor}>BG Color</button>
      {/* Add more buttons here */}
    </div>
  );
}

function applyStyleToSelection(editor: LexicalEditor, styleKey: string, styleValue: string) {
  editor.update(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      $patchStyleText(selection, { [styleKey]: styleValue });
    }
  });
}

function applyTextColor() {
  const [editor] = useLexicalComposerContext();
  const color = prompt('Enter text color (e.g., red, #FF0000):');
  if (color) {
    applyStyleToSelection(editor, 'color', color);
  }
}

function applyBackgroundColor() {
  const [editor] = useLexicalComposerContext();
  const color = prompt('Enter background color (e.g., yellow, #FFFF00):');
  if (color) {
    // For background color, Lexical often uses 'highlight' format or direct background-color style
    // Using FORMAT_TEXT_COMMAND for 'highlight' might be one way if a plugin handles it.
    // Or, apply direct style:
    applyStyleToSelection(editor, 'background-color', color);
  }
}
