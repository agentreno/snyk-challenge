[
  {
    "name": "dependencyapi",
    "image": "karlhopkinsonturrell/dependencyapi",
    "cpu": 256,
    "memory": 512,
    "essential": true,
    "environment": [
      {
        "name": "DATABASE_CONNECTION_STRING",
        "value": "${database_connection_string}"
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
        "awslogs-group" : "/ecs/dependencyapi",
        "awslogs-region": "eu-west-1",
        "awslogs-stream-prefix": "ecs"
      }
    }
  }
]
