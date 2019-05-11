const gremlin = require('gremlin')
const unfold = gremlin.process.statics.unfold
const addV = gremlin.process.statics.addV
const changes = require('concurrent-couch-follower')
const Normalize = require('normalize-registry-metadata')
const AWS = require('aws-sdk')

const DriverRemoteConnection = gremlin.driver.DriverRemoteConnection
const Graph = gremlin.structure.Graph
const db = 'https://replicate.npmjs.com'

var dc = new DriverRemoteConnection(process.env.DATABASE_CONNECTION_STRING);
var g = new Graph().traversal().withRemote(dc)

var throttle = require('promise-ratelimit')(10)
var cloudwatch = new AWS.CloudWatch()

function reportSeq(change) {
  // Publish current sequence number for monitoring
  var params = {
    MetricData: [
      {
        MetricName: 'CURRENT_REGISTRY_SEQUENCE_NUMBER',
        Value: change.seq,
        Timestamp: new Date,
        StorageResolution: 1
      }
    ],
    Namespace: 'CUSTOM'
  }
  cloudwatch.putMetricData(params, (err, data) => {
    if (err) console.log(err)
  })
}

async function insertDependencies(package_name, package_vertex_id, version, version_metadata) {
  // Add version to the package version list
  g.V().has('package', 'name', package_name).property('versions', version).next()
    .catch(err => { console.log('Error adding package version:\n' + err) })
    //.then(value => { console.log('Added package version:\n' + JSON.stringify(value)) })

  // Loop over dependencies for this version
  if (typeof version_metadata.dependencies === 'object') {
    Object.entries(version_metadata.dependencies).forEach(async function([dependency_name, version_constraint]) {
      // Add dependency package vertex if it doesn't exist
      dependency_vertex_resp = await g.V().has('package', 'name', dependency_name)
        .fold().coalesce(unfold(), addV('package').property('name', dependency_name)).next()
        .catch(err => { console.log('Error adding dependency vertex:\n' + err) })

      //console.log('Added dependency vertex:\n' + JSON.stringify(dependency_vertex_resp))
      if (!dependency_vertex_resp ||
          !('value' in dependency_vertex_resp) ||
          !('id' in dependency_vertex_resp.value)) {
        console.log('Received invalid vertex add response')
        return
      }
      var {value: {id: dependency_vertex_id}} = dependency_vertex_resp

      // Add depends edge from package to dependency with constraint as property
      g.V(package_vertex_id)
        .addE('depends').to(g.V(dependency_vertex_id))
        .property('from_version', version)
        .property('to_version', version_constraint)
        .next()
        .catch(err => { console.log('Error adding dependency edge:\n' + err) })
        //.then(value => { console.log('Added dependency edge:\n' + JSON.stringify(value)) })
    })
  }
}

async function processChange(change, done) {
  // Optional throttling for Neptune connection limits
  //await throttle()

  // Report progress to Cloudwatch
  if (change.seq % 10000 === 0) {
    reportSeq(change)
    console.log('Processing sequence: ' + change.seq)
  }
  // Only continue with changes relating to a package update
  if (!change || !change.doc || !change.doc.name) {
    done()
    return
  }

  metadata = Normalize(change.doc)

  // Only continue with package changes where there is a versions object with
  // dependencies to parse
  if (typeof metadata.versions !== 'object') {
    done()
    return
  }

  package_name = change.doc.name

  // Test only adding react dependencies to limit AWS costs and validate
  // approach
  var whitelist = ['react', 'loose-envify', 'js-tokens', 'object-assign', 'prop-types', 'react-is', 'scheduler']
  if (!whitelist.includes(package_name)) {
    done()
    return
  }

  // Add package vertex if it doesn't exist
  package_vertex_resp = await g.V().has('package', 'name', package_name)
    .fold().coalesce(unfold(), addV('package').property('name', package_name)).next()
    .catch(err => { console.log('Error adding package vertex:\n' + err) })
  //console.log('Added package vertex:\n' + JSON.stringify(package_vertex_resp))
  var {value: {id: package_vertex_id}} = package_vertex_resp

  // Loop over package versions, adding dependencies to the graph
  Object.entries(metadata.versions).forEach(([version, version_metadata]) => {
    if (!version || !version_metadata || !('dependencies' in version_metadata)) {
        return
    }
    insertDependencies(g, package_name, package_vertex_id,  version, version_metadata)
  })

  done()
}

var changesConfig = {
  db,
  include_docs: true,
  sequence: 'seq.txt',
  since: 0,
  concurrency: 3,
  highWaterMark: 4
}
changes(processChange, changesConfig)
