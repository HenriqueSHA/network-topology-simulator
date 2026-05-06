import { nodesData, linksData } from './data.js';

export class RoutingTable {
    constructor() {
        this.modal = document.getElementById('routingModal');
        this.title = document.getElementById('routingModalTitle');
        this.tbody = document.getElementById('routingTableBody');
        
        document.getElementById('closeModalBtn').addEventListener('click', () => {
            this.modal.classList.add('hidden');
        });
    }

    // Calculates RIPv2 table for a given router ID
    calculateTable(routerId) {
        // Find all active links
        const activeLinks = linksData.filter(l => {
            if(l.broken) return false;
            let sid = typeof l.source === 'object' ? l.source.id : l.source;
            let tid = typeof l.target === 'object' ? l.target.id : l.target;
            
            // Exclude links connected to offline routers (handled in topology, but just in case)
            let sNode = nodesData.find(n => n.id === sid);
            let tNode = nodesData.find(n => n.id === tid);
            if(sNode?.offline || tNode?.offline) return false;
            
            return true;
        });

        const adj = {};
        nodesData.forEach(n => {
            if(!n.offline) adj[n.id] = [];
        });

        activeLinks.forEach(l => {
            let s = typeof l.source === 'object' ? l.source.id : l.source;
            let t = typeof l.target === 'object' ? l.target.id : l.target;
            if(adj[s] && adj[t]) {
                adj[s].push(t);
                adj[t].push(s);
            }
        });

        const table = []; // Array of { dest, nextHop, metric }
        
        // For every other node, run BFS to find shortest path
        nodesData.forEach(target => {
            if(target.id === routerId || target.offline) return;
            
            const queue = [[routerId]];
            const visited = new Set([routerId]);
            let foundPath = null;
            
            while(queue.length > 0) {
                const path = queue.shift();
                const node = path[path.length - 1];
                
                if(node === target.id) {
                    foundPath = path;
                    break;
                }
                
                for(let neighbor of adj[node]) {
                    if(!visited.has(neighbor)) {
                        visited.add(neighbor);
                        queue.push([...path, neighbor]);
                    }
                }
            }
            
            if(foundPath) {
                table.push({
                    dest: target.id,
                    nextHop: foundPath.length > 2 ? foundPath[1] : 'Conectado Diretamente',
                    metric: foundPath.length - 1
                });
            } else {
                table.push({
                    dest: target.id,
                    nextHop: 'Inacessível',
                    metric: '∞'
                });
            }
        });

        // Sort table
        table.sort((a, b) => {
            if(a.metric === '∞') return 1;
            if(b.metric === '∞') return -1;
            return a.metric - b.metric;
        });

        return table;
    }

    show(routerId) {
        this.title.textContent = `Tabela de Roteamento - ${routerId}`;
        this.tbody.innerHTML = '';
        
        const table = this.calculateTable(routerId);
        
        table.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.dest}</td>
                <td>${row.nextHop}</td>
                <td>${row.metric}</td>
            `;
            this.tbody.appendChild(tr);
        });

        this.modal.classList.remove('hidden');
    }
}
