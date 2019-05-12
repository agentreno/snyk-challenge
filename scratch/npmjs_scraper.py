import requests
import json
import semver

def get_package_metadata(package):
    base_url = 'https://registry.npmjs.org/'
    resp = requests.get(base_url + '/' + package)
    return resp.json()

def get_package_version_metadata(package, version):
    base_url = 'https://registry.npmjs.org/'
    resp = requests.get(base_url + '/' + package + '/' + version)
    return resp.json()

def get_all_package_versions(package):
    metadata = get_package_metadata(package)
    return metadata['versions'].keys()

def get_package_dependencies(package, version):
    metadata = get_package_version_metadata(package, version)
    return metadata.get('dependencies', {})

def recurse_deps(package, version):
    available_versions = get_all_package_versions(package)
    chosen_version = semver.max_satisfying(available_versions, version)
    deps = get_package_dependencies(package, chosen_version)

    if not deps:
        return {package: []}
    else:
        return {
            package: [recurse_deps(dep, ver) for dep, ver in deps.items()]
        }


package = 'react'
print(json.dumps(recurse_deps(package, '15.3.0'), indent=3))
