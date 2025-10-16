import React from 'react';
import './app.scss';
import ErrorBoundary from './components/ErrorBoundary';

function App(props: any) {
  return (
    <ErrorBoundary>
      {props.children}
    </ErrorBoundary>
  );
}

export default App;