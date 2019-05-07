[
  {
    "name": "npm_follower",
    "image": "karlhopkinsonturrell/npm_follower",
    "cpu": 256,
    "memory": 512,
    "essential": true,
    "environment": [
      {
        "name": "DATABASE_CONNECTION_STRING",
        "value": "${database_connection_string}"
      }
    ],
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": { 
        "awslogs-group" : "/ecs/npm_follower",
        "awslogs-region": "eu-west-1",
        "awslogs-stream-prefix": "ecs"
      }
    }
  }
]
