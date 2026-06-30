import AppRouter from "./routes/AppRouter";
import { LoadingProvider } from "./contexts/LoadingContext";

function App() {
  return (
    <LoadingProvider>
      <AppRouter />
    </LoadingProvider>
  );
}

export default App;