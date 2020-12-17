import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import MonkeyCompilerIDE from './MonkeyCompilerIDE';
import registerServiceWorker from './registerServiceWorker';
import reportWebVitals from './reportWebVitals'
ReactDOM.render(
  <React.StrictMode>
    <MonkeyCompilerIDE />
  </React.StrictMode>,
  document.getElementById('root')
);
registerServiceWorker();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
