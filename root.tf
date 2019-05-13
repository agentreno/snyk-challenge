module "graphdb" {
    source = "./graphdb"
}

module "ecs_follower" {
    source = "./ecs_follower"
    database_endpoint = "${module.graphdb.database_endpoint}"
}

module "ecs_api" {
    source = "./ecs_api"
    database_endpoint = "${module.graphdb.database_endpoint}"
}

output "api_url" {
    value = "http://${module.ecs_api.elb_dns}/api/package/<package name>"
}
