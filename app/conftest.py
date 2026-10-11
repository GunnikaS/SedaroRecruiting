import pytest
from typing import List
from helper import DockerClient, Container


@pytest.fixture(scope="session")
def docker_client():
    """Create a DockerClient for the test session and close it afterwards."""
    
    try:
        client = DockerClient()
    except RuntimeError:
        pytest.skip("Docker not available")
    yield client
    client.close()


@pytest.fixture(scope="session")
def running_containers(docker_client: DockerClient) -> List[Container]: 
    '''
    cached list of running containers for the session
    '''
    return docker_client.list_containers()