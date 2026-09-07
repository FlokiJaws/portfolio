// frontend/src/app/terminal/components/TerminalInput.tsx
import { KeyboardEventHandler } from 'react';

interface TerminalInputProps {
  currentPath: string; // Le chemin actuel (ex: ~ ou ~/projects)
  input: string; // La valeur actuelle de l'input
  onInputChange: (value: string) => void; // Fonction pour mettre à jour l'input
  onCommandSubmit: (command: string) => void; // Fonction appelée quand une commande est soumise
}

/**
 * Composant pour la ligne de saisie de commande du terminal.
 * Gère l'input, le préfixe du chemin et la soumission de commande.
 */
const TerminalInput: React.FC<TerminalInputProps> = ({ 
  currentPath, 
  input, 
  onInputChange, 
  onCommandSubmit 
}) => {

  /**
   * Gère la soumission du formulaire (touche Entrée).
   * @param e - L'événement du formulaire.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCommandSubmit(input);
  };

  /**
   * Gère les événements clavier (pour l'historique des commandes plus tard).
   * @param e - L'événement clavier.
   */
  const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = (e) => {
    // Plus tard, on pourra ajouter la gestion des flèches Haut/Bas pour l'historique
    // if (e.key === 'ArrowUp') { ... }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center">
      <span className="text-green-500 mr-2">
        <span className="text-blue-400">user</span>
        <span className="text-gray-500">@</span>
        <span className="text-purple-400">portfolio</span>
        <span className="text-gray-500">:{currentPath}$</span>
      </span>
      <input
        autoFocus // Met le focus sur l'input au chargement
        type="text"
        className="flex-1 bg-transparent border-none outline-none text-green-400 ml-1"
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
        onKeyDown={handleKeyDown}
        spellCheck="false" // Désactive la correction automatique
      />
    </form>
  );
};

export default TerminalInput;