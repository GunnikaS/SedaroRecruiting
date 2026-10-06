import { Flex, Heading, Separator, Table } from '@radix-ui/themes';
import { useEffect, useMemo, useState } from 'react';
import Plot from 'react-plotly.js';
import { Link } from 'react-router-dom';
import { Routes } from 'routes';

// Input data from the simulation
type AgentData = Record<string, Record<string, number>>;
type DataFrame = Record<string, AgentData>;
type DataPoint = [number, number, DataFrame];

const App = () => {
  const [simulationData, setSimulationData] = useState<DataPoint[]>([]); //holds the entire simulation data, which is generated all at once
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0); //tracks which frame of the simulation is being displayed on the UI; starts at zero to display the first frame

  useEffect(() => { //loads the UI and ensures that we can fetch the simulation data 
    let canceled = false;

    async function fetchData() {
      try {
        const response = await fetch('http://localhost:8000/simulation'); //GET request to the backend endpoint to receive the simulation data
        if (canceled) return;

        const data: DataPoint[] = await response.json();
        setSimulationData(data);
        console.log('Set plot data!');
        setCurrentFrameIndex(0);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    }

    fetchData();

    return () => {
      canceled = true;
    };
  }, []);

  useEffect(() => {
    if (simulationData.length === 0) return;

    const timer = setInterval(() => {
      setCurrentFrameIndex((prev) => {
        if (prev >= simulationData.length - 1) { //detects the last frame
          clearInterval(timer);
          return prev;
        }
        return prev + 1; //increase animation by one frame every 20 ms
      });
    }, 20);

    return () => clearInterval(timer);
  }, [simulationData]);

  const displayFrameLimit = currentFrameIndex + 1; //+1 to offset the initial state 

  const positionData = useMemo(() => {
    const traces: any[] = [];
    const agentSet = new Set<string>();

    for (let i = 0; i < displayFrameLimit; i++) {
      const frame = simulationData[i]?.[2];
      if (!frame) continue;

      Object.keys(frame).forEach((agentId) => {
        if (agentId !== 'time' && agentId !== 'timeStep') {
          agentSet.add(agentId);
        }
      });
    }

    for (const agentId of agentSet) {
      const x: number[] = [];
      const y: number[] = [];
      const z: number[] = [];

      for (let i = 0; i < displayFrameLimit; i++) {
        const frame = simulationData[i]?.[2];
        const agent = frame?.[agentId];
        if (!agent || !agent.position) continue;

        x.push(agent.position.x);
        y.push(agent.position.y);
        z.push(agent.position.z);
      } //appends position values from each frame

      traces.push({
        type: 'scatter3d',
        mode: 'lines+markers',
        x,
        y,
        z,
        name: agentId,
        line: { width: 2 },
        marker: { size: 4 },
      });
    }

    return traces;
  }, [simulationData, displayFrameLimit]);

  const velocityData = useMemo(() => {
    const traces: any[] = [];
    const agentSet = new Set<string>();

    for (let i = 0; i < displayFrameLimit; i++) {
      const frame = simulationData[i]?.[2];
      if (!frame) continue;

      Object.keys(frame).forEach((agentId) => {
        if (agentId !== 'time' && agentId !== 'timeStep') {
          agentSet.add(agentId);
        }
      });
    }

    for (const agentId of agentSet) {
      const x: number[] = [];
      const y: number[] = [];
      const z: number[] = [];

      for (let i = 0; i < displayFrameLimit; i++) {
        const frame = simulationData[i]?.[2];
        const agent = frame?.[agentId];
        if (!agent || !agent.velocity) continue;

        x.push(agent.velocity.x);
        y.push(agent.velocity.y);
        z.push(agent.velocity.z);
      } //appends velocity values from each frame

      traces.push({
        type: 'scatter3d',
        mode: 'lines+markers',
        x,
        y,
        z,
        name: agentId,
        line: { width: 2 },
        marker: { size: 4 },
      });
    }

    return traces;
  }, [simulationData, displayFrameLimit]);

  const initialState = simulationData[0]?.[2] ?? {};

  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        margin: '0 auto',
      }}
    >
      <Flex direction="column" m="4" width="100%" justify="center" align="center">
        <Heading as="h1" size="8" weight="bold" mb="4">
          Simulation Data
        </Heading>

        <Link to={Routes.FORM}>Define new simulation parameters</Link>
        <Separator size="4" my="5" />

        <Flex direction="row" width="100%" justify="center">
          <Plot
            style={{ width: '45%', height: '100%', margin: '5px' }}
            data={positionData}
            layout={{
              title: 'Position',
              scene: {
                xaxis: { title: 'X' },
                yaxis: { title: 'Y' },
                zaxis: { title: 'Z' },
              },
              autosize: true,
              dragmode: 'turntable',
            }}
            useResizeHandler
            config={{ scrollZoom: true }}
          />

          <Plot
            style={{ width: '45%', height: '100%', margin: '5px' }}
            data={velocityData}
            layout={{
              title: 'Velocity',
              scene: {
                xaxis: { title: 'X' },
                yaxis: { title: 'Y' },
                zaxis: { title: 'Z' },
              },
              autosize: true,
              dragmode: 'turntable',
            }}
            useResizeHandler
            config={{ scrollZoom: true }}
          />
        </Flex>

        <Flex justify="center" width="100%" m="4">
          <Table.Root
            style={{
              width: '800px',
            }}
          >
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Agent</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Initial Position (x,y, z)</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Initial Velocity (x,y,z)</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {Object.entries(initialState).flatMap(([agentId, agentValue]) => {
                if (!agentValue || !('position' in agentValue) || !('velocity' in agentValue)) {
                  return [];
                }

                const { position, velocity } = agentValue as {
                  position: { x: number; y: number; z: number };
                  velocity: { x: number; y: number; z: number };
                };

                return (
                  <Table.Row key={agentId}>
                    <Table.RowHeaderCell>{agentId}</Table.RowHeaderCell>
                    <Table.Cell>
                      ({position.x}, {position.y}, {position.z})
                    </Table.Cell>
                    <Table.Cell>
                      ({velocity.x}, {velocity.y}, {velocity.z})
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table.Root>
        </Flex>
      </Flex>
    </div>
  );
};

export default App;