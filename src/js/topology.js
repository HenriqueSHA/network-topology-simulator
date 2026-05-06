import * as d3 from 'd3';
import { nodesData, linksData } from './data.js';

export class NetworkTopology {
    constructor(svgSelector) {
        this.svg = d3.select(svgSelector);
        this.width = 1000;
        this.height = 700;
        this.g = this.svg.append("g");
        this.tooltip = d3.select("#tooltip");
        
        this.setupZoom();
        this.setupSimulation();
        this.linkGroup = this.g.append("g").attr("class", "links");
        this.nodeGroup = this.g.append("g").attr("class", "nodes");
        
        // Setup line drawing for Shift+Drag
        this.tempLine = this.g.append("line")
            .attr("class", "temp-link")
            .style("stroke", "var(--primary)")
            .style("stroke-width", "2px")
            .style("stroke-dasharray", "4,4")
            .style("opacity", 0)
            .style("pointer-events", "none");
            
        this.drawingLink = false;
        this.linkSourceNode = null;
        this.hoveredNode = null;

        this.currentFilter = 'all';
        this.onNodeContextMenu = null; 
        this.onGraphUpdated = null; 
        this.history = null; // Injected from main.js
        
        this.setupDragAndDrop();
        this.setupKeyboard();
    }

    setupKeyboard() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (this.hoveredNode) {
                    this.deleteNode(this.hoveredNode.id);
                }
            }
        });
    }

    setupZoom() {
        this.zoom = d3.zoom()
            .scaleExtent([0.2, 4])
            .on("zoom", (event) => {
                this.g.attr("transform", event.transform);
            });
            
        this.svg.call(this.zoom);

        document.getElementById("zoomIn").addEventListener("click", () => {
            this.svg.transition().duration(300).call(this.zoom.scaleBy, 1.3);
        });
        document.getElementById("zoomOut").addEventListener("click", () => {
            this.svg.transition().duration(300).call(this.zoom.scaleBy, 1 / 1.3);
        });
        document.getElementById("zoomReset").addEventListener("click", () => {
            this.svg.transition().duration(300).call(this.zoom.transform, d3.zoomIdentity);
        });
    }

    setupSimulation() {
        this.simulation = d3.forceSimulation()
            .force("link", d3.forceLink().id(d => d.id).distance(d => d.type === 'wan' ? 160 : 100))
            .force("charge", d3.forceManyBody().strength(-1200))
            .force("center", d3.forceCenter(this.width / 2, this.height / 2))
            .force("collide", d3.forceCollide().radius(45));
    }

    setupDragAndDrop() {
        const svgEl = document.getElementById('networkSvg');
        
        svgEl.addEventListener('dragover', (e) => {
            e.preventDefault(); 
        });

        svgEl.addEventListener('drop', (e) => {
            e.preventDefault();
            const type = e.dataTransfer.getData('text/plain');
            if (type !== 'router' && type !== 'device') return;

            const rect = svgEl.getBoundingClientRect();
            const transform = d3.zoomTransform(this.svg.node());
            
            const x = transform.invertX(e.clientX - rect.left);
            const y = transform.invertY(e.clientY - rect.top);

            const isRouter = type === 'router';
            const id = isRouter ? `R${Date.now().toString().slice(-4)}` : `PC-${Date.now().toString().slice(-4)}`;
            
            nodesData.push({
                id: id,
                type: type,
                desc: isRouter ? 'Roteador Adicionado' : 'Dispositivo Adicionado',
                x: x,
                y: y,
                fx: x, 
                fy: y
            });
            
            this.showStatus(`${id} adicionado com sucesso!`, 'info');
            if(this.history) this.history.saveState();
            this.updateGraph();
        });

        document.querySelectorAll('.draggable-item').forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', e.target.getAttribute('data-type'));
            });
        });
    }

    deleteNode(nodeId) {
        // Remover nó
        const nodeIndex = nodesData.findIndex(n => n.id === nodeId);
        if (nodeIndex > -1) nodesData.splice(nodeIndex, 1);
        
        // Remover links associados
        for (let i = linksData.length - 1; i >= 0; i--) {
            let l = linksData[i];
            let sid = typeof l.source === 'object' ? l.source.id : l.source;
            let tid = typeof l.target === 'object' ? l.target.id : l.target;
            if (sid === nodeId || tid === nodeId) {
                linksData.splice(i, 1);
            }
        }
        
        this.hoveredNode = null;
        this.tooltip.style("opacity", 0);
        this.showStatus(`Nó ${nodeId} excluído.`, 'warn');
        if(this.history) this.history.saveState();
        this.updateGraph();
    }

    renameNode(oldId, newId) {
        if (!newId || newId.trim() === "" || newId === oldId) return;
        if (nodesData.some(n => n.id === newId)) {
            this.showStatus(`O nome ${newId} já existe!`, 'error');
            return;
        }

        const node = nodesData.find(n => n.id === oldId);
        if (node) {
            node.id = newId;
            // Update links
            linksData.forEach(l => {
                let sid = typeof l.source === 'object' ? l.source.id : l.source;
                let tid = typeof l.target === 'object' ? l.target.id : l.target;
                
                if (sid === oldId) l.source = newId;
                if (tid === oldId) l.target = newId;
            });
            
            this.showStatus(`Nó renomeado para ${newId}.`, 'info');
            if(this.history) this.history.saveState();
            this.updateGraph();
        }
    }

    getRouterPath() {
        // Router icon: hexágono com setas de rede nas 4 direções
        return "M 0,-18 L 15,-9 L 15,9 L 0,18 L -15,9 L -15,-9 Z M -7,0 L -12,0 M 7,0 L 12,0 M 0,-7 L 0,-12 M 0,7 L 0,12";
    }

    getDevicePath() {
        // Device icon: monitor com base
        return "M -14,-12 L 14,-12 L 14,6 L -14,6 Z M -8,6 L -8,10 L 8,10 L 8,6 M -10,10 L 10,10";
    }

    updateGraph(filterType = this.currentFilter) {
        this.currentFilter = filterType;
        
        let filteredLinks = linksData;
        if (filterType === 'wan') {
            filteredLinks = linksData.filter(d => d.type === 'wan');
        } else if (filterType === 'lan') {
            filteredLinks = linksData.filter(d => d.type === 'lan');
        }

        let connectedNodeIds = new Set();
        filteredLinks.forEach(l => {
            connectedNodeIds.add(typeof l.source === 'object' ? l.source.id : l.source);
            connectedNodeIds.add(typeof l.target === 'object' ? l.target.id : l.target);
        });

        let filteredNodes = nodesData;
        if(filterType !== 'all') {
             filteredNodes = nodesData.filter(n => connectedNodeIds.has(n.id));
        }

        // Links
        const linkSelection = this.linkGroup.selectAll(".link-group")
            .data(filteredLinks, d => d.id);

        linkSelection.exit().remove();

        const linkEnter = linkSelection.enter().append("g")
            .attr("class", "link-group");

        // Invisible fat line for easier clicking
        linkEnter.append("line")
            .attr("class", "link-hitbox")
            .style("stroke", "transparent")
            .style("stroke-width", "15px")
            .style("cursor", "pointer")
            .on("click", (event, d) => {
                if(d.type === 'wan') {
                    d.broken = !d.broken;
                    if(this.history) this.history.saveState();
                    this.updateGraph();
                    this.showStatus(`Link ${d.source.id || d.source} - ${d.target.id || d.target} ${d.broken ? 'DERRUBADO!' : 'RESTABELECIDO'}`, d.broken ? 'error' : 'info');
                }
            })
            .on("contextmenu", (event, d) => {
                event.preventDefault();
                let speedInput = prompt("Alterar Velocidade do Link:\n1 = Fibra (Rápido)\n2 = Normal\n3 = Rádio/Satélite (Lento)", d.bandwidth === 'fast' ? "1" : (d.bandwidth === 'slow' ? "3" : "2"));
                if (speedInput === "1") d.bandwidth = 'fast';
                else if (speedInput === "3") d.bandwidth = 'slow';
                else if (speedInput === "2") d.bandwidth = 'normal';
                else return;
                
                if(this.history) this.history.saveState();
                this.updateGraph();
                this.showStatus("Velocidade do link atualizada!", "info");
            });

        // Visible line
        linkEnter.append("line")
            .attr("class", d => {
                let techClass = 'link-normal';
                if(d.bandwidth === 'fast') techClass = 'link-fiber';
                else if(d.bandwidth === 'slow') techClass = 'link-radio';
                return `visible-link ${d.type}-link ${techClass} ${d.broken ? 'link-broken' : ''}`;
            })
            .style("pointer-events", "none");

        const labelGroup = linkEnter.append("g").attr("class", "link-label-group");
        
        labelGroup.append("rect").attr("class", "link-label-bg");
        labelGroup.append("text")
            .attr("class", "link-label")
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "central")
            .text(d => d.label || "");

        this.link = linkEnter.merge(linkSelection);
        
        this.link.select(".visible-link")
            .attr("class", d => {
                let techClass = 'link-normal';
                if(d.bandwidth === 'fast') techClass = 'link-fiber';
                else if(d.bandwidth === 'slow') techClass = 'link-radio';
                return `visible-link ${d.type}-link ${techClass} ${d.broken ? 'link-broken' : ''}`;
            });

        // Update labels dynamically in case they changed
        this.link.select(".link-label")
            .text(d => d.label);

        // Nodes
        const nodeSelection = this.nodeGroup.selectAll(".node-group")
            .data(filteredNodes, d => d.id);

        nodeSelection.exit().remove();

        const nodeEnter = nodeSelection.enter().append("g")
            .attr("class", d => `node-group ${d.offline ? 'node-offline' : ''}`)
            .call(d3.drag()
                .on("start", (e, d) => this.dragstarted(e, d))
                .on("drag", (e, d) => this.dragged(e, d))
                .on("end", (e, d) => this.dragended(e, d)))
            .on("click", (event, d) => {
                if (event.defaultPrevented) return;
                if (event.shiftKey) return; 

                if (d.type === 'router') {
                    d.offline = !d.offline;
                    
                    linksData.forEach(l => {
                        let sid = typeof l.source === 'object' ? l.source.id : l.source;
                        let tid = typeof l.target === 'object' ? l.target.id : l.target;
                        
                        let sourceNode = nodesData.find(n => n.id === sid);
                        let targetNode = nodesData.find(n => n.id === tid);
                        if (sourceNode && targetNode) {
                            l.broken = sourceNode.offline || targetNode.offline;
                        }
                    });
                    
                    if(this.history) this.history.saveState();
                    this.updateGraph();
                    this.showStatus(`Roteador ${d.id} ${d.offline ? 'DESLIGADO!' : 'LIGADO'}`, d.offline ? 'error' : 'info');
                }
            })
            .on("contextmenu", (event, d) => {
                if (this.onNodeContextMenu) {
                    this.onNodeContextMenu(event, d);
                }
            })
            .on("dblclick", (event, d) => {
                d.fx = null;
                d.fy = null;
                this.simulation.alphaTarget(0.3).restart();
                setTimeout(() => this.simulation.alphaTarget(0), 500);
            })
            .on("mouseover", (event, d) => {
                this.hoveredNode = d;
                if (this.drawingLink) return;
                this.tooltip.transition().duration(200).style("opacity", 1);
                this.tooltip.html(`<strong>${d.id}</strong>${d.desc}<br/>Tipo: ${d.type === 'router' ? 'Roteador' : 'Dispositivo'}`)
                    .style("left", (event.pageX + 15) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", () => {
                this.hoveredNode = null;
                this.tooltip.transition().duration(500).style("opacity", 0);
            });

        nodeEnter.append("path")
            .attr("d", d => d.type === "router" ? this.getRouterPath() : this.getDevicePath())
            .attr("class", d => d.type === "router" ? "router-icon" : "device-icon")
            .attr("transform", "scale(1.5)");

        nodeEnter.append("text")
            .attr("class", "node-label")
            .attr("dy", d => d.type === "router" ? -35 : -25)
            .attr("text-anchor", "middle")
            .text(d => d.id);

        this.node = nodeEnter.merge(nodeSelection);
        this.node.attr("class", d => `node-group ${d.offline ? 'node-offline' : ''}`);

        this.simulation.nodes(filteredNodes);
        this.simulation.force("link").links(filteredLinks);
        this.simulation.alpha(1).restart();

        this.simulation.on("tick", () => this.onTick());
        
        if(this.onGraphUpdated) this.onGraphUpdated();
    }

    onTick() {
        this.link.selectAll("line")
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        this.link.select(".link-label-group")
            .attr("transform", d => `translate(${(d.source.x + d.target.x) / 2}, ${(d.source.y + d.target.y) / 2})`);

        this.link.selectAll(".link-label-group").each(function() {
            const text = d3.select(this).select("text");
            const bbox = text.node().getBBox();
            const padding = 6;
            d3.select(this).select("rect")
                .attr("x", bbox.x - padding/2)
                .attr("y", bbox.y - padding/2)
                .attr("width", bbox.width + padding)
                .attr("height", bbox.height + padding);
        });

        this.node.attr("transform", d => {
            const r = 30;
            d.x = Math.max(r, Math.min(this.width - r, d.x));
            d.y = Math.max(r, Math.min(this.height - r, d.y));
            return `translate(${d.x}, ${d.y})`;
        });
    }

    dragstarted(event, d) {
        if(event.sourceEvent.shiftKey) {
            this.drawingLink = true;
            this.linkSourceNode = d;
            this.tempLine.attr("x1", d.x).attr("y1", d.y).attr("x2", d.x).attr("y2", d.y).style("opacity", 1);
            return;
        }
        
        if (!event.active) this.simulation.alphaTarget(0.3).restart();
        d.fx = d.x; d.fy = d.y;
    }

    dragged(event, d) {
        if(this.drawingLink) {
            this.tempLine.attr("x2", event.x).attr("y2", event.y);
            return;
        }
        d.fx = event.x; d.fy = event.y;
    }

    dragended(event, d) {
        if(this.drawingLink) {
            this.drawingLink = false;
            this.tempLine.style("opacity", 0);
            
            const r = 40;
            const target = nodesData.find(n => n.id !== d.id && Math.hypot(n.x - event.x, n.y - event.y) < r);
            
            if(target) {
                const isWan = d.type === 'router' && target.type === 'router';
                const type = isWan ? 'wan' : 'lan';
                
                // Pedir IP via prompt
                let userIp = prompt("Digite o IP para esta conexão:", isWan ? "Auto-WAN" : "Auto-LAN");
                if(userIp === null) return; 
                if(userIp.trim() === "") userIp = isWan ? "Auto-WAN" : "Auto-LAN";
                
                // Pedir Velocidade
                let bandwidth = 'normal';
                if (isWan) {
                    let speedInput = prompt("Velocidade do Link WAN:\n1 = Fibra (Rápido)\n2 = Normal\n3 = Rádio/Satélite (Lento)", "2");
                    if (speedInput === "1") bandwidth = 'fast';
                    else if (speedInput === "3") bandwidth = 'slow';
                } else {
                    bandwidth = 'fast'; // LAN is fast by default
                }
                
                linksData.push({
                    id: `l-${Date.now()}`,
                    source: d.id,
                    target: target.id,
                    type: type,
                    label: userIp,
                    bandwidth: bandwidth,
                    broken: false
                });
                
                this.showStatus("Nova conexão criada com OSPF ativado!", "info");
                if(this.history) this.history.saveState();
                this.updateGraph();
            }
            return;
        }

        if (!event.active) this.simulation.alphaTarget(0);
    }

    showStatus(msg, type) {
        const el = document.getElementById("statusAlert");
        el.textContent = msg;
        el.className = `status-alert ${type}`;
        el.classList.remove("hidden");
        clearTimeout(this.statusTimer);
        this.statusTimer = setTimeout(() => {
            el.classList.add("hidden");
        }, 4000);
    }
}
