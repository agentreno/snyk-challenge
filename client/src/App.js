import React, { Component } from 'react';
import Tree from 'react-d3-tree';
import {debounce} from 'lodash';
import {BounceLoader} from 'react-spinners';
import axios from 'axios';
import './App.css';

const base_api = 'http://snyk-challenge-naive-api-714444549.eu-west-1.elb.amazonaws.com'

function convertRespToGraph(data) {
    if (Object.keys(data).length === 0) return
    return Object.entries(data).map(([k, v]) => ({'name': k, 'children': convertRespToGraph(v)}))
}

function countObjKeys(obj) {
  if (typeof obj !== 'object' || obj === null) return 0
  const keys = Object.keys(obj);
  let sum = keys.length;
  keys.forEach(key => sum += countObjKeys(obj[key]));
  return sum;
}

class App extends Component {
  constructor(props) {
    super(props)
    this.state = { package: 'react', version: 'latest', treeData: [{}] }
    this.handlePackageChange = this.handlePackageChange.bind(this)
    this.handleVersionChange = this.handleVersionChange.bind(this)
    this.fetchPackageDependencies = debounce(this.fetchPackageDependencies, 750)
  }

  fetchPackageDependencies(packageName, versionName) {
    versionName = versionName || 'latest'
    this.setState({ loading: true })
    axios.get(`${base_api}/package/${packageName}/${versionName}/`).then(resp => {
      let data = convertRespToGraph(resp.data)
      if (Object.keys(data).length === 0) data = [{}]
      this.setState({ treeData: data, loading: false })
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

  componentDidMount() {
    this.fetchPackageDependencies(this.state.package, this.state.version)
  }

  render() {
    return (
      <div className="App">
        <div id="treeWrapper">
          <Tree
            data={this.state.treeData}
            orientation="vertical"
            translate={{ x: 800, y: 30 }}
            textLayout={{ textAnchor: "start", x: -30, y: 30 }}
            className={this.state.loading ? 'loading' : null}
            transitionDuration={countObjKeys(this.state.treeData) > 50 ? 0 : 500}
          />
          <div id="packageInput">
            <fieldset>
              <legend>Package Name</legend>
              <input value={this.state.package} onChange={this.handlePackageChange} />
            </fieldset>
            <fieldset>
              <legend>Package Version</legend>
              <input value={this.state.version} onChange={this.handleVersionChange} />
            </fieldset>
          </div>
        </div>
        <div id="loader">
          <BounceLoader
            sizeUnit={"px"}
            size={60}
            color={"#66E0C8"}
            loading={this.state.loading}
          />
        </div>
      </div>
    );
  }
}

export default App;
