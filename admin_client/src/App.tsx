import AppRouter from "./router/Router";
import Providers from "./providers/Providers";

function App() {
  return (
    <Providers>
      <AppRouter />
    </Providers>
  );
}

export default App;

