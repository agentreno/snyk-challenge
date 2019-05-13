[
  {
    "name": "naive_dependency_api",
    "image": "karlhopkinsonturrell/naive_dependency_api",
    "cpu": 256,
    "memory": 512,
    "essential": true,
    "environment": [
      {
        "name": "CACHE_CONNECTION_STRING",
        "value": "${cache_connection_string}"
      }
    ],
    "portMappings": [
      {
        "containerPort": 8000,
        "hostPort": 8000,
        "protocol": "tcp"
      }
    ],
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": { 
        "awslogs-group" : "/ecs/naive_dependency_api",
        "awslogs-region": "eu-west-1",
        "awslogs-stream-prefix": "ecs"
      }
    }
  }
]
