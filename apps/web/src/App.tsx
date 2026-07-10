import { ThemeProvider } from './theme/ThemeProvider';
import { SaraloHome } from './custom/SaraloHome';
import { SimulationLayer } from './components/Simulation/SimulationLayer';

function App() {
  return (
    <ThemeProvider>
      <SimulationLayer>
        <SaraloHome />
      </SimulationLayer>
    </ThemeProvider>
  );
}

export default App;
