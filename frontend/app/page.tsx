"use client";
import { useState } from 'react';

export default function TerminalPortfolio() {
  const [history, setHistory] = useState<string[]>(["Bienvenue. Tapez 'help' pour voir les commandes."]);
  const [input, setInput] = useState("");

  const commands: any = {
    help: "Commandes disponibles : ls, cd, cat, clear, contact",
    ls: "projects/  skills/  bio.txt",
    "cat bio.txt": "Développeur Full-stack passionné par Node.js et Ubuntu.",
    contact: "Email: monadresse@mail.com | GitHub: @monpseudo"
  };

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const output = commands[input.toLowerCase()] || `Commande inconnue: ${input}`;
    setHistory([...history, `> ${input}`, output]);
    setInput("");
  };

  return (
    <div className="bg-black text-green-400 p-6 font-mono h-96 overflow-y-auto border-2 border-green-900 rounded-lg shadow-2xl">
      <div>
        {history.map((line, i) => (
          <div key={i} className="mb-1">{line}</div>
        ))}
      </div>
      <form onSubmit={handleCommand} className="flex mt-2">
        <span className="mr-2">user@portfolio:~$</span>
        <input 
          autoFocus
          className="bg-transparent outline-none flex-1 border-none"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      </form>
    </div>
  );
}