class ASTVisualizer {
  constructor(astData) {
    this.ast = astData;
    this.container = null;
    this.nodeId = 0;
    this.collapsedNodes = new Set();
    this.selectedNode = null;
    this.lineNodeMap = null;
    this.onNodeSelect = null;
  }

  // Initialize the visualizer with a DOM container
  init(containerId, lineNodeMap = null, onNodeSelect = null) {
    this.container = document.getElementById(containerId);
    this.lineNodeMap = lineNodeMap;
    this.onNodeSelect = onNodeSelect;
    
    if (!this.container) {
      throw new Error(`Container with id '${containerId}' not found`);
    }
    this.container.innerHTML = '';
    this.setupStyles();
    this.createLayout();
  }

  // Setup CSS styles
  setupStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .ast-visualizer {
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        display: flex;
        gap: 20px;
        background-color: #1e1e1e;
        color: #d4d4d4;
        padding: 20px;
        border-radius: 8px;
        min-height: 600px;
      }
      
      .ast-tree-panel {
        flex: 1;
        background-color: #252526;
        border-radius: 6px;
        padding: 15px;
        overflow-y: auto;
        max-height: 800px;
        border: 1px solid #3e3e42;
      }
      
      .ast-details-panel {
        flex: 0 0 400px;
        background-color: #252526;
        border-radius: 6px;
        padding: 15px;
        border: 1px solid #3e3e42;
        overflow-y: auto;
        max-height: 800px;
      }
      
      .ast-node {
        margin-bottom: 4px;
        position: relative;
      }
      
      .node-header {
        display: flex;
        align-items: center;
        padding: 6px 10px;
        cursor: pointer;
        border-radius: 4px;
        transition: all 0.2s ease;
        user-select: none;
        position: relative;
      }
      
      .node-header:hover {
        background-color: #2a2d2e;
        border-left: 3px solid #007acc;
      }
      
      .node-header.selected {
        background-color: #264f78;
        border-left: 3px solid #007acc;
      }
      
      .node-header.collapsed::before {
        content: '▶';
        margin-right: 5px;
        color: #cccccc;
        font-size: 10px;
      }
      
      .node-header.expanded::before {
        content: '▼';
        margin-right: 5px;
        color: #cccccc;
        font-size: 10px;
      }
      
      .node-type {
        font-weight: 600;
        margin-right: 8px;
      }
      
      .node-info {
        color: #9cdcfe;
        font-style: italic;
      }
      
      .node-children {
        margin-left: 20px;
        border-left: 1px solid #404040;
        padding-left: 10px;
        margin-top: 4px;
      }
      
      .node-children.hidden {
        display: none;
      }
      
      /* Node type colors */
      .type-Program { color: #4ec9b0; }
      .type-FunctionDeclaration { color: #dcdcaa; }
      .type-FunctionExpression { color: #dcdcaa; }
      .type-ArrowFunctionExpression { color: #dcdcaa; }
      .type-VariableDeclaration { color: #4fc1ff; }
      .type-Identifier { color: #9cdcfe; }
      .type-Literal { color: #ce9178; }
      .type-JSXElement { color: #92c5f8; }
      .type-JSXText { color: #ce9178; }
      .type-ImportDeclaration { color: #c586c0; }
      .type-ExportDefaultDeclaration { color: #c586c0; }
      .type-CallExpression { color: #ffcd3c; }
      .type-MemberExpression { color: #79b8ff; }
      .type-BlockStatement { color: #808080; }
      .type-ReturnStatement { color: #c586c0; }
      
      .details-header {
        font-size: 18px;
        font-weight: bold;
        margin-bottom: 15px;
        color: #4ec9b0;
        border-bottom: 2px solid #3e3e42;
        padding-bottom: 8px;
      }
      
      .details-section {
        margin-bottom: 20px;
      }
      
      .details-title {
        font-size: 14px;
        font-weight: bold;
        color: #ffcd3c;
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      
      .details-content {
        background-color: #1e1e1e;
        padding: 10px;
        border-radius: 4px;
        border-left: 3px solid #007acc;
        font-size: 13px;
        line-height: 1.5;
      }
      
      .details-property {
        margin-bottom: 6px;
      }
      
      .property-key {
        color: #9cdcfe;
        font-weight: bold;
      }
      
      .property-value {
        color: #ce9178;
        margin-left: 10px;
      }
      
      .search-box {
        width: 100%;
        padding: 8px 12px;
        margin-bottom: 15px;
        background-color: #1e1e1e;
        border: 1px solid #3e3e42;
        border-radius: 4px;
        color: #d4d4d4;
        font-family: inherit;
      }
      
      .search-box:focus {
        outline: none;
        border-color: #007acc;
        box-shadow: 0 0 5px rgba(0, 122, 204, 0.3);
      }
      
      .highlighted {
        background-color: #613a00 !important;
      }
      
      .controls {
        margin-bottom: 15px;
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }
      
      .control-btn {
        padding: 6px 12px;
        background-color: #0e639c;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        transition: background-color 0.2s;
      }
      
      .control-btn:hover {
        background-color: #1177bb;
      }
    `;
    
    if (!document.querySelector('#ast-visualizer-styles')) {
      style.id = 'ast-visualizer-styles';
      document.head.appendChild(style);
    }
  }

  // Create the main layout
  createLayout() {
    this.container.innerHTML = `
      <div class="ast-visualizer">
        <div class="ast-tree-panel">
          <div class="controls">
            <button class="control-btn" onclick="this.parentElement.parentElement.parentElement.astVisualizer.expandAll()">Expand All</button>
            <button class="control-btn" onclick="this.parentElement.parentElement.parentElement.astVisualizer.collapseAll()">Collapse All</button>
            <button class="control-btn" onclick="this.parentElement.parentElement.parentElement.astVisualizer.exportTree()">Export JSON</button>
          </div>
          <input type="text" class="search-box" placeholder="Search nodes (type, name, value)..." 
                 oninput="this.parentElement.parentElement.parentElement.astVisualizer.search(this.value)">
          <div class="tree-container"></div>
        </div>
        <div class="ast-details-panel">
          <div class="details-header">Node Details</div>
          <div class="details-container">
            <div style="color: #808080; font-style: italic;">Click on a node to view its details</div>
          </div>
        </div>
      </div>
    `;
    
    // Store reference for button callbacks
    this.container.astVisualizer = this;
  }

  // Main render method
  render() {
    if (!this.container) {
      throw new Error('Visualizer not initialized. Call init() first.');
    }
    
    const treeContainer = this.container.querySelector('.tree-container');
    const treeElement = this.createTreeElement(this.ast);
    treeContainer.appendChild(treeElement);
  }

  // Create a tree element from AST node
  createTreeElement(node, depth = 0, path = 'root') {
    if (!node || typeof node !== 'object') {
      return this.createLeafElement(node, depth);
    }

    const nodeId = this.generateNodeId();
    const nodeElement = document.createElement('div');
    nodeElement.className = 'ast-node';
    nodeElement.dataset.nodeId = nodeId;
    nodeElement.dataset.path = path;

    // Create node header
    const header = this.createNodeHeader(node, nodeId);
    nodeElement.appendChild(header);

    // Handle child nodes
    const children = this.getNodeChildren(node);
    if (children && children.length > 0) {
      const childrenContainer = document.createElement('div');
      childrenContainer.className = 'node-children';
      childrenContainer.dataset.parentId = nodeId;
      
      children.forEach((child, index) => {
        const childPath = `${path}.${this.getChildKey(node, index)}`;
        const childElement = this.createTreeElement(child, depth + 1, childPath);
        childrenContainer.appendChild(childElement);
      });
      
      nodeElement.appendChild(childrenContainer);
      header.classList.add('expanded');
    }

    return nodeElement;
  }

  // Create header for each node
  createNodeHeader(node, nodeId) {
    const header = document.createElement('div');
    header.className = `node-header type-${node.type || 'Unknown'}`;
    header.dataset.nodeId = nodeId;
    
    const nodeType = node.type || 'Unknown';
    const nodeInfo = this.getNodeInfo(node);
    
    header.innerHTML = `
      <span class="node-type">${nodeType}</span>
      ${nodeInfo ? `<span class="node-info">${nodeInfo}</span>` : ''}
    `;

    // Add click handlers
    header.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleNode(nodeId);
      this.selectNode(node, header);
    });

    return header;
  }

  // Create leaf elements for primitive values
  createLeafElement(value, depth) {
    const leafElement = document.createElement('div');
    leafElement.className = 'ast-node';
    leafElement.style.marginLeft = `${depth * 20}px`;
    
    const header = document.createElement('div');
    header.className = 'node-header type-Literal';
    header.innerHTML = `<span class="node-type">Value</span><span class="node-info">${JSON.stringify(value)}</span>`;
    
    leafElement.appendChild(header);
    return leafElement;
  }

  // Get node information for display
  getNodeInfo(node) {
    if (!node) return '';
    
    switch (node.type) {
      case 'Identifier':
        return node.name;
      case 'Literal':
        return JSON.stringify(node.value);
      case 'FunctionDeclaration':
        return `${node.id?.name || 'anonymous'}(${node.params?.length || 0} params)`;
      case 'FunctionExpression':
      case 'ArrowFunctionExpression':
        return `(${node.params?.length || 0} params)`;
      case 'JSXElement':
        return `<${node.openingElement?.name?.name || 'unknown'}>`;
      case 'JSXText':
        const text = node.value?.trim();
        return text ? `"${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"` : '';
      case 'ImportDeclaration':
        return `from "${node.source?.value}"`;
      case 'VariableDeclaration':
        return `${node.kind} (${node.declarations?.length || 0})`;
      case 'CallExpression':
        const callee = node.callee?.name || node.callee?.property?.name || 'unknown';
        return `${callee}(${node.arguments?.length || 0} args)`;
      case 'MemberExpression':
        return `${node.object?.name || '?'}.${node.property?.name || '?'}`;
      default:
        return '';
    }
  }

  // Get children of a node
  getNodeChildren(node) {
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
  }

  // Get child key for path tracking
  getChildKey(node, index) {
    const keys = Object.keys(node).filter(key => 
      !['type', 'start', 'end', 'loc', 'range', 'raw'].includes(key)
    );
    return keys[index] || index;
  }

  // Toggle node expand/collapse
  toggleNode(nodeId) {
    const childrenContainer = this.container.querySelector(`[data-parent-id="${nodeId}"]`);
    const header = this.container.querySelector(`[data-node-id="${nodeId}"]`);
    
    if (childrenContainer && header) {
      if (this.collapsedNodes.has(nodeId)) {
        // Expand
        childrenContainer.classList.remove('hidden');
        header.classList.remove('collapsed');
        header.classList.add('expanded');
        this.collapsedNodes.delete(nodeId);
      } else {
        // Collapse
        childrenContainer.classList.add('hidden');
        header.classList.remove('expanded');
        header.classList.add('collapsed');
        this.collapsedNodes.add(nodeId);
      }
    }
  }

  // Select node and show details
  selectNode(node, headerElement) {
    // Clear previous selection
    const prevSelected = this.container.querySelector('.node-header.selected');
    if (prevSelected) {
      prevSelected.classList.remove('selected');
    }
    
    // Select new node
    headerElement.classList.add('selected');
    this.selectedNode = node;
    this.showNodeDetails(node);
    
    // Call callback to highlight corresponding code line
    if (this.onNodeSelect && node.loc) {
      this.onNodeSelect(node.loc.start.line);
    }
  }

  // Show detailed node information
  showNodeDetails(node) {
    const detailsContainer = this.container.querySelector('.details-container');
    
    const html = `
      <div class="details-section">
        <div class="details-title">Basic Information</div>
        <div class="details-content">
          <div class="details-property">
            <span class="property-key">Type:</span>
            <span class="property-value">${node.type || 'Unknown'}</span>
          </div>
          ${node.name ? `<div class="details-property">
            <span class="property-key">Name:</span>
            <span class="property-value">${node.name}</span>
          </div>` : ''}
          ${node.value !== undefined ? `<div class="details-property">
            <span class="property-key">Value:</span>
            <span class="property-value">${JSON.stringify(node.value)}</span>
          </div>` : ''}
        </div>
      </div>
      
      <div class="details-section">
        <div class="details-title">All Properties</div>
        <div class="details-content">
          ${Object.keys(node)
            .filter(key => !['start', 'end', 'loc', 'range'].includes(key))
            .map(key => `
              <div class="details-property">
                <span class="property-key">${key}:</span>
                <span class="property-value">${this.formatPropertyValue(node[key])}</span>
              </div>
            `).join('')}
        </div>
      </div>
      
      <div class="details-section">
        <div class="details-title">Raw JSON</div>
        <div class="details-content">
          <pre style="white-space: pre-wrap; font-size: 11px; max-height: 200px; overflow-y: auto;">${JSON.stringify(node, null, 2)}</pre>
        </div>
      </div>
    `;
    
    detailsContainer.innerHTML = html;
  }

  // Format property values for display
  formatPropertyValue(value) {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'object') {
      if (Array.isArray(value)) return `Array(${value.length})`;
      return `Object{${Object.keys(value).join(', ')}}`;
    }
    return String(value);
  }

  // Search functionality
  search(query) {
    const allNodes = this.container.querySelectorAll('.node-header');
    
    // Clear previous highlights
    allNodes.forEach(node => node.classList.remove('highlighted'));
    
    if (!query.trim()) return;
    
    const searchTerm = query.toLowerCase();
    allNodes.forEach(nodeHeader => {
      const text = nodeHeader.textContent.toLowerCase();
      if (text.includes(searchTerm)) {
        nodeHeader.classList.add('highlighted');
        // Expand parent nodes to make found nodes visible
        this.expandToNode(nodeHeader);
      }
    });
  }

  // Expand nodes to make a specific node visible
  expandToNode(nodeHeader) {
    let current = nodeHeader.parentElement;
    while (current && !current.classList.contains('tree-container')) {
      if (current.classList.contains('node-children') && current.classList.contains('hidden')) {
        const parentId = current.dataset.parentId;
        const parentHeader = this.container.querySelector(`[data-node-id="${parentId}"]`);
        if (parentHeader) {
          this.collapsedNodes.delete(parentId);
          current.classList.remove('hidden');
          parentHeader.classList.remove('collapsed');
          parentHeader.classList.add('expanded');
        }
      }
      current = current.parentElement;
    }
  }

  // Expand all nodes
  expandAll() {
    this.collapsedNodes.clear();
    const allChildren = this.container.querySelectorAll('.node-children');
    const allHeaders = this.container.querySelectorAll('.node-header');
    
    allChildren.forEach(child => child.classList.remove('hidden'));
    allHeaders.forEach(header => {
      header.classList.remove('collapsed');
      if (header.parentElement.querySelector('.node-children')) {
        header.classList.add('expanded');
      }
    });
  }

  // Collapse all nodes
  collapseAll() {
    const allChildren = this.container.querySelectorAll('.node-children');
    const allHeaders = this.container.querySelectorAll('.node-header');
    
    allChildren.forEach(child => {
      child.classList.add('hidden');
      const parentId = child.dataset.parentId;
      if (parentId) {
        this.collapsedNodes.add(parentId);
      }
    });
    
    allHeaders.forEach(header => {
      header.classList.remove('expanded');
      header.classList.add('collapsed');
    });
  }

  // Export tree as JSON
  exportTree() {
    const jsonString = JSON.stringify(this.ast, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ast-tree.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Highlight a specific node by its path
  highlightNodeByPath(path) {
    console.log(`ASTVisualizer: Attempting to highlight node with path: ${path}`);
    if (!path) {
      console.log('ASTVisualizer: No path provided');
      return;
    }
    
    // Find the node element by path
    const nodeElement = this.container.querySelector(`[data-path="${path}"]`);
    console.log(`ASTVisualizer: Found node element:`, nodeElement);
    
    if (nodeElement) {
      // Clear previous selection
      const prevSelected = this.container.querySelector('.node-header.selected');
      if (prevSelected) {
        prevSelected.classList.remove('selected');
      }
      
      // Select the new node
      const header = nodeElement.querySelector('.node-header');
      if (header) {
        console.log(`ASTVisualizer: Highlighting header:`, header);
        header.classList.add('selected');
        this.selectedNode = this.getNodeByPath(path);
        this.showNodeDetails(this.selectedNode);
        
        // Expand parent nodes to make the selected node visible
        this.expandToNode(header);
        
        // Scroll to the node
        header.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        console.log('ASTVisualizer: No header found in node element');
      }
    } else {
      console.log(`ASTVisualizer: No node element found with path: ${path}`);
      // Debug: Log all available paths
      const allPaths = Array.from(this.container.querySelectorAll('[data-path]')).map(el => el.dataset.path);
      console.log('ASTVisualizer: Available paths:', allPaths);
    }
  }

  // Get node by path (helper method)
  getNodeByPath(path) {
    if (!path || path === 'root') return this.ast;
    
    const pathParts = path.split('.');
    let current = this.ast;
    
    for (let i = 1; i < pathParts.length; i++) {
      const part = pathParts[i];
      if (current && typeof current === 'object') {
        if (Array.isArray(current)) {
          current = current[parseInt(part)];
        } else {
          current = current[part];
        }
      } else {
        return null;
      }
    }
    
    return current;
  }

  // Helper method to generate unique IDs
  generateNodeId() {
    return `node_${this.nodeId++}`;
  }
}

export default ASTVisualizer;