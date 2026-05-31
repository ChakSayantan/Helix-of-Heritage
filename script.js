function loadTree(mode, lineageOption="gen5") {
  const file = mode === "heritage" ? "heritage.json" : "lineage.json";

  d3.json(file).then(function(nodes) {
    d3.select("#tree").selectAll("*").remove();

    // Show/hide lineage dropdown
    if (mode === "lineage") {
      document.getElementById("lineageSelector").style.display = "block";
      nodes = lineageOption === "gen5" ? nodes.slice(0, 30) : nodes;
      document.getElementById("lineageMode").value = lineageOption;
    } else {
      document.getElementById("lineageSelector").style.display = "none";
    }

    const nodeMap = {};
    nodes.forEach(n => nodeMap[n.id] = n);

    function buildHierarchy(rootId) {
      const root = nodeMap[rootId];
      if (!root) return null;
      const children = [];
      if (root.father && nodeMap[root.father]) children.push(buildHierarchy(root.father));
      if (root.mother && nodeMap[root.mother]) children.push(buildHierarchy(root.mother));
      return { ...root, children };
    }

    const rootData = buildHierarchy("1");
    const root = d3.hierarchy(rootData);

    if (mode === "lineage") {
      // const width = 900, height = 700;
      // document.getElementById("tree").classList.remove("heritage");

      // // Radial layout for lineage
      // const radius = width / 2;
      // const tree = d3.tree().size([2 * Math.PI, radius - 100]);
      // tree(root);

      // const svg = d3.select("#tree").append("svg")
      //   .attr("width", width).attr("height", width)
      //   .append("g").attr("transform", `translate(${radius},${radius})`);

      document.getElementById("tree").classList.remove("heritage");

      let width, height, radius;
      if (lineageOption === "complete") {
        width = 1600; height = 1600;
        radius = width / 2;
      } else {
        width = 900; height = 700;
        radius = width / 2;
      }

      // Radial layout for lineage
      const tree = d3.tree().size([2 * Math.PI, radius - (lineageOption === "complete" ? 200 : 100)]);
      tree(root);

      const svg = d3.select("#tree").append("svg")
        .attr("width", width).attr("height", height);

      const g = svg.append("g").attr("transform", `translate(${radius},${radius})`);

      // Enable zoom/pan only for complete lineage
      if (lineageOption === "complete") {
        svg.call(d3.zoom().scaleExtent([0.5, 3]).on("zoom", (event) => {
          g.attr("transform", event.transform);
        }));
      }

      // Links
      // svg.append("g").selectAll("path")
      g.append("g").selectAll("path")
        .data(root.links())
        .join("path")
        .attr("d", d3.linkRadial()
          .angle(d => d.x)
          .radius(d => d.y))
        .attr("stroke", "#555")
        .attr("fill", "none");

      // Colors per generation
      const generationColors = {};
      const colorPalette = ["#f4a261", "#2a9d8f", "#e76f51", "#264653", "#8ab17d", "#a06cd5"];
      function getColor(depth) {
        if (!generationColors[depth]) {
          const available = colorPalette.filter(c => !Object.values(generationColors).includes(c));
          generationColors[depth] = available.length > 0 ? available[Math.floor(Math.random() * available.length)] : "#69b3a2";
        }
        return generationColors[depth];
      }

      // Nodes
      // const nodeGroup = svg.append("g").selectAll("g")
      //   .data(root.descendants())
      //   .join("g")
      //   .attr("transform", d => `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0)`);

      const nodeGroup = g.append("g").selectAll("g")
        .data(root.descendants())
        .join("g")
        .attr("transform", d => `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0)`);

      nodeGroup.append("circle")
        .attr("r", 20)
        .attr("fill", d => getColor(d.depth))
        .attr("stroke", "#333")
        .attr("stroke-width", 1.5)
        .on("click", (event, d) => {
          const panel = document.getElementById("infoPanel");
          panel.classList.add("active");
          const doeLine = d.data.doe ? `<p><strong>DOE:</strong> ${d.data.doe}</p>` : "";
          panel.innerHTML =
            `<div class="content">
               <div id="closePanel" class="close-tab">&nbsp;&nbsp;&gt;</div>
               <h2>${d.data.bengali_name}</h2>
               <h3>${d.data.english_name}</h3>
               <p><strong>DOB:</strong> ${d.data.dob}</p>
               ${doeLine}
               <p>${d.data.details}</p>
               <img src="${d.data.photo}" alt="${d.data.english_name}">
             </div>`;

          // Attach close handler
          document.getElementById("closePanel").addEventListener("click", () => {
            panel.classList.remove("active");
          });
        });

      nodeGroup.append("text")
        .attr("dy", -30)
        .attr("text-anchor", "middle")
        .attr("class", "node-label")
        .text(d => d.data.bengali_name ? d.data.bengali_name.split(" ")[0] : "");

    } else {
      document.getElementById("tree").classList.add("heritage");

      const width = 1800, height = 1000;
      const svg = d3.select("#tree").append("svg")
        .attr("width", width).attr("height", height);

      const positions = {
        "1": {x: 1000, y: 700},
        "2": {x: 750, y: 500},
        "3": {x: 1250, y: 500},
        "4": {x: 600, y: 300},
        "5": {x: 900, y: 300},
        "6": {x: 1200, y: 300},
        "7": {x: 1500, y: 300},
        "8": {x: 1450, y: 500},
        "9": {x: 400, y: 300},
        "10": {x: 200, y: 300},
        "11": {x: 400, y: 100},
        "12": {x: 600, y: 100},
        "13": {x: 825, y: 100},
        "14": {x: 975, y: 100},
        "15": {x: 1125, y: 100},
        "16": {x: 1275, y: 100},
        "17": {x: 1425, y: 100},
        "18": {x: 1575, y: 100}
      };

      const links = [];
      nodes.forEach(n => {
        if (n.father && positions[n.father]) {
          links.push({source: n.id, target: n.father});
        }
        if (n.mother && positions[n.mother]) {
          links.push({source: n.id, target: n.mother});
        }
      });

      svg.append("defs").append("marker")
        .attr("id", "arrow")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 20).attr("refY", 0)
        .attr("markerWidth", 6).attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", "#555");

      svg.append("g").selectAll("line")
        .data(links)
        .join("line")
        .attr("x1", d => positions[d.source].x)
        .attr("y1", d => positions[d.source].y)
        .attr("x2", d => positions[d.target].x)
        .attr("y2", d => positions[d.target].y)
        .attr("stroke", "#555")
        .attr("stroke-width", 2)  
        .attr("marker-end", "url(#arrow)");

      const nodeGroup = svg.selectAll("g.node")
        .data(nodes)
        .join("g")
        .attr("class", "node")
        .attr("transform", d => {
          const pos = positions[d.id];
          return pos ? `translate(${pos.x},${pos.y})` : "translate(50,50)";
        });

      nodeGroup.append("image")
        .attr("xlink:href", d => d.photo)
        .attr("x", -25).attr("y", -25)
        .attr("width", 50).attr("height", 50);

      nodeGroup.append("text")
        .attr("dy", 70).attr("text-anchor", "middle").attr("class", "node-label")
        .text(d => d.name);
    }
  });
}

// Initial load 
loadTree("heritage");

// Dropdown listener for main mode
document.getElementById("treeMode").addEventListener("change", function() {
  if (this.value === "lineage") {
    loadTree("lineage", "gen5"); // default to Gen5
  } else {
    loadTree(this.value);
  }
});

// Dropdown listener for lineage sub-mode
document.getElementById("lineageMode").addEventListener("change", function() {
  loadTree("lineage", this.value);
});
