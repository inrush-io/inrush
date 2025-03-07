import { cn } from '@/lib/utils';
import Editor, { Monaco, OnMount } from '@monaco-editor/react';
import {
  ChevronDown,
  ChevronRight,
  File,
  FilePlus,
  Folder,
  FolderOpen,
  X,
} from 'lucide-react';
import { editor } from 'monaco-editor';
import { Resizable } from 're-resizable';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  IEC61131_LANGUAGE_ID,
  registerIEC61131Language,
} from '../server/iec61131/language-service';
import ConfirmationDialog from './ConfirmationDialog';
import ContextMenu from './ContextMenu';
import NewFileDialog from './NewFileDialog';

// Define the file tree data structure
interface FileNode {
  id: string;
  name: string;
  isFolder: boolean;
  children?: FileNode[];
  content?: string;
}

// Tree Node Component
const TreeNode: React.FC<{
  node: FileNode;
  level: number;
  onSelectFile: (node: FileNode) => void;
  selectedFileId: string | null;
  onContextMenu: (e: React.MouseEvent, node: FileNode) => void;
}> = ({ node, level, onSelectFile, selectedFileId, onContextMenu }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.isFolder) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!node.isFolder) {
      onSelectFile(node);
    } else {
      // For folders, toggle expansion when clicked
      setIsOpen(!isOpen);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    console.log('TreeNode handleContextMenu called for:', node.name);
    e.preventDefault();
    e.stopPropagation();
    onContextMenu(e, node);
  };

  return (
    <div>
      <div
        className={`flex items-center p-1 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 ${
          selectedFileId === node.id ? 'bg-gray-200 dark:bg-gray-700' : ''
        }`}
        style={{ paddingLeft: `${level * 12 + 4}px` }}
        onClick={handleSelect}
        onContextMenu={handleContextMenu}
        data-node-type={node.isFolder ? 'folder' : 'file'}
        data-node-id={node.id}
      >
        {node.isFolder && (
          <span className="flex items-center">
            <span className="mr-1 cursor-pointer" onClick={handleToggle}>
              {isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </span>
            <span className="mr-1">
              {isOpen ? (
                <FolderOpen className="h-4 w-4 text-yellow-500" />
              ) : (
                <Folder className="h-4 w-4 text-yellow-500" />
              )}
            </span>
          </span>
        )}
        {!node.isFolder && (
          <span className="ml-5 mr-1">
            <File className="h-4 w-4 text-blue-500" />
          </span>
        )}
        <span className="truncate">{node.name}</span>
      </div>
      {node.isFolder && isOpen && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              onSelectFile={onSelectFile}
              selectedFileId={selectedFileId}
              onContextMenu={onContextMenu}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// File Explorer Component
const FileExplorer: React.FC<{
  files: FileNode[];
  onSelectFile: (node: FileNode) => void;
  selectedFileId: string | null;
  onAddFile: (parentNode: FileNode | null, isFolder: boolean) => void;
  onDeleteFile: (node: FileNode) => void;
}> = ({ files, onSelectFile, selectedFileId, onAddFile, onDeleteFile }) => {
  const [contextMenu, setContextMenu] = useState({
    show: false,
    node: null as FileNode | null,
    type: '' as 'file' | 'folder' | 'background',
  });

  const handleContextMenu = (e: React.MouseEvent, node: FileNode) => {
    console.log('FileExplorer handleContextMenu called for:', node.name);
    e.preventDefault();
    e.stopPropagation(); // Ensure the event doesn't bubble up

    // Capture the mouse position from the event
    const { clientX, clientY } = e;
    console.log('Context menu position:', { x: clientX, y: clientY });

    // Update context menu state
    setContextMenu({
      show: true,
      node,
      type: node.isFolder ? 'folder' : 'file',
    });

    console.log('Context menu state updated:', {
      show: true,
      node: node.name,
      type: node.isFolder ? 'folder' : 'file',
    });
  };

  const handleBackgroundContextMenu = (e: React.MouseEvent) => {
    console.log('Background context menu triggered');
    e.preventDefault();
    e.stopPropagation(); // Ensure the event doesn't bubble up

    // Capture the mouse position from the event
    const { clientX, clientY } = e;
    console.log('Background context menu position:', {
      x: clientX,
      y: clientY,
    });

    // If we're clicking directly on a node, the node's onContextMenu handler will take care of it
    // This handler is only for clicks on the background
    setContextMenu({
      show: true,
      node: null,
      type: 'background',
    });
    console.log('Background context menu state updated');
  };

  const closeContextMenu = () => {
    console.log('Closing context menu');
    setContextMenu((prev) => ({ ...prev, show: false }));
  };

  // Add a useEffect to log when context menu state changes
  useEffect(() => {
    console.log('Context menu state:', contextMenu);
  }, [contextMenu]);

  return (
    <>
      <div className="h-full">
        <div className="p-2 font-semibold border-b dark:border-gray-700 flex justify-between items-center">
          <span>Files</span>
          <button
            onClick={() => onAddFile(null, false)}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md"
            title="Add new file"
          >
            <FilePlus className="h-4 w-4" />
          </button>
        </div>
        <div
          className="overflow-auto h-[calc(100%-40px)]"
          onContextMenu={handleBackgroundContextMenu}
        >
          {files.map((file) => (
            <TreeNode
              key={file.id}
              node={file}
              level={0}
              onSelectFile={onSelectFile}
              selectedFileId={selectedFileId}
              onContextMenu={handleContextMenu}
            />
          ))}
        </div>
      </div>

      {/* Render the context menu separately */}
      <ContextMenu
        show={contextMenu.show}
        node={contextMenu.node}
        type={contextMenu.type}
        onAddFile={onAddFile}
        onDelete={onDeleteFile}
        onClose={closeContextMenu}
      >
        <></>
      </ContextMenu>
    </>
  );
};

// Tab Component
const EditorTab: React.FC<{
  file: FileNode;
  isActive: boolean;
  onClick: () => void;
  onClose: () => void;
}> = ({ file, isActive, onClick, onClose }) => {
  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  return (
    <div
      className={cn(
        'flex items-center px-3 py-2 border-r dark:border-gray-700 cursor-pointer select-none',
        isActive
          ? 'bg-white dark:bg-gray-800 border-b-2 border-b-blue-500'
          : 'bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800',
      )}
      onClick={onClick}
    >
      <File size={14} className="mr-2 text-gray-500" />
      <span className="mr-2">{file.name}</span>
      <X
        size={14}
        className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        onClick={handleClose}
      />
    </div>
  );
};

// Update the component to accept initialFiles prop
interface MonacoEditorProps {
  initialFiles?: FileNode[];
}

const MonacoEditor = ({ initialFiles }: MonacoEditorProps) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const [files, setFiles] = useState<FileNode[]>(initialFiles ?? []);
  const [openFiles, setOpenFiles] = useState<FileNode[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [editorReady, setEditorReady] = useState(false);

  // Dialog states
  const [fileDialog, setFileDialog] = useState({
    isOpen: false,
    isFolder: false,
    parentNode: null as FileNode | null,
  });

  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    node: null as FileNode | null,
  });

  // Auto-open the first file from initialFiles if provided
  useEffect(() => {
    if (
      initialFiles &&
      initialFiles.length > 0 &&
      editorReady &&
      !activeFileId
    ) {
      // Find the first file (not folder) in the tree
      const findFirstFile = (nodes: FileNode[]): FileNode | null => {
        for (const node of nodes) {
          if (!node.isFolder) {
            return node;
          }
          if (node.children && node.children.length > 0) {
            const firstFile = findFirstFile(node.children);
            if (firstFile) {
              return firstFile;
            }
          }
        }
        return null;
      };

      const firstFile = findFirstFile(initialFiles);
      if (firstFile) {
        handleSelectFile(firstFile);
      }
    }
  }, [initialFiles, editorReady]);

  // Get the current theme from the DOM to avoid SSR issues
  const getCurrentTheme = () => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark')
        ? 'vs-dark'
        : 'vs';
    }
    return 'vs'; // Default to light theme for SSR
  };

  const [monacoTheme, setMonacoTheme] = useState(getCurrentTheme());

  // Update Monaco theme when the document theme changes
  useEffect(() => {
    const updateMonacoTheme = () => {
      const newTheme = document.documentElement.classList.contains('dark')
        ? 'vs-dark'
        : 'vs';
      setMonacoTheme(newTheme);

      // Update the editor theme if it exists
      if (monacoRef.current && editorRef.current) {
        monacoRef.current.editor.setTheme(newTheme);
      }
    };

    // Set initial theme
    updateMonacoTheme();

    // Create a mutation observer to watch for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.attributeName === 'class' &&
          mutation.target === document.documentElement
        ) {
          updateMonacoTheme();
        }
      });
    });

    // Start observing
    observer.observe(document.documentElement, { attributes: true });

    // Clean up
    return () => observer.disconnect();
  }, []);

  // Handle displaying file content in the editor
  const displayFileInEditor = useCallback(
    (file: FileNode) => {
      if (!editorRef.current || !monacoRef.current || !editorReady) {
        console.warn('Editor not ready yet');
        return;
      }

      // Determine language by file extension
      const extension = file.name.split('.').pop()?.toLowerCase();
      let language = 'plaintext';

      if (extension === 'js') language = 'javascript';
      if (extension === 'ts') language = 'typescript';
      if (extension === 'jsx' || extension === 'tsx') language = 'typescript';
      if (extension === 'json') language = 'json';
      if (extension === 'html') language = 'html';
      if (extension === 'css') language = 'css';
      if (extension === 'st') language = IEC61131_LANGUAGE_ID; // IEC61131-3 Structured Text

      try {
        // Create a unique URI for the model
        const uri = monacoRef.current.Uri.parse(`file:///${file.id}`);

        // Check if a model with this URI already exists
        let model = monacoRef.current.editor.getModel(uri);
        let isNewModel = false;

        // Store current cursor position and selection if we're updating an existing model
        let savedSelection = null;
        let savedScrollPosition = null;

        if (
          model &&
          editorRef.current.getModel()?.uri.toString() === uri.toString()
        ) {
          savedSelection = editorRef.current.getSelection();
          savedScrollPosition = editorRef.current.getScrollTop();
        }

        // Create new model if needed
        if (!model) {
          model =
            monacoRef.current.editor.createModel(
              file.content || '',
              language,
              uri,
            ) || null;
          isNewModel = true;
        }

        // If we have a model, set it as the active model
        if (model) {
          // Set the model to the editor - this is needed regardless of whether it's new or not
          editorRef.current.setModel(model);

          // Only update content for existing models if necessary - for new models the content is already set
          if (!isNewModel) {
            // Check if content actually needs updating (avoid unnecessary changes)
            const currentContent = model.getValue();
            if (currentContent !== file.content && file.content !== undefined) {
              // Save current position
              const position = editorRef.current.getPosition();

              // Use the pushEditOperations API for more controlled content updates
              const endLineNumber = model.getLineCount();
              const endColumn = model.getLineMaxColumn(endLineNumber);

              // Turn off event generation temporarily to avoid triggering worker
              // We're setting a flag to mark that we're programmatically setting content
              (model as any)._isSettingContent = true;

              model.pushEditOperations(
                [],
                [
                  {
                    range: {
                      startLineNumber: 1,
                      startColumn: 1,
                      endLineNumber,
                      endColumn,
                    },
                    text: file.content || '',
                  },
                ],
                () => null,
              );

              // Restore the flag
              setTimeout(() => {
                (model as any)._isSettingContent = false;
              }, 0);

              // Restore cursor if possible
              if (position) {
                editorRef.current.setPosition(position);
              }
            }
          }

          // Restore selection and scroll position
          if (savedSelection) {
            editorRef.current.setSelection(savedSelection);
          }

          if (savedScrollPosition !== null) {
            editorRef.current.setScrollTop(savedScrollPosition);
          }

          // Focus the editor after a short delay to ensure it's ready
          setTimeout(() => {
            if (editorRef.current) {
              editorRef.current.focus();

              // Only position cursor at beginning for new files
              if (isNewModel && editorRef.current.getModel()) {
                editorRef.current.setPosition({ lineNumber: 1, column: 1 });
              }
            }
          }, 10);
        }
      } catch (error) {
        console.error('Error updating editor content:', error);

        // Fallback approach with additional safety checks
        if (editorRef.current) {
          try {
            editorRef.current.setValue(file.content || '');
          } catch (fallbackError) {
            console.error('Fallback editor update also failed:', fallbackError);
          }
        }
      }
    },
    [editorReady],
  );

  // Handle editor mounting
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Set the initial theme
    monaco.editor.setTheme(monacoTheme);

    // Register the IEC61131 language (Structured Text)
    registerIEC61131Language(monaco);

    // Configure Monaco if needed
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });

    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2015,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      jsx: monaco.languages.typescript.JsxEmit.React,
      jsxFactory: 'React.createElement',
      reactNamespace: 'React',
    });

    // Initialize the IEC 61131-3 language services
    import('../server/iec61131/langium-monaco-setup').then(
      ({ setupLangiumMonaco }) => {
        // Set up the Langium language services
        setupLangiumMonaco(monaco);

        // Set up keyboard shortcut for formatting IEC 61131 files
        editor.addAction({
          id: 'format-st-document',
          label: 'Format Document',
          keybindings: [
            monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.KeyF,
          ],
          contextMenuGroupId: 'navigation',
          contextMenuOrder: 1.5,
          run: () => {
            // Execute the ST format command if it's an ST file
            const model = editor.getModel();
            if (model && model.getLanguageId() === 'iec-61131') {
              // Use a command that's registered by the setupLangiumMonaco function
              const formatAction = editor.getAction('st.formatDocument');
              if (formatAction) {
                formatAction.run();
              }
            }
          },
        });
      },
    );

    // Add Format Document command for structured text files
    const formatCommandId = 'format-st-document';
    editor.addAction({
      id: formatCommandId,
      label: 'Format Document',
      keybindings: [
        monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.KeyF,
      ],
      contextMenuGroupId: 'formatting',
      precondition: undefined,
      keybindingContext: undefined,
      run: (ed) => {
        // Create a custom formatter function
        const formatSTDocument = () => {
          const model = ed.getModel();
          if (!model || model.getLanguageId() !== 'iec61131') return;

          const lineCount = model.getLineCount();
          const edits = [];

          // Track indentation level
          let indentLevel = 0;

          // Define statements that increase indentation
          const indentIncreasePatterns = [
            /\b(PROGRAM|FUNCTION|FUNCTION_BLOCK|IF|ELSE|ELSIF|CASE|FOR|WHILE|REPEAT|VAR|VAR_INPUT|VAR_OUTPUT|VAR_IN_OUT)\b/i,
          ];

          // Define statements that decrease indentation
          const indentDecreasePatterns = [
            /\b(END_PROGRAM|END_FUNCTION|END_FUNCTION_BLOCK|END_IF|END_CASE|END_FOR|END_WHILE|UNTIL|END_VAR)\b/i,
            /\b(ELSE|ELSIF)\b/i,
          ];

          // Helper function to get the indentation of a line
          function getIndentation(line: string): string {
            const match = line.match(/^[ \t]*/);
            return match ? match[0] : '';
          }

          // Helper function to check if a line needs a semicolon
          function needsSemicolon(line: string): boolean {
            // Don't add semicolons to these statements
            if (!line || line.trim() === '' || line.endsWith(';')) {
              return false;
            }

            // Skip comments (both line comments and block comments)
            if (
              line.trim().startsWith('//') ||
              line.trim().startsWith('(*') ||
              line.trim().endsWith('*)')
            ) {
              return false;
            }

            // Skip adding semicolons to block statements and comments
            const skipPatterns = [
              /\b(PROGRAM|END_PROGRAM|FUNCTION|END_FUNCTION|FUNCTION_BLOCK|END_FUNCTION_BLOCK)\b/i,
              /\b(IF|THEN|ELSE|ELSIF|END_IF|CASE|OF|END_CASE)\b/i,
              /\b(FOR|TO|BY|DO|END_FOR|WHILE|DO|END_WHILE|REPEAT|UNTIL|END_REPEAT)\b/i,
              /\b(VAR|VAR_INPUT|VAR_OUTPUT|VAR_IN_OUT|END_VAR|TYPE|END_TYPE|STRUCT|END_STRUCT)\b/i,
              /\b(EXIT)\b/i, // EXIT statement doesn't need a semicolon per the standard
              /^\/\/.*$/, // Line comments
              /\(\*.*\*\)/, // Block comments
            ];

            for (const pattern of skipPatterns) {
              if (pattern.test(line)) {
                return false;
              }
            }

            // Add semicolons to assignment statements and other expressions
            const needsSemicolonPatterns = [
              /:=/, // Assignment
              /\b[A-Za-z_]\w*\(.*\)/, // Function call (must have opening and closing parentheses)
              /\+|-|\*|\/|<|>|<=|>=|<>|=|AND|OR|XOR|NOT|MOD/i, // Expressions with operators
              /\bRETURN\b/i, // RETURN statement needs a semicolon
            ];

            for (const pattern of needsSemicolonPatterns) {
              if (pattern.test(line)) {
                return true;
              }
            }

            return false;
          }

          // Process each line
          for (let lineNumber = 1; lineNumber <= lineCount; lineNumber++) {
            const lineText = model.getLineContent(lineNumber);
            const trimmedLine = lineText.trim();

            // Skip empty lines and comments
            if (
              !trimmedLine ||
              trimmedLine.startsWith('//') ||
              trimmedLine.startsWith('(*')
            ) {
              continue;
            }

            // Check if this line should decrease the indent level before indenting
            let decreasedThisLine = false;
            for (const pattern of indentDecreasePatterns) {
              if (pattern.test(trimmedLine)) {
                indentLevel = Math.max(0, indentLevel - 1);
                decreasedThisLine = true;
                break;
              }
            }

            // Calculate the proper indentation
            const properIndent = '  '.repeat(indentLevel);
            const currentIndent = getIndentation(lineText);

            // Add edit for indentation if it's incorrect
            if (currentIndent !== properIndent) {
              edits.push({
                range: {
                  startLineNumber: lineNumber,
                  startColumn: 1,
                  endLineNumber: lineNumber,
                  endColumn: currentIndent.length + 1,
                },
                text: properIndent,
              });
            }

            // Check if we need to add a semicolon
            if (needsSemicolon(trimmedLine)) {
              edits.push({
                range: {
                  startLineNumber: lineNumber,
                  startColumn: model.getLineMaxColumn(lineNumber),
                  endLineNumber: lineNumber,
                  endColumn: model.getLineMaxColumn(lineNumber),
                },
                text: ';',
              });
            }

            // Check if this line should increase the indent level for the next line
            if (!decreasedThisLine) {
              for (const pattern of indentIncreasePatterns) {
                if (pattern.test(trimmedLine)) {
                  indentLevel++;
                  break;
                }
              }
            }
          }

          // Apply all the edits at once
          if (edits.length > 0) {
            ed.executeEdits('format-document', edits);
          }
        };

        // Execute the formatting
        formatSTDocument();
      },
    });

    // Add a UI button for formatting when the editor has ST files
    const formatButton = document.createElement('div');
    formatButton.className = 'monaco-format-button';
    formatButton.style.position = 'absolute';
    formatButton.style.bottom = '10px';
    formatButton.style.right = '10px';
    formatButton.style.zIndex = '100';
    formatButton.style.backgroundColor = '#007acc';
    formatButton.style.color = 'white';
    formatButton.style.padding = '5px 10px';
    formatButton.style.borderRadius = '3px';
    formatButton.style.cursor = 'pointer';
    formatButton.style.fontSize = '12px';
    formatButton.style.display = 'none';
    formatButton.textContent = 'Format Document (Alt+Shift+F)';
    formatButton.title =
      'Format IEC 61131-3 code with proper indentation and semicolons';
    formatButton.onclick = () => {
      const action = editor.getAction(formatCommandId);
      if (action) {
        action.run();
      }
    };

    // Add the button to the editor container
    setTimeout(() => {
      const editorContainer = editor.getDomNode();
      if (editorContainer) {
        editorContainer.parentElement?.appendChild(formatButton);
      }
    }, 200);

    // Show/hide button based on language
    editor.onDidChangeModel(() => {
      setTimeout(() => {
        const model = editor.getModel();
        if (model && model.getLanguageId() === 'iec61131') {
          formatButton.style.display = 'block';
        } else {
          formatButton.style.display = 'none';
        }
      }, 100);
    });

    // Signal that the editor is ready
    setEditorReady(true);

    // If we have an active file already, display it
    if (activeFileId) {
      const activeFile = openFiles.find((file) => file.id === activeFileId);
      if (activeFile) {
        // Use a delay to ensure the editor is fully initialized
        setTimeout(() => displayFileInEditor(activeFile), 300);
      }
    }
  };

  // Use our custom language client hook - but only after editor is ready
  useEffect(() => {
    if (editorReady && monacoRef.current && editorRef.current) {
      console.log('Initializing language client with delay');
      // Start language client after editor is fully ready
      const delay = setTimeout(() => {
        console.log('Language client initialized');
        // This is where we would normally call the hook, but we can't call hooks conditionally
        // Instead, we'll set a flag that will be used by the language client hook
        const worker = new Worker(
          new URL('../workers/langium-worker.ts', import.meta.url),
          { type: 'module' },
        );

        setupLanguageClient(monacoRef.current!, editorRef.current!, worker);

        return () => {
          worker.terminate();
        };
      }, 500);

      return () => clearTimeout(delay);
    }
  }, [editorReady]);

  // Language client setup (not a hook)
  function setupLanguageClient(
    monaco: Monaco,
    editor: editor.IStandaloneCodeEditor,
    worker: Worker,
  ) {
    let currentModel: editor.ITextModel | null = null;
    let modelChangeSubscription: { dispose: () => void } | null = null;
    let isProcessingDiagnostics = false;
    let contentChangeDebounce: ReturnType<typeof setTimeout> | null = null;
    let lastContent = '';

    try {
      // Handle worker messages
      worker.onmessage = (event) => {
        console.log('Message from worker:', event.data);

        // Handle diagnostics
        if (
          event.data.type === 'diagnostics' &&
          event.data.uri &&
          event.data.diagnostics
        ) {
          try {
            // Ensure we don't trigger another content change while updating markers
            isProcessingDiagnostics = true;

            const model = monaco.editor.getModel(
              monaco.Uri.parse(event.data.uri),
            );

            if (model) {
              monaco.editor.setModelMarkers(
                model,
                'langium',
                event.data.diagnostics.map((d: any) => ({
                  startLineNumber: d.range.start.line + 1,
                  startColumn: d.range.start.character + 1,
                  endLineNumber: d.range.end.line + 1,
                  endColumn: d.range.end.character + 1,
                  message: d.message,
                  severity:
                    d.severity === 1
                      ? monaco.MarkerSeverity.Error
                      : d.severity === 2
                        ? monaco.MarkerSeverity.Warning
                        : monaco.MarkerSeverity.Info,
                })),
              );
            }

            // Re-enable content change processing
            setTimeout(() => {
              isProcessingDiagnostics = false;
            }, 0);
          } catch (error) {
            console.error('Error setting model markers:', error);
            isProcessingDiagnostics = false;
          }
        }
      };

      // Set up content change handler
      const setupModelChangeListener = () => {
        // Clean up previous subscription if it exists
        if (modelChangeSubscription) {
          modelChangeSubscription.dispose();
          modelChangeSubscription = null;
        }

        currentModel = editor.getModel();
        if (currentModel) {
          modelChangeSubscription = currentModel.onDidChangeContent(() => {
            try {
              // Skip if we're currently processing diagnostics to avoid infinite loops
              if (isProcessingDiagnostics) {
                return;
              }

              // Skip if this is a programmatic content update
              // We added a flag to the model in the displayFileInEditor function
              if ((currentModel as any)._isSettingContent) {
                return;
              }

              // Get current content
              const content = currentModel?.getValue() || '';

              // Skip if content hasn't changed
              if (content === lastContent) {
                return;
              }

              lastContent = content;

              // Debounce content changes to reduce worker messages and only send after typing pauses
              if (contentChangeDebounce) {
                clearTimeout(contentChangeDebounce);
              }

              contentChangeDebounce = setTimeout(() => {
                worker.postMessage({
                  type: 'documentChange',
                  uri: currentModel?.uri.toString(),
                  content,
                });
                contentChangeDebounce = null;
              }, 800); // Longer delay to ensure user has finished typing
            } catch (error) {
              console.error('Error posting to worker:', error);
            }
          });
        }
      };

      // Initial setup
      setupModelChangeListener();

      // Listen for model changes in the editor
      const modelChangeDisposable = editor.onDidChangeModel(() => {
        // Reset state when model changes
        lastContent = '';
        if (contentChangeDebounce) {
          clearTimeout(contentChangeDebounce);
          contentChangeDebounce = null;
        }
        isProcessingDiagnostics = false;

        setupModelChangeListener();

        // Send initial content to worker with some delay to ensure editor is ready
        const model = editor.getModel();
        if (model) {
          setTimeout(() => {
            const content = model.getValue();
            lastContent = content;
            worker.postMessage({
              type: 'documentChange',
              uri: model.uri.toString(),
              content,
            });
          }, 300);
        }
      });

      // Return cleanup function
      return () => {
        modelChangeDisposable.dispose();
        if (modelChangeSubscription) {
          modelChangeSubscription.dispose();
        }
        if (contentChangeDebounce) {
          clearTimeout(contentChangeDebounce);
        }
      };
    } catch (error) {
      console.error('Error initializing language worker:', error);
      return () => {};
    }
  }

  // Get active file
  const activeFile = openFiles.find((file) => file.id === activeFileId) || null;

  // Handle file selection
  const handleSelectFile = useCallback(
    (node: FileNode) => {
      if (!node.isFolder) {
        // Check if file is already open
        const isFileOpen = openFiles.some((file) => file.id === node.id);

        if (!isFileOpen) {
          // Add to open files
          setOpenFiles((prev) => [...prev, node]);
        }

        // Set active file
        setActiveFileId(node.id);

        // Wait until the editor is fully ready before displaying the file
        if (editorReady && editorRef.current && monacoRef.current) {
          // Display the file with a small delay to ensure all components are ready
          setTimeout(() => {
            try {
              displayFileInEditor(node);
            } catch (error) {
              console.error('Error displaying file in editor:', error);

              // Simple fallback for error cases
              if (editorRef.current) {
                try {
                  editorRef.current.setValue(node.content || '');
                } catch (fallbackError) {
                  console.error('Fallback display also failed:', fallbackError);
                }
              }
            }
          }, 50);
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [openFiles, displayFileInEditor, editorReady],
  );

  // Update editor content when activeFileId changes
  useEffect(() => {
    if (activeFileId && editorRef.current && monacoRef.current) {
      const activeFile = openFiles.find((file) => file.id === activeFileId);

      if (activeFile) {
        // Force a delay before updating content to ensure the editor is ready
        setTimeout(() => {
          displayFileInEditor(activeFile);
        }, 50);
      }
    }
  }, [activeFileId, openFiles, displayFileInEditor]);

  // Handle tab click
  const handleTabClick = (fileId: string) => {
    const file = openFiles.find((f) => f.id === fileId);
    if (file) {
      // Set as active file
      setActiveFileId(file.id);
    }
  };

  // Handle tab close
  const handleTabClose = (fileId: string) => {
    // Remove from open files
    setOpenFiles((prev) => prev.filter((file) => file.id !== fileId));

    // If closing the active file, activate another file if available
    if (fileId === activeFileId) {
      const remainingFiles = openFiles.filter((file) => file.id !== fileId);
      if (remainingFiles.length > 0) {
        setActiveFileId(remainingFiles[remainingFiles.length - 1].id);
        handleSelectFile(remainingFiles[remainingFiles.length - 1]);
      } else {
        setActiveFileId(null);
      }
    }
  };

  // Update file content when editor changes
  useEffect(() => {
    if (!editorRef.current || !activeFile) return;

    // Use a debounce mechanism to prevent rapid updates
    let debounceTimeout: NodeJS.Timeout | null = null;
    let isUpdating = false;

    const updateContent = () => {
      // Skip if we're already in the middle of an update
      if (isUpdating) return;

      isUpdating = true;

      const newContent = editorRef.current?.getValue() || '';

      // Only update if content has actually changed
      if (activeFile.content !== newContent) {
        const updateFileContent = (nodes: FileNode[]): FileNode[] => {
          return nodes.map((node) => {
            if (node.id === activeFile.id) {
              return {
                ...node,
                content: newContent,
              };
            }

            if (node.children) {
              return {
                ...node,
                children: updateFileContent(node.children),
              };
            }

            return node;
          });
        };

        // Update in the files tree
        setFiles(updateFileContent(files));

        // Update in open files
        setOpenFiles((prev) =>
          prev.map((file) =>
            file.id === activeFile.id ? { ...file, content: newContent } : file,
          ),
        );
      }

      isUpdating = false;
    };

    const handleContentChange = () => {
      // Clear any existing timeout
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }

      // Set a new timeout to update after a delay
      debounceTimeout = setTimeout(() => {
        updateContent();
      }, 300); // 300ms debounce
    };

    const disposable =
      editorRef.current.onDidChangeModelContent(handleContentChange);

    return () => {
      // Clean up
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
      disposable.dispose();
    };
  }, [activeFile, files]);

  // Update files if initialFiles changes
  useEffect(() => {
    if (initialFiles) {
      setFiles(initialFiles);
    }
  }, [initialFiles]);

  // Function to generate a unique ID
  const generateId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Handle adding a new file or folder
  const handleAddFile = (parentNode: FileNode | null, isFolder: boolean) => {
    setFileDialog({
      isOpen: true,
      isFolder,
      parentNode,
    });
  };

  // Create new file or folder
  const createNewFileOrFolder = (name: string) => {
    const { parentNode, isFolder } = fileDialog;

    // Create new node
    const newNode: FileNode = {
      id: generateId(),
      name,
      isFolder,
      content: isFolder ? undefined : '',
      children: isFolder ? [] : undefined,
    };

    // If parent node is provided, add as child
    if (parentNode) {
      setFiles((prevFiles) => {
        // Deep clone the files array
        const updatedFiles = JSON.parse(JSON.stringify(prevFiles));

        // Find and update the parent node in the cloned structure
        const findAndAddToParent = (nodes: FileNode[]): boolean => {
          for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];

            if (node.id === parentNode.id) {
              // Found the parent node, add the new child
              // Ensure parent node has a children array if it's a folder
              if (node.isFolder) {
                // Initialize children array if it doesn't exist
                node.children = node.children || [];
                node.children.push(newNode);
                return true;
              }
              return false; // Not a folder, can't add children
            }

            // Recursively search in children if they exist
            if (
              node.isFolder &&
              node.children &&
              findAndAddToParent(node.children)
            ) {
              return true;
            }
          }
          return false;
        };

        findAndAddToParent(updatedFiles);
        return updatedFiles;
      });
    } else {
      // Add at root level
      setFiles((prevFiles) => [...prevFiles, newNode]);
    }

    // If it's a file, select it
    if (!isFolder) {
      // Adding to open files and selecting
      setOpenFiles((prev) => [...prev, newNode]);
      setActiveFileId(newNode.id);
    }
  };

  // Handle file deletion
  const handleDeleteFile = (node: FileNode) => {
    setDeleteDialog({
      isOpen: true,
      node,
    });
  };

  // Confirm file deletion
  const confirmDelete = () => {
    const nodeToDelete = deleteDialog.node;
    if (!nodeToDelete) return;

    // Remove from files
    setFiles((prevFiles) => {
      // Deep clone
      const updatedFiles = JSON.parse(JSON.stringify(prevFiles));

      // Helper function to remove node
      const removeNode = (nodes: FileNode[]): FileNode[] => {
        // Filter out the node to delete at current level
        const filtered = nodes.filter((n) => n.id !== nodeToDelete.id);

        // Recursively process children
        return filtered.map((node) => {
          if (node.isFolder && node.children) {
            return {
              ...node,
              children: removeNode(node.children),
            };
          }
          return node;
        });
      };

      return removeNode(updatedFiles);
    });

    // If deleted file is open, close it
    if (openFiles.some((f) => f.id === nodeToDelete.id)) {
      setOpenFiles((prev) => prev.filter((f) => f.id !== nodeToDelete.id));

      // If it's the active file, set a new active file or null
      if (activeFileId === nodeToDelete.id) {
        const remainingFiles = openFiles.filter(
          (f) => f.id !== nodeToDelete.id,
        );
        if (remainingFiles.length > 0) {
          setActiveFileId(remainingFiles[0].id);
        } else {
          setActiveFileId(null);
        }
      }
    }

    // Close dialog
    setDeleteDialog({ isOpen: false, node: null });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="h-full flex">
        <Resizable
          defaultSize={{ width: '20%', height: '100%' }}
          minWidth={200}
          maxWidth="50%"
          enable={{ right: true }}
          className="border-r dark:border-gray-700"
        >
          <FileExplorer
            files={files}
            onSelectFile={handleSelectFile}
            selectedFileId={activeFileId}
            onAddFile={handleAddFile}
            onDeleteFile={handleDeleteFile}
          />
        </Resizable>

        <div className="flex-1 flex flex-col">
          <div className="flex border-b dark:border-gray-700 bg-gray-100 dark:bg-gray-900">
            {openFiles.map((file) => (
              <EditorTab
                key={file.id}
                file={file}
                isActive={file.id === activeFileId}
                onClick={() => handleTabClick(file.id)}
                onClose={() => handleTabClose(file.id)}
              />
            ))}
          </div>
          <div className="flex-1 h-full">
            <Editor
              height="100%"
              defaultLanguage="plaintext"
              theme={monacoTheme}
              onMount={handleEditorDidMount}
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 14,
                wordWrap: 'on',
              }}
            />
          </div>
        </div>
      </div>

      {/* File/Folder Creation Dialog */}
      <NewFileDialog
        isOpen={fileDialog.isOpen}
        isFolder={fileDialog.isFolder}
        onClose={() => setFileDialog({ ...fileDialog, isOpen: false })}
        onSubmit={createNewFileOrFolder}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteDialog.isOpen}
        title={`Delete ${deleteDialog.node?.isFolder ? 'Folder' : 'File'}`}
        message={`Are you sure you want to delete "${deleteDialog.node?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        isDestructive={true}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialog({ isOpen: false, node: null })}
      />
    </div>
  );
};

export default MonacoEditor;
