import { nodesData, linksData } from './data.js';

export class StorageManager {
    constructor(topology, history) {
        this.topology = topology;
        this.history = history;
        
        document.getElementById('saveBtn').addEventListener('click', () => this.saveProject());
        document.getElementById('loadBtn').addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });
        document.getElementById('fileInput').addEventListener('change', (e) => this.loadProject(e));
    }

    saveProject() {
        const data = {
            nodes: nodesData,
            links: linksData
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `topologia_ospf_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.topology.showStatus("Topologia salva com sucesso!", "success");
    }

    loadProject(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const parsed = JSON.parse(e.target.result);
                if (parsed.nodes && parsed.links) {
                    nodesData.length = 0;
                    linksData.length = 0;
                    parsed.nodes.forEach(n => nodesData.push(n));
                    parsed.links.forEach(l => linksData.push(l));
                    
                    this.history.saveState();
                    this.topology.updateGraph();
                    this.topology.showStatus("Topologia carregada!", "success");
                } else {
                    this.topology.showStatus("Arquivo JSON inválido.", "error");
                }
            } catch (error) {
                this.topology.showStatus("Erro ao ler o arquivo.", "error");
            }
        };
        reader.readAsText(file);
        event.target.value = ''; // Reset input
    }
}
