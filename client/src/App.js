import React, { Component } from 'react';
import Tree from 'react-d3-tree';
import axios from 'axios';
import './App.css';

const base_api = 'http://snyk-challenge-naive-api-714444549.eu-west-1.elb.amazonaws.com'

var myTreeData = [
  {
    name: 'Top Level',
    attributes: {
      keyA: 'val A',
      keyB: 'val B',
      keyC: 'val C',
    },
    children: [
      {
        name: 'Level 2: A',
        attributes: {
          keyA: 'val A',
          keyB: 'val B',
          keyC: 'val C',
        },
      },
      {
        name: 'Level 2: B',
      },
    ],
  },
];

function convertRespToGraph(data) {
    if (Object.keys(data).length === 0) return
    return Object.entries(data).map(([k, v]) => ({'name': k, 'children': convertRespToGraph(v)}))
}

class App extends Component {
  constructor(props) {
    super(props)
    this.state = { package: '', treeData: [{}] }
    this.handlePackageChange = this.handlePackageChange.bind(this)
  }

  handlePackageChange(e) {
    this.setState({ package: e.target.value })
    axios.get(base_api + '/package/' + e.target.value + '/latest/').then(resp => {
      this.setState({ treeData: convertRespToGraph(resp.data) })
    }).catch(err => { console.log(err) })
  }

  render() {
    return (
      <div className="App">
        <div id="treeWrapper">
          <Tree data={this.state.treeData} translate={{x: 50, y: 400}} />
          <div id="packageInput">
            <p>Insert the name of a package here:</p>
            <input value={this.state.package} onChange={this.handlePackageChange} />
          </div>
        </div>
      </div>
    );
  }
}

export default App;
