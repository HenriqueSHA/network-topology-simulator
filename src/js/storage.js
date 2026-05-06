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
