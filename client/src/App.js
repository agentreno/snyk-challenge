import React, { Component } from 'react';
import Tree from 'react-d3-tree';
import {debounce} from 'lodash'
import axios from 'axios';
import './App.css';

const base_api = 'http://snyk-challenge-naive-api-714444549.eu-west-1.elb.amazonaws.com'

function convertRespToGraph(data) {
    if (Object.keys(data).length === 0) return
    return Object.entries(data).map(([k, v]) => ({'name': k, 'children': convertRespToGraph(v)}))
}

class App extends Component {
  constructor(props) {
    super(props)
    this.state = { package: '', version: '', treeData: [{}] }
    this.handlePackageChange = this.handlePackageChange.bind(this)
    this.handleVersionChange = this.handleVersionChange.bind(this)
    this.fetchPackageDependencies = debounce(this.fetchPackageDependencies, 250)
  }

  fetchPackageDependencies(packageName, versionName) {
    versionName = versionName || 'latest'
    axios.get(`${base_api}/package/${packageName}/${versionName}/`).then(resp => {
      let data = convertRespToGraph(resp.data)
      if (Object.keys(data).length === 0) data = [{}]
      this.setState({ treeData: data })
    }).catch(err => { console.log(err) })
  }

  handlePackageChange(e) {
    this.setState({ package: e.target.value })
    this.fetchPackageDependencies(e.target.value, this.state.version)
  }

  handleVersionChange(e) {
    this.setState({ version: e.target.value })
    this.fetchPackageDependencies(this.state.package, e.target.value)
  }

  render() {
    return (
      <div className="App">
        <div id="treeWrapper">
          <Tree data={this.state.treeData} translate={{x: 50, y: 400}} />
          <div id="packageInput">
            <p>Insert the name of a package here:</p>
            <input value={this.state.package} onChange={this.handlePackageChange} />
            <p>Insert the version of a package here:</p>
            <input value={this.state.version} onChange={this.handleVersionChange} />
          </div>
        </div>
      </div>
    );
  }
}

export default App;
