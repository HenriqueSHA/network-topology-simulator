import { nodesData, linksData } from './data.js';
import { openInputModal } from './customModal.js';

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

    async saveProject() {
        const defaultFilename = `topologia_rede_${Date.now()}.json`;
        const chosenFilename = await openInputModal({
            title: 'Salvar Projeto',
            description: 'Digite o nome do arquivo sob o qual deseja salvar sua topologia atual.',
            label: 'Nome do Arquivo:',
            defaultValue: defaultFilename,
            placeholder: 'Ex: topologia_core.json'
        });

        if (chosenFilename === null) return; // Cancelou

        let finalName = chosenFilename.trim();
        if (!finalName.endsWith('.json')) {
            finalName += '.json';
        }

        const data = {
            nodes: nodesData,
            links: linksData
        };
        const jsonData = JSON.stringify(data, null, 2);

        // Se o navegador suporta a API de File System moderna, permite escolher a pasta nativamente!
        if (window.showSaveFilePicker) {
            try {
                const handle = await window.showSaveFilePicker({
                    suggestedName: finalName,
                    types: [{
                        description: 'JSON Topology File',
                        accept: {
                            'application/json': ['.json'],
                        },
                    }],
                });
                const writable = await handle.createWritable();
                await writable.write(jsonData);
                await writable.close();
                this.topology.showStatus("Topologia salva com sucesso!", "success");
                return;
            } catch (err) {
                if (err.name === 'AbortError') {
                    return; // Cancelado pelo usuário na caixa de diálogo nativa
                }
                // Em caso de outro erro, faz fallback para o download tradicional abaixo
            }
        }

        // Fallback para download tradicional caso a API moderna não seja suportada
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = finalName;
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
                    
                    parsed.nodes.forEach(n => {
                        const nodeObj = {
                            id: n.id,
                            type: n.type,
                            desc: n.desc || '',
                            offline: n.offline || false
                        };
                        
                        // Garante que x e y sejam números válidos; caso contrário, deixa o D3 inicializá-los
                        if (typeof n.x === 'number' && !isNaN(n.x)) {
                            nodeObj.x = n.x;
                        }
                        if (typeof n.y === 'number' && !isNaN(n.y)) {
                            nodeObj.y = n.y;
                        }
                        
                        // Valida fx e fy
                        if (typeof n.fx === 'number' && !isNaN(n.fx)) {
                            nodeObj.fx = n.fx;
                        } else {
                            nodeObj.fx = null;
                        }
                        if (typeof n.fy === 'number' && !isNaN(n.fy)) {
                            nodeObj.fy = n.fy;
                        } else {
                            nodeObj.fy = null;
                        }
                        
                        nodesData.push(nodeObj);
                    });

                    parsed.links.forEach(l => {
                        const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
                        const targetId = typeof l.target === 'object' ? l.target.id : l.target;
                        linksData.push({
                            id: l.id,
                            source: sourceId,
                            target: targetId,
                            type: l.type || 'wan',
                            bandwidth: l.bandwidth || 'normal',
                            broken: l.broken || false,
                            label: l.label || ''
                        });
                    });
                    
                    this.history.saveState();
                    this.topology.updateGraph();
                    this.topology.showStatus("Topologia carregada com sucesso!", "success");
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
