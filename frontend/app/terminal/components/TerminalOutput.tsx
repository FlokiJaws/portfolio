// frontend/src/app/terminal/components/TerminalOutput.tsx

interface TerminalOutputProps {
  history: string[]; // L'historique des lignes à afficher
}

/**
 * Composant responsable de l'affichage de l'historique des commandes et de leurs sorties.
 * Chaque ligne est affichée comme un div séparé.
 */
const TerminalOutput: React.FC<TerminalOutputProps> = ({ history }) => {
  return (
    <div>
      {history.map((line, index) => (
        <div key={index} className="text-sm leading-relaxed whitespace-pre-wrap">
          {line}
        </div>
      ))}
    </div>
  );
};

export default TerminalOutput;