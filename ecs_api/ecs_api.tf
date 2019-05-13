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
resource "aws_iam_role" "api_execution_role" {
    name = "dependency_api_execution_role"
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

resource "aws_iam_role_policy" "api_logs_access" {
    name = "dependency_api_logs_access"
    role = "${aws_iam_role.api_execution_role.id}"

    policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "logs:**"
      ],
      "Effect": "Allow",
      "Resource": "*"
    }
  ]
}
EOF
}

# Cloudwatch resources
resource "aws_cloudwatch_log_group" "api_logs" {
    name = "/ecs/dependencyapi"
}

# Load Balancer resources
resource "aws_lb" "default" {
    name = "snyk-challenge-api"
    internal = false
    load_balancer_type = "application"
    subnets = [
        "${element(data.aws_subnet_ids.default.ids, 0)}",
        "${element(data.aws_subnet_ids.default.ids, 1)}"
    ]
}

resource "aws_lb_target_group" "default" {
    name = "snyk-challenge-api-tg"
    port = 8000
    protocol = "HTTP"
    vpc_id = "${data.aws_vpc.default.id}"
    target_type = "ip"

    health_check {
        enabled = true
        path = "/admin/login/"
    }
}

resource "aws_lb_listener" "default" {
    load_balancer_arn = "${aws_lb.default.arn}"
    port = "80"
    protocol = "HTTP"
    
    default_action {
        type = "forward"
        target_group_arn = "${aws_lb_target_group.default.arn}"
    }
}

# ECS Resources
resource "aws_ecs_cluster" "default" {
    name = "snyk-challenge-api"
}

resource "template_file" "api_task_def" {
    template = "${file("ecs_api/taskdef.json.tpl")}"
    vars {
        database_connection_string = "wss://${var.database_endpoint}/gremlin"
    }
}

resource "aws_ecs_task_definition" "default" {
    family = "api"
    container_definitions = "${template_file.api_task_def.rendered}"
    network_mode = "awsvpc"
    requires_compatibilities = ["FARGATE"]
    execution_role_arn = "${aws_iam_role.api_execution_role.arn}"
    cpu = 256
    memory = 512
}

resource "aws_ecs_service" "default" {
    name = "snyk-challenge-api"
    cluster = "${aws_ecs_cluster.default.name}"
    task_definition = "${aws_ecs_task_definition.default.arn}"
    desired_count = 1
    launch_type = "FARGATE"

    network_configuration {
        subnets = ["${element(data.aws_subnet_ids.default.ids, 0)}"]
        assign_public_ip = true
    }

    load_balancer {
        target_group_arn = "${aws_lb_target_group.default.arn}"
        container_name = "dependencyapi"
        container_port = 8000
    }
}

output "elb_dns" {
    value = "${aws_lb.default.dns_name}"
}
