#Defining Pydantic models to hold the data structures for the 3D vectors (used for both position and velocity), the state fields for an agent, and the simulation inputs
#This can easily be adapted as the simulation grows/encompasses different data fields

from pydantic import BaseModel, Field

class Vector3D(BaseModel): 
    x: float
    y: float
    z: float

class AgentState(BaseModel): #with default values for time and timestep
    position: Vector3D
    velocity: Vector3D
    mass: float
    time: float = 0.0
    timestep: float = 0.01 

class SimulationInput(BaseModel): 
    Body1: AgentState
    Body2: AgentState