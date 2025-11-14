// Update this page (the content is just a fallback if you fail to update the page)
// HMR touch: 2025-11-14T07:35:00Z

import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">Welcome to Your Blank App</h1>
        <p className="text-xl text-muted-foreground">Start building your amazing project here!</p>
        <div className="mt-6">
          <Link to="/painel-guarita" className="inline-block px-4 py-2 rounded bg-[#0b4037] text-[#EAFBF0] hover:opacity-90">Abrir Painel Guarita (novo)</Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
