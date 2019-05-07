module "graphdb" {
    source = "./graphdb"
}

module "ecs_follower" {
    source = "./ecs_follower"
    database_endpoint = "${module.graphdb.database_endpoint}"
}
