# Variables
variable "database_endpoint" {}

# Data section
data "aws_vpc" "default" {
    default = true
}

data "aws_subnet_ids" "default" {
    vpc_id = "${data.aws_vpc.default.id}"
}

# IAM
resource "aws_iam_role" "follower_execution_role" {
    name = "npm_follower_execution_role"
    assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

resource "aws_iam_role_policy" "follower_logs_access" {
    name = "npm_follower_logs_access"
    role = "${aws_iam_role.follower_execution_role.id}"

    policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "logs:*"
      ],
      "Effect": "Allow",
      "Resource": "*"
    }
  ]
}
EOF
}

resource "aws_iam_role" "follower_task_role" {
    name = "npm_follower_task_role"
    assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

resource "aws_iam_role_policy" "follower_task_logs_access" {
    name = "npm_follower_task_logs_access"
    role = "${aws_iam_role.follower_task_role.id}"

    policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "logs:*",
        "cloudwatch:PutMetricData"
      ],
      "Effect": "Allow",
      "Resource": "*"
    }
  ]
}
EOF
}

# Cloudwatch resources
resource "aws_cloudwatch_log_group" "follower_logs" {
    name = "/ecs/npm_follower"
}

# ECS Resources
resource "aws_ecs_cluster" "default" {
    name = "snyk-challenge"
}

resource "template_file" "follower_task_def" {
    template = "${file("ecs_follower/taskdef.json.tpl")}"
    vars {
        database_connection_string = "wss://${var.database_endpoint}/gremlin"
    }
}

resource "aws_ecs_task_definition" "default" {
    family = "default"
    container_definitions = "${template_file.follower_task_def.rendered}"
    network_mode = "awsvpc"
    requires_compatibilities = ["FARGATE"]
    execution_role_arn = "${aws_iam_role.follower_execution_role.arn}"
    task_role_arn = "${aws_iam_role.follower_task_role.arn}"
    cpu = 1024
    memory = 2048
}

resource "aws_ecs_service" "default" {
    name = "snyk-challenge-npm-follower"
    cluster = "${aws_ecs_cluster.default.name}"
    task_definition = "${aws_ecs_task_definition.default.arn}"
    desired_count = 1
    launch_type = "FARGATE"

    network_configuration {
        subnets = ["${element(data.aws_subnet_ids.default.ids, 0)}"]
        assign_public_ip = true
    }
}
