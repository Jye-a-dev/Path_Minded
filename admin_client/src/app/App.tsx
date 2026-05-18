import { useRoutes } from "react-router-dom";
import routes from "../router/router";
import Providers from "../providers/Providers";

function App() {
  const element = useRoutes(routes);

  return <Providers>{element}</Providers>;
}

export default App;
