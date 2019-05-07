import React, { Component } from 'react';
import Tree from 'react-d3-tree';
import './App.css';

const myTreeData = [
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

class App extends Component {
  constructor(props) {
    super(props)
    this.state = { package: '' }
    this.handlePackageChange = this.handlePackageChange.bind(this)
  }

  handlePackageChange(e) {
    this.setState({ package: e.target.value })
  }

  render() {
    let treeData = [{}]
    if (this.state.package === 'package') {
      treeData = myTreeData
    }

    return (
      <div className="App">
        <div id="treeWrapper" style={{width: '50em', height: '20em'}}>
          <Tree data={treeData} />
          <input value={this.state.package} onChange={this.handlePackageChange} />
        </div>
      </div>
    );
  }
}

export default App;
