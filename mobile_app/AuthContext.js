import React from "react";

export const AuthContext = React.createContext({
  user: null,              // { username }
  login: async (_u,_p) => {},
  logout: () => {},
});
