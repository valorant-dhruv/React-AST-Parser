import { parse } from '@babel/parser';

class ASTParser {

  constructor() {
    this.ast = null;
    this.errors = [];
  }

  //Function to parse the given code and generate the AST
  //Options are the parser options for the babel parser
  async parseCode(code, options = {}) {
    try {
      console.log('Input code length:', code.length);
      console.log('Input code preview:', code.substring(0, 100));
      
      // Try to get the parse function
      let parseFunction = parse;
      if (!parseFunction) {
        try {
          const BabelParser = await import('@babel/parser');
          parseFunction = BabelParser.parse || BabelParser.default?.parse;
        } catch (importError) {
          console.error('Failed to import Babel parser dynamically:', importError);
          throw new Error('Babel parser not available');
        }
      }
      
      // Start with minimal options and add more as needed
      const parserOptions = {
        sourceType: 'module',
        plugins: ['jsx'], // Start with just JSX, remove typescript for now
        locations: true,   // Enable location information for AST nodes
        ...options
      };

      console.log('Parser options:', parserOptions);
      console.log('Parse function available:', !!parseFunction);
      
      this.ast = parseFunction(code, parserOptions);
      console.log('Parsed AST structure:', {
        hasAst: !!this.ast,
        astType: this.ast?.type,
        hasBody: !!this.ast?.body,
        bodyLength: this.ast?.body?.length,
        firstNodeLoc: this.ast?.body?.[0]?.loc
      });
      
      this.errors = [];
      return this.ast;
    } 
    
    catch (error) {
      console.error('Parsing error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        loc: error.loc
      });
      
      // If Babel parser fails, create a simple fallback AST with basic structure
      console.log('Creating fallback AST due to parsing error');
      this.ast = this.createFallbackAST(code);
      
      this.errors.push({
        message: error.message,
        line: error.loc?.line,
        column: error.loc?.column,
        code: error.code
      });

      return this.ast;
    }
  }

  // Create a simple fallback AST with basic line information
  createFallbackAST(code) {
    const lines = code.split('\n');
    const ast = {
      type: 'Program',
      body: [],
      loc: { start: { line: 1, column: 0 }, end: { line: lines.length, column: 0 } }
    };

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      if (line.trim()) {
        // Create a simple node for each non-empty line
        const node = {
          type: 'ExpressionStatement',
          expression: { type: 'Literal', value: line.trim() },
          loc: { 
            start: { line: lineNumber, column: 0 }, 
            end: { line: lineNumber, column: line.length } 
          }
        };
        ast.body.push(node);
      }
    });

    console.log('Created fallback AST:', ast);
    return ast;
  }

  //Getter function for the AST
  getAST() {
    return this.ast;
  }

  //Getter function for the errors
  getErrors() {
    return this.errors;
  }

  //Function to clear the AST and errors
  clear() {
    this.ast = null;
    this.errors = [];
  }
}

export default ASTParser;
