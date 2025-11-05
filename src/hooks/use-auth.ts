import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string | null;
  role: string;
  is_active: boolean;
}

export const useAuth = () => {
  const { toast } = useToast();

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // Verificar se o usuário existe e a senha está correta
      const { data, error } = await supabase.rpc('authenticate_user', {
        input_username: username,
        input_password: password
      });

      if (error) {
        console.error('Erro na autenticação:', error);
        toast({
          title: "Erro no login",
          description: "Erro interno do servidor",
          variant: "destructive",
        });
        return false;
      }

      if (data && data.length > 0) {
        const user = data[0];
        // Armazenar dados do usuário no localStorage
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("username", user.full_name || user.username);
        localStorage.setItem("userId", user.id);
        localStorage.setItem("userRole", user.role);
        
        toast({
          title: "Login realizado com sucesso!",
          description: `Bem-vindo, ${user.full_name || user.username}`,
        });
        return true;
      } else {
        toast({
          title: "Erro no login",
          description: "Usuário ou senha incorretos",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Erro na autenticação:', error);
      toast({
        title: "Erro no login",
        description: "Erro ao conectar com o servidor",
        variant: "destructive",
      });
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("username");
    localStorage.removeItem("userId");
    localStorage.removeItem("userRole");
  };

  const getCurrentUser = (): User | null => {
    const isAuth = localStorage.getItem("isAuthenticated");
    if (!isAuth) return null;

    return {
      id: localStorage.getItem("userId") || "",
      username: localStorage.getItem("username") || "",
      email: "",
      full_name: localStorage.getItem("username") || "",
      role: localStorage.getItem("userRole") || "user",
      is_active: true
    };
  };

  return {
    login,
    logout,
    getCurrentUser
  };
};