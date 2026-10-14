#Health tests test the Docker daemon directly; this involves ensuring that Docker containers are running, healthy, and not stuck in crash-restart loops

import pytest 
from helper import Container, DockerClient
from typing import List
import logging
import time

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

def test_docker_healthy(running_containers: List[Container]) -> None: 
    # Note: running_containers is in conftest and stores the cached list of running Docker containers
    '''makes sure Docker is healthy'''
    if len(running_containers) == 0: 
        pytest.skip('No containers are running on Docker')

def test_containers_healthy(running_containers: List[Container]) -> None: 
    '''makes sure each running container is healthy'''
    if len(running_containers) == 0: 
        pytest.skip('No containers are running on Docker')
    
    unhealthy_containers = []

    for container in running_containers: 
        if container.is_healthy() == False: 
            unhealthy_containers.append(container)
    
    if len(unhealthy_containers) != 0: 
        pytest.fail(f"Unhealthy containers: {unhealthy_containers}")

def test_no_restart_loops(docker_client: DockerClient, running_containers: List[Container]) -> None: 
    '''tests to see if any containers are stuck in restart loops'''
    restart_counters_initial = []
    for container in running_containers: 
        try: 
            restart_counters_initial.append(docker_client.restart_count(container.name))
        except Exception: 
            continue
    logger.info("Waiting for 10 seconds to test restart loop") #a container is in a restart loop if the restart count has increased within 10 seconds
    time.sleep(10)

    restart_counters_after = []
    for container in running_containers: 
        try: 
            restart_counters_after.append(docker_client.restart_count(container.name))
        except Exception: 
            continue
    restarting_containers = []

    for i in range(len(restart_counters_initial)): 
        if restart_counters_after[i] > restart_counters_initial[i]: 
            restarting_containers.append(restart_counters_initial[i])
    if len(restarting_containers) > 0: 
        pytest.fail(f"Containers {restarting_containers} are in a restart loop")




