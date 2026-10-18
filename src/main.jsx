import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

class ErrorBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    return this.state.error ? (
      <main className="fatal">
        <h1>Une erreur d’affichage est survenue.</h1>
        <p>Les données enregistrées restent sur votre ordinateur.</p>
        <button onClick={() => location.reload()}>
          Recharger l’application
        </button>
        <details>
          <summary>Détail</summary>
          {this.state.error.message}
        </details>
      </main>
    ) : (
      this.props.children
    );
  }
}
createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
