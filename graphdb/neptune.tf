data "aws_vpc" "default" {
    default = true
}

data "aws_subnet_ids" "default" {
    vpc_id = "${data.aws_vpc.default.id}"
}

resource "aws_neptune_cluster" "default" {
    cluster_identifier = "snyk-challenge"
    engine = "neptune"
    skip_final_snapshot = true
    apply_immediately = true
    neptune_subnet_group_name = "${aws_neptune_subnet_group.default.name}"
}

resource "aws_neptune_cluster_instance" "default" {
    count = 1
    cluster_identifier = "${aws_neptune_cluster.default.id}"
    instance_class = "db.r5.xlarge"
}

resource "aws_neptune_subnet_group" "default" {
    name = "default-group"
    subnet_ids = [
        "${element(data.aws_subnet_ids.default.ids, 0)}",
        "${element(data.aws_subnet_ids.default.ids, 1)}"
    ]
}

output "database_endpoint" {
    value = "${aws_neptune_cluster_instance.default.endpoint}"
}
