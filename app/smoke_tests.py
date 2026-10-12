import pytest
from modsim import propagate_velocity, propagate_position, propagate_mass, time_manager, timestep_manager

#create initial fake data
position = {'x': 1.0, 'y': 0.0, 'z': 0.0}
other_position = {'x': 3.0, 'y': 0.0, 'z': 0.0}
velocity = {'x': 2, 'y': 0, 'z': 0}
dt = 0.5
m_other = 2.0

def test_propagate_velocity(): 
    new_velocity = propagate_velocity(dt, position, velocity, other_position, m_other)
    assert new_velocity['x'] == 2.25
    assert new_velocity['y'] == 0.0
    assert new_velocity['z'] == 0.0

def test_propagate_position(): 
    new_position = propagate_position(dt, position, velocity)
    assert new_position['x'] == 2.0
    assert new_position['y'] == 0.0
    assert new_position['z'] == 0.0


