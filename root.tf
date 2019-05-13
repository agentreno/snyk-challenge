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

module "ecs_naive_api" {
    source = "./ecs_naive_api"
    cache_endpoint = "${module.cache.cache_url}"
}

module "cache" {
    source = "./cache"
}

output "api_url" {
    value = "http://${module.ecs_api.elb_dns}/api/package/<package name>/<version>/"
}

output "naive_api_url" {
    value = "http://${module.ecs_naive_api.elb_dns}/package/<package name>/<version>/"
}
