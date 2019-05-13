# Data section
data "aws_vpc" "default" {
    default = true
}

data "aws_subnet_ids" "default" {
    vpc_id = "${data.aws_vpc.default.id}"
}

# Elasticache resources
resource "aws_elasticache_cluster" "default" {
    cluster_id = "snyk-challenge"
    engine = "redis"
    node_type = "cache.t2.micro"
    num_cache_nodes = 1
    parameter_group_name = "default.redis3.2"
    engine_version = "3.2.10"
    port = 6379
    subnet_group_name = "${aws_elasticache_subnet_group.default.name}"
}

resource "aws_elasticache_subnet_group" "default" {
    name = "snyk-challenge-cache-subnet"
    subnet_ids = ["${element(data.aws_subnet_ids.default.ids, 0)}"]
}

output "cache_url" {
    value = "${aws_elasticache_cluster.default.cache_nodes.0.address}"
}
