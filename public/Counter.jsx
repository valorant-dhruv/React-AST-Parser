import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  const increment = () => {
    setCount(count + 1);
  };

  const reset = () => {
    setCount(0);
  };

  return (
    <div>
      <h1>Counter App</h1>
      <p>Current Count: {count}</p>
      <button onClick={increment}>Increment</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}

// Main App component
export default function SimpleReactApp() {
  return (
    <div>
      <h1>Simple React App</h1>
      <p>Foundation for our code parsing experiments</p>
      <Counter />
    </div>
  );
}
