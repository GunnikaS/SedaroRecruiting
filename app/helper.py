'''Contains helper functions used by other files in the backend'''

import pytest
from pydantic import dataclasses
from typing import List

@dataclasses.dataclass 
class Container: 
    '''holds information (pulled directly from Docker) of Docker containers; discovered via Docker API'''
    id: str
    name: str
    state: str #running, exited, restarting, etc
    status: str
    health: str
    exit_code: int #zero means success; non-zero indicates errors

    def is_running(self) -> bool: 
        if self.state == 'running': 
            return True
        else: 
            return False

    def is_healthy(self) -> bool: 
        if self.is_running() == False: 
            return False
        return self.health in ('', 'healthy')

    def is_restarting(self) -> bool: 
        if self.state == 'restarting': 
            return True
        if self.state == 'exited' and self.exit_code != 0: 
            return True
        return False

class DockerClient: 
    '''wrapper for Docker SDK to inspect running containers'''
    def __init__(self): 
        try: 
            import docker
            self.client = docker.from_env()
            self.client.ping()
        except Exception as e: 
            raise RuntimeError(f'Failed to connect to Docker: {e}')
    
    def list_containers(self, refresh: bool = False) -> List[Container]: 
        '''Note: refresh=True gives full data, which is slower and usually unnecessary'''
        containers = []
        try: 
            docker_containers = self.client.containers.list()
            
            for dc in docker_containers: 
                if refresh: 
                    dc.reload()
                name = dc.attrs.get('Name', '')
                stat = dc.attrs.get('State', {}).get('Status', '')
                health_stat = dc.attrs.get('State', {}).get('Health', {}).get('Status', '')
                exit_code = dc.attrs.get('State', {}).get('ExitCode', 0)

                container = Container(
                    id = dc.attrs.get('Id'), 
                    name = dc.name, 
                    state = dc.status, 
                    status = stat, 
                    health = health_stat, 
                    exit_code = exit_code
                )

                containers.append(container)
            return containers
        except docker.errors.DockerException as e: 
            raise RuntimeError(f'Failed to list all containers: {e}')
    
    def close(self): 
        '''closes the Docker client connection'''
        if hasattr(self, 'client'): 
            self.client.close()
