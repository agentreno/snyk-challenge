const gremlin = require('gremlin')
const unfold = gremlin.process.statics.unfold
const addV = gremlin.process.statics.addV
const ChangesStream = require('changes-stream')
const Normalize = require('normalize-registry-metadata')

const DriverRemoteConnection = gremlin.driver.DriverRemoteConnection
const Graph = gremlin.structure.Graph
const db = 'https://replicate.npmjs.com'

var dc = new DriverRemoteConnection(process.env.DATABASE_CONNECTION_STRING);
const g = new Graph().traversal().withRemote(dc)

var changes = new ChangesStream({
   db: db,
   include_docs: true,
   since: 'now',
})

changes.on('data', async function(change) {
  if (change.doc.name) {
    metadata = Normalize(change.doc)

    if (typeof metadata.versions === 'object') {
      package_name = change.doc.name
      console.log('Processing update on ' + package_name)

      // Add package vertex if it doesn't exist
      package_vertex_resp = await g.V().has('package', 'name', package_name)
        .fold().coalesce(unfold(), addV('package').property('name', package_name)).next()
        .catch(err => { console.log('Error adding package vertex:\n' + err) })
      console.log('Added package vertex:\n' + JSON.stringify(package_vertex_resp))
      var {value: {id: package_vertex_id}} = package_vertex_resp

      // Loop over package versions, adding dependencies to the graph
      Object.entries(metadata.versions).forEach(([version, version_metadata]) => {
        // Add version to the package version list
       g.V().has('package', 'name', package_name).property('versions', version).next()
        .then(value => { console.log('Added package version:\n' + JSON.stringify(value)) })
        .catch(err => { console.log('Error adding package version:\n' + err) })

        // Loop over dependencies for this version
        if (typeof version_metadata.dependencies === 'object') {
          Object.entries(version_metadata.dependencies).forEach(async function([dependency_name, version_constraint]) {
            // Add dependency package vertex if it doesn't exist
            dependency_vertex_resp = await g.V().has('package', 'name', dependency_name)
              .fold().coalesce(unfold(), addV('package').property('name', dependency_name)).next()
              .catch(err => { console.log('Error adding dependency vertex:\n' + err) })
            console.log('Added dependency vertex:\n' + JSON.stringify(dependency_vertex_resp))
            var {value: {id: dependency_vertex_id}} = dependency_vertex_resp

            // Add depends edge from package to dependency with constraint as property
            g.V(package_vertex_id)
              .addE('depends').to(g.V(dependency_vertex_id))
              .property('from_version', version)
              .property('to_version', version_constraint)
              .next()
              .then(value => { console.log('Added dependency edge:\n' + JSON.stringify(value)) })
              .catch(err => { console.log('Error adding dependency edge:\n' + err) })
          })
        }
      })
    }
  }
})
