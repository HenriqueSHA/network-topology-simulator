import * as d3 from 'd3';
import { nodesData, linksData } from './data.js';

export class PacketSimulation {
    constructor(topology, terminal) {
        this.topology = topology;
        this.terminal = terminal;
        this.stressTestInterval = null;
        this.activeTrafficCount = 0;
        
        this.settings = {
            speed: 400,
            volume: 1,
            interval: 1500
        };

        this.populateSelects();
        this.topology.onGraphUpdated = () => this.populateSelects();
        
        // Registrar callback do terminal
        this.terminal.onCommand = (cmd) => this.handleCommand(cmd);
    }

    handleCommand(cmd) {
        const args = cmd.split(' ');
        const action = args[0].toLowerCase();
        
        if (action === 'ping' && args[1]) {
            const target = args[1];
            // Pick a random PC to ping from if origin not specified
            const origin = document.getElementById('sourceSelect').value || nodesData.find(n => n.id.startsWith('PC-')).id;
            this.terminal.log(`Disparando ping de ${origin} para ${target}...`, "info");
            
            // Simular 4 pings com intervalo
            for(let i=0; i<4; i++) {
                setTimeout(() => {
                    const start = performance.now();
                    this.run(origin, target, true, (success) => {
                        const ms = Math.floor(performance.now() - start);
                        if(success) {
                            this.terminal.log(`Resposta de ${target}: tempo=${ms}ms`, "success");
                        } else {
                            this.terminal.log(`Esgotado o tempo limite do pedido para ${target}.`, "error");
                        }
                    });
                }, i * 1000);
            }
        } 
        else if (action === 'traceroute' && args[1]) {
            const target = args[1];
            const origin = document.getElementById('sourceSelect').value || nodesData.find(n => n.id.startsWith('PC-')).id;
            this.terminal.log(`Rastreando a rota para ${target} a partir de ${origin}...`, "info");
            
            const path = this.findShortestPath(origin, target);
            if(!path) {
                this.terminal.log(`Destino inatingível.`, "error");
            } else {
                path.forEach((node, idx) => {
                    setTimeout(() => {
                        this.terminal.log(` ${idx}  ${node}`, "normal");
                    }, idx * 500);
                });
            }
        }
        else {
            this.terminal.log(`Comando não reconhecido. Use: ping <alvo> ou traceroute <alvo>`, "error");
        }
    }

    populateSelects() {
        const sourceSelect = document.getElementById('sourceSelect');
        const targetSelect = document.getElementById('targetSelect');
        
        const sVal = sourceSelect.value;
        const tVal = targetSelect.value;

        sourceSelect.innerHTML = '';
        targetSelect.innerHTML = '';

        nodesData.forEach(n => {
            let opt1 = document.createElement('option');
            opt1.value = n.id;
            opt1.textContent = n.id;
            sourceSelect.appendChild(opt1);

            let opt2 = document.createElement('option');
            opt2.value = n.id;
            opt2.textContent = n.id;
            targetSelect.appendChild(opt2);
        });
        
        if(sVal && Array.from(sourceSelect.options).some(o => o.value === sVal)) sourceSelect.value = sVal;
        else if(nodesData.find(n => n.id === 'PC-A')) sourceSelect.value = 'PC-A';
        
        if(tVal && Array.from(targetSelect.options).some(o => o.value === tVal)) targetSelect.value = tVal;
        else if(nodesData.find(n => n.id === 'WEB1')) targetSelect.value = 'WEB1';
    }

    // Dijkstra Algorithm for OSPF
    findShortestPath(startId, endId) {
        if (startId === endId) return [startId];
        
        const adj = {};
        nodesData.forEach(n => {
            if(!n.offline) adj[n.id] = [];
        });
        
        linksData.filter(l => !l.broken).forEach(l => {
            let s = typeof l.source === 'object' ? l.source.id : l.source;
            let t = typeof l.target === 'object' ? l.target.id : l.target;
            
            // Weight based on bandwidth (if fast = 1, normal = 5, slow = 20)
            let weight = 5; // default
            if(l.bandwidth === 'fast' || l.type === 'lan') weight = 1;
            if(l.bandwidth === 'slow') weight = 20;

            if(adj[s] && adj[t]) {
                adj[s].push({ node: t, weight: weight });
                adj[t].push({ node: s, weight: weight });
            }
        });
        
        if(!adj[startId]) return null;

        const dist = {};
        const prev = {};
        const pq = [];

        nodesData.forEach(n => {
            dist[n.id] = Infinity;
            prev[n.id] = null;
        });
        
        dist[startId] = 0;
        pq.push({ id: startId, d: 0 });

        while(pq.length > 0) {
            pq.sort((a,b) => a.d - b.d);
            const u = pq.shift().id;

            if (u === endId) break;

            for(let neighbor of adj[u]) {
                const v = neighbor.node;
                const alt = dist[u] + neighbor.weight;
                if(alt < dist[v]) {
                    dist[v] = alt;
                    prev[v] = u;
                    pq.push({ id: v, d: alt });
                }
            }
        }

        if(prev[endId] === null) return null;

        const path = [];
        let curr = endId;
        while(curr !== null) {
            path.unshift(curr);
            curr = prev[curr];
        }
        return path;
    }

    updateDashboardLoad() {
        // Find max load
        let maxLoad = 0;
        nodesData.forEach(n => {
            if(n.stressLoad > maxLoad) maxLoad = n.stressLoad;
            
            // Visual heat effect
            const nodeEl = this.topology.nodeGroup.selectAll('.node-group').filter(d => d.id === n.id);
            if(n.stressLoad > 5) {
                nodeEl.select('path').style('fill', 'var(--danger)');
            } else if(n.stressLoad > 2) {
                nodeEl.select('path').style('fill', 'var(--warning)');
            } else {
                nodeEl.select('path').style('fill', null); // default
            }
        });
        
        document.getElementById('dashMaxLoad').textContent = maxLoad;
        document.getElementById('dashActiveTraff').textContent = this.activeTrafficCount;
    }

    run(startId, endId, isBackground = false, callback = null) {
        if (startId === endId) {
            if(!isBackground) this.terminal.log("Falha: Origem e Destino são os mesmos.", "error");
            if(callback) callback(false);
            return;
        }
        
        const path = this.findShortestPath(startId, endId);
        if (!path) {
            if(!isBackground) this.terminal.log(`FALHA: ${startId} não consegue alcançar ${endId} (sem rota).`, "error");
            if(callback) callback(false);
            return;
        }

        if(!isBackground) this.terminal.log(`ROTA (OSPF): ${startId} -> ${endId} (${path.length - 1} saltos)`, "info");

        const pathNodes = path.map(id => nodesData.find(n => n.id === id));
        
        if(!isBackground) {
            const isLinkInPath = (s, t) => {
                for(let i = 0; i < path.length - 1; i++) {
                    if ((path[i] === s && path[i+1] === t) || (path[i] === t && path[i+1] === s)) return true;
                }
                return false;
            };

            this.topology.linkGroup.selectAll("line")
                .filter(d => !d.broken)
                .transition().duration(300)
                .style("opacity", 0.15);

            this.topology.linkGroup.selectAll("line")
                .filter(d => {
                    if(d.broken) return false;
                    let s = typeof d.source === 'object' ? d.source.id : d.source;
                    let t = typeof d.target === 'object' ? d.target.id : d.target;
                    return isLinkInPath(s, t);
                })
                .transition().duration(300)
                .style("opacity", 1)
                .style("stroke-width", "4px")
                .style("stroke", "var(--accent)");
        }

        const packet = this.topology.g.append("circle")
            .attr("class", "packet")
            .attr("r", 10)
            .attr("cx", pathNodes[0].x)
            .attr("cy", pathNodes[0].y);
            
        let trans = packet.transition().duration(0);
        
        this.activeTrafficCount++;
        
        // Add stress load to nodes
        pathNodes.forEach(n => {
            if(n.type === 'router') {
                n.stressLoad = (n.stressLoad || 0) + 1;
            }
        });
        
        for (let i = 1; i < pathNodes.length; i++) {
            trans = trans.transition()
                .duration(isBackground ? this.settings.speed : 800) 
                .ease(d3.easeLinear)
                .attr("cx", pathNodes[i].x)
                .attr("cy", pathNodes[i].y);
        }
        
        trans.on("end", () => {
            packet.transition().duration(300).attr("r", 0).remove();
            
            // Remove stress load
            pathNodes.forEach(n => {
                if(n.type === 'router') {
                    n.stressLoad = Math.max(0, n.stressLoad - 1);
                }
            });
            this.activeTrafficCount--;
            this.updateDashboardLoad();
            
            if(!isBackground) this.terminal.log(`SUCESSO: Pacote chegou em ${endId}.`, "success");
            
            if(!isBackground) {
                setTimeout(() => {
                    this.topology.linkGroup.selectAll("line")
                        .transition().duration(500)
                        .style("opacity", null)
                        .style("stroke-width", null)
                        .style("stroke", null);
                }, 1000);
            }
            if(callback) callback(true);
        });
        
        this.updateDashboardLoad();
    }

    runBroadcast(startId) {
        this.terminal.log(`BROADCAST INICIADO: Origem em ${startId}. Inundando rede...`, "warn");

        const adj = {};
        nodesData.forEach(n => {
            if(!n.offline) adj[n.id] = [];
        });
        
        linksData.filter(l => !l.broken).forEach(l => {
            let s = typeof l.source === 'object' ? l.source.id : l.source;
            let t = typeof l.target === 'object' ? l.target.id : l.target;
            if(adj[s] && adj[t]) {
                adj[s].push(t);
                adj[t].push(s);
            }
        });

        if(!adj[startId] || adj[startId].length === 0) {
            this.terminal.log(`FALHA: ${startId} está isolado.`, "error");
            return;
        }

        const startNode = nodesData.find(n => n.id === startId);
        const visited = new Set([startId]);
        const self = this;

        function flood(nodeId, nodeObj) {
            const neighbors = adj[nodeId].filter(n => !visited.has(n));
            
            neighbors.forEach(neighborId => {
                visited.add(neighborId);
                const targetNode = nodesData.find(n => n.id === neighborId);
                
                const packet = self.topology.g.append("circle")
                    .attr("class", "packet")
                    .attr("r", 8)
                    .attr("cx", nodeObj.x)
                    .attr("cy", nodeObj.y)
                    .style("fill", "#fbbf24"); 
                    
                packet.transition()
                    .duration(self.settings.speed || 600)
                    .ease(d3.easeLinear)
                    .attr("cx", targetNode.x)
                    .attr("cy", targetNode.y)
                    .on("end", () => {
                        packet.remove();
                        flood(neighborId, targetNode);
                    });
            });
        }

        flood(startId, startNode);
    }

    toggleStressTest() {
        const btn = document.getElementById('stressTestBtn');
        if(this.stressTestInterval) {
            clearInterval(this.stressTestInterval);
            this.stressTestInterval = null;
            btn.innerHTML = `<i data-lucide="activity"></i> Tráfego Contínuo`;
            btn.classList.remove('active');
            this.terminal.log("Tráfego contínuo pausado.", "warn");
        } else {
            this.terminal.log(`INICIANDO STRESS TEST: ${this.settings.volume} pacotes a cada ${this.settings.interval}ms (Velocidade: ${this.settings.speed}ms).`, "warn");
            btn.innerHTML = `<i data-lucide="activity"></i> Tráfego Contínuo (ON)`;
            btn.classList.add('active');
            
            this.stressTestInterval = setInterval(() => {
                const onlineNodes = nodesData.filter(n => !n.offline);
                if(onlineNodes.length < 2) return;
                
                for(let i=0; i < this.settings.volume; i++) {
                    const s = onlineNodes[Math.floor(Math.random() * onlineNodes.length)].id;
                    let t = onlineNodes[Math.floor(Math.random() * onlineNodes.length)].id;
                    while(t === s) t = onlineNodes[Math.floor(Math.random() * onlineNodes.length)].id;
                    
                    this.run(s, t, true);
                }
            }, this.settings.interval);
        }
        
        if(window.lucide) window.lucide.createIcons({root: btn});
    }
}
