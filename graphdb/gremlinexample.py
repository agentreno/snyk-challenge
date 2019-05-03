from __future__  import print_function  # Python 2/3 compatibility

from gremlin_python import statics
from gremlin_python.structure.graph import Graph
from gremlin_python.process.graph_traversal import __
from gremlin_python.process.strategies import *
from gremlin_python.driver.driver_remote_connection import DriverRemoteConnection

graph = Graph()

remoteConn = DriverRemoteConnection('wss://neptunedbinstance-krlx9te41tox.c7lcmmyq4ty8.eu-west-1.neptune.amazonaws.com:8182/gremlin','g')
g = graph.traversal().withRemote(DriverRemoteConnection('wss://neptunedbinstance-krlx9te41tox.c7lcmmyq4ty8.eu-west-1.neptune.amazonaws.com:8182/gremlin','g'))

# Follow outward edges until all leaf nodes are reached, get paths
# g.V(1).until(__.not(outE())).repeat(out()).path()
print(g.V().limit(2).toList())
remoteConn.close()

