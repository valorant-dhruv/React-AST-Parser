import React, { useEffect, useState, useRef } from 'react';
import ASTParser from './parser/ASTParser.js';
import ASTVisualizer from './parser/ASTVisualiser.js';

export default function App() {
  const [sampleCode, setSampleCode] = useState('');
  const [lineNodeMap, setLineNodeMap] = useState(new Map());
  const [selectedLine, setSelectedLine] = useState(null);
  const visualizerRef = useRef(null);
  
  useEffect(() => {
    // Read sample code from file
    const loadAndParseCode = async () => {
      try {
        // Read the Counter.jsx file from public directory
        const response = await fetch('/Counter.jsx');
        const code = await response.text();
        
        setSampleCode(code);
        console.log('Loaded sample code:', code.substring(0, 100) + '...');
        
        // Parse and visualize
        const parser = new ASTParser();
        const ast = await parser.parseCode(code);
        
        // Debug: Log the AST structure to see if locations are present
        console.log('Parsed AST:', ast);
        if (ast && ast.loc) {
          console.log('AST has location info:', ast.loc);
        }
        
        // Debug: Check if AST has body and if nodes have location info
        if (ast && ast.body) {
          console.log('AST body length:', ast.body.length);
          ast.body.forEach((node, index) => {
            console.log(`Body node ${index}:`, {
              type: node.type,
              hasLoc: !!node.loc,
              loc: node.loc,
              startLine: node.loc?.start?.line,
              endLine: node.loc?.end?.line
            });
          });
        }
        
        const visualizer = new ASTVisualizer(ast);
        
        // Store the visualizer reference
        visualizerRef.current = visualizer;
        
        // Create line-to-node mapping
        const mapping = createLineNodeMapping(ast, code);
        setLineNodeMap(mapping);
        
        visualizer.init('ast-container', mapping, (lineNumber) => {
          setSelectedLine(lineNumber);
          highlightCodeLine(lineNumber);
        });
        visualizer.render();
      } 
      
      catch (error) {
        console.error('Error loading sample code:', error);
        document.getElementById('ast-container').innerHTML = 'Error loading sample code: ' + error.message;
      }
    };

    loadAndParseCode();
  }, []);

  // Create mapping from line numbers to AST nodes
  const createLineNodeMapping = (ast, code) => {
    const mapping = new Map();
    const lines = code.split('\n');
    
    const traverseAST = (node, path = 'root') => {
      if (!node || typeof node !== 'object') return;
      
      // If node has location information, map it to lines
      if (node.loc) {
        const startLine = node.loc.start.line;
        const endLine = node.loc.end.line;
        
        console.log(`Mapping node ${node.type} (${path}) to lines ${startLine}-${endLine}`);
        
        for (let line = startLine; line <= endLine; line++) {
          if (!mapping.has(line)) {
            mapping.set(line, []);
          }
          mapping.get(line).push({
            node,
            path,
            type: node.type,
            start: node.loc.start,
            end: node.loc.end
          });
        }
      } else {
        console.log(`Node ${node.type} (${path}) has no location info`);
      }
      
      // Traverse children
      const children = getNodeChildren(node);
      children.forEach((child, index) => {
        const childKey = getChildKey(node, index);
        const childPath = `${path}.${childKey}`;
        traverseAST(child, childPath);
      });
    };
    
    traverseAST(ast);
    
    // Debug: Log the mapping to see what's being created
    console.log('Line to node mapping:', mapping);
    
    return mapping;
  };

  // Get children of a node (helper function)
  const getNodeChildren = (node) => {
    if (!node || typeof node !== 'object') return [];
    
    const children = [];
    const exclude = ['type', 'start', 'end', 'loc', 'range', 'raw'];
    
    Object.keys(node).forEach(key => {
      if (exclude.includes(key)) return;
      
      const value = node[key];
      if (value !== null && value !== undefined) {
        if (Array.isArray(value)) {
          children.push(...value.filter(item => item !== null && item !== undefined));
        } else if (typeof value === 'object') {
          children.push(value);
        }
      }
    });
    
    return children;
  };

  // Get child key for path tracking (helper function)
  const getChildKey = (node, index) => {
    const keys = Object.keys(node).filter(key => 
      !['type', 'start', 'end', 'loc', 'range', 'raw'].includes(key)
    );
    return keys[index] || index;
  };

  // Highlight a specific line in the code
  const highlightCodeLine = (lineNumber) => {
    const codeLines = document.querySelectorAll('.code-line');
    codeLines.forEach(line => line.classList.remove('highlighted-line'));
    
    if (lineNumber && lineNumber > 0) {
      const targetLine = document.querySelector(`[data-line="${lineNumber}"]`);
      if (targetLine) {
        targetLine.classList.add('highlighted-line');
        targetLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  // Handle code line click
  const handleCodeLineClick = (lineNumber) => {
    setSelectedLine(lineNumber);
    highlightCodeLine(lineNumber);
    
    // Highlight corresponding AST node
    const nodes = lineNodeMap.get(lineNumber);
    console.log(`Clicked line ${lineNumber}, found nodes:`, nodes);
    
    if (nodes && nodes.length > 0 && visualizerRef.current) {
      console.log(`Attempting to highlight node with path: ${nodes[0].path}`);
      // Add a small delay to ensure the AST visualizer is fully rendered
      setTimeout(() => {
        visualizerRef.current.highlightNodeByPath(nodes[0].path);
      }, 100);
    } else {
      console.log('No nodes found or visualizer not ready');
      if (!visualizerRef.current) {
        console.log('Visualizer reference is null');
      }
      if (!nodes || nodes.length === 0) {
        console.log('No nodes found for this line');
      }
    }
  };

  // Render code with line numbers and click handlers
  const renderCodeWithLines = () => {
    if (!sampleCode) return 'Loading code...';
    
    const lines = sampleCode.split('\n');
    return lines.map((line, index) => {
      const lineNumber = index + 1;
      const hasNodes = lineNodeMap.has(lineNumber);
      
      return (
        <div
          key={index}
          className={`code-line ${hasNodes ? 'has-nodes' : ''} ${selectedLine === lineNumber ? 'highlighted-line' : ''}`}
          data-line={lineNumber}
          onClick={() => handleCodeLineClick(lineNumber)}
          title={hasNodes ? `Click to highlight AST nodes for line ${lineNumber}` : ''}
        >
          <span className="line-number">{lineNumber.toString().padStart(3, ' ')}</span>
          <span className="line-content">{line}</span>
        </div>
      );
    });
  };

  return (
    <div>
      <h1>AST Parser Demo</h1>
      <div style={{ display: 'flex', gap: '20px', height: 'calc(100vh - 120px)' }}>
        {/* Code Display Panel */}
        <div style={{ 
          flex: '0 0 400px', 
          backgroundColor: '#1e1e1e', 
          borderRadius: '8px', 
          padding: '20px',
          border: '1px solid #3e3e42',
          overflow: 'auto'
        }}>
          <h3 style={{ 
            color: '#4ec9b0', 
            marginTop: '0', 
            marginBottom: '15px',
            borderBottom: '2px solid #3e3e42',
            paddingBottom: '8px'
          }}>
            Source Code
          </h3>
          <div className="code-container">
            {renderCodeWithLines()}
          </div>
        </div>
        
        {/* AST Container */}
        <div id="ast-container" style={{ flex: '1' }}></div>
      </div>
      
      <style>{`
        .code-container {
          font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
          font-size: 13px;
          line-height: 1.5;
        }
        
        .code-line {
          display: flex;
          cursor: pointer;
          padding: 2px 0;
          border-radius: 3px;
          transition: background-color 0.2s ease;
        }
        
        .code-line:hover {
          background-color: #2a2d2e;
        }
        
        .code-line.has-nodes {
          border-left: 2px solid #007acc;
        }
        
        .code-line.highlighted-line {
          background-color: #264f78;
          border-left: 3px solid #007acc;
        }
        
        .line-number {
          color: #858585;
          margin-right: 15px;
          user-select: none;
          min-width: 30px;
        }
        
        .line-content {
          color: #d4d4d4;
          flex: 1;
          white-space: pre-wrap;
          word-wrap: break-word;
        }
      `}</style>
    </div>
  );
}