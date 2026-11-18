
// Block 3-V：往後若要用 vibe coding 增加互動功能，可從這個檔案修改。
(() => {
  const data = JSON.parse(document.getElementById('network-data').textContent);
  const metricSelect = document.getElementById('metric-select');
  const metricTitle = document.getElementById('metric-title');
  const infoBox = document.getElementById('selected-info');
  const names = { degree: 'Degree Centrality', betweenness: 'Betweenness Centrality', eigenvector: 'Eigenvector Centrality' };
  const originalNodes = data.nodes;
  const rawValues = (metric) => originalNodes.map(node => Number(node[metric]) || 0);

  // 依目前指標的最小值與最大值，將節點大小縮放到 14～48。
  function nodeSize(node, metric) {
    const values = rawValues(metric);
    const low = Math.min(...values);
    const high = Math.max(...values);
    const normalized = high === low ? 0.5 : (node[metric] - low) / (high - low);
    return 14 + normalized * 34;
  }

  const nodes = new vis.DataSet(originalNodes.map(node => ({
    ...node, size: nodeSize(node, 'degree'),
    title: `${node.label}\nDegree: ${node.degree.toFixed(3)}\nBetweenness: ${node.betweenness.toFixed(3)}\nEigenvector: ${node.eigenvector.toFixed(3)}`
  })));
  const edges = new vis.DataSet(data.edges);
  const network = new vis.Network(document.getElementById('network'), { nodes, edges }, {
    autoResize: true,
    physics: false,
    interaction: { dragNodes:true, dragView:true, zoomView:true, hover:true },
    nodes: { shape:'dot', borderWidth:1.5, color:{ background:'#4d91c5', border:'#8ab8dc', highlight:{background:'#f0ad69',border:'#ffe0b8'} }, font:{ size:15, color:'#f2f5f8', strokeWidth:0 } },
    edges: { color:{color:'#62758a',highlight:'#b5cce0'}, width:1.4, smooth:false }
  });

  function displaySelection(nodeId) {
    const node = originalNodes.find(n => n.id === nodeId);
    if (!node) { infoBox.textContent = '點選節點可以查看其分數。'; return; }
    infoBox.textContent = `${node.label}｜${names[metricSelect.value]}：${Number(node[metricSelect.value]).toFixed(3)}`;
  }

  // 只修改節點大小，不重新建立 network，維持節點座標。
  metricSelect.addEventListener('change', () => {
    const metric = metricSelect.value;
    metricTitle.textContent = names[metric];
    nodes.update(originalNodes.map(node => ({ id:node.id, size:nodeSize(node, metric) })));
    const selected = network.getSelectedNodes();
    if (selected.length) displaySelection(selected[0]);
  });
  // 點選 Node 後，只顯示該 Node 與直接相連的鄰近 Node。
  function showAllNodes() {
    nodes.update(originalNodes.map(node => ({ id:node.id, hidden:false })));
    edges.update(data.edges.map((edge, index) => ({ id:edge.id ?? index, hidden:false })));
  }

  // 為每條邊補上穩定 id，方便切換 hidden 狀態。
  const edgeRecords = data.edges.map((edge, index) => ({ ...edge, id:edge.id ?? index }));
  edges.clear();
  edges.add(edgeRecords);

  function showNodeNeighborhood(nodeId) {
    const neighbors = network.getConnectedNodes(nodeId);
    const visibleIds = new Set([nodeId, ...neighbors].map(String));
    nodes.update(originalNodes.map(node => ({
      id: node.id,
      hidden: !visibleIds.has(String(node.id))
    })));
    edges.update(edgeRecords.map(edge => ({
      id: edge.id,
      hidden: !(visibleIds.has(String(edge.from)) && visibleIds.has(String(edge.to)))
    })));
  }

  network.on('selectNode', params => {
    const nodeId = params.nodes[0];
    displaySelection(nodeId);
    showNodeNeighborhood(nodeId);
  });
  network.on('deselectNode', () => {
    displaySelection(null);
    showAllNodes();
  });
})();
