import './css/style.css';
import { createIcons, Info, Play, ZoomIn, ZoomOut, Maximize, Activity, Cpu, Monitor, Terminal as TerminalIcon, ChevronDown, ChevronUp, X, Undo2, Redo2, Table, Trash2, Settings, Radio, Save, Upload, BarChart2, Edit2, Square, Menu, PanelLeftClose } from 'lucide';
import { NetworkTopology } from './js/topology.js';
import { PacketSimulation } from './js/simulation.js';
import { Terminal } from './js/terminal.js';
import { RoutingTable } from './js/routing.js';
import { HistoryManager } from './js/history.js';
import { StorageManager } from './js/storage.js';
import { openInputModal } from './js/customModal.js';
import { nodesData, linksData } from './js/data.js';

// Inicializar ícones do Lucide
createIcons({
  icons: {
    Info, Play, ZoomIn, ZoomOut, Maximize, Activity, Cpu, Monitor, Terminal: TerminalIcon, ChevronDown, ChevronUp, X, Undo2, Redo2, Table, Trash2, Settings, Radio, Save, Upload, BarChart2, Edit2, Square, Menu, PanelLeftClose
  }
});

const terminal = new Terminal();
const routingTable = new RoutingTable();
const topology = new NetworkTopology("#networkSvg");
const history = new HistoryManager(topology);
topology.history = history; 
const simulation = new PacketSimulation(topology, terminal);
const storage = new StorageManager(topology, history);

// Menu de contexto customizado
const contextMenu = document.getElementById('contextMenu');
let contextNodeId = null;
let contextNodeType = null;

topology.onNodeContextMenu = (event, nodeData) => {
    event.preventDefault();
    contextNodeId = nodeData.id;
    contextNodeType = nodeData.type;
    
    // Position menu
    contextMenu.style.left = `${event.pageX}px`;
    contextMenu.style.top = `${event.pageY}px`;
    contextMenu.classList.remove('hidden');
    
    // Agora todos (roteadores e dispositivos) podem ver a tabela de rotas
    const tableBtn = document.getElementById('ctxRoutingTable');
    tableBtn.style.display = 'flex';
};

// Hide context menu on global click
document.addEventListener('click', (e) => {
    if(!contextMenu.contains(e.target)) {
        contextMenu.classList.add('hidden');
    }
});

document.getElementById('ctxRoutingTable').addEventListener('click', () => {
    contextMenu.classList.add('hidden');
    if (contextNodeId) routingTable.show(contextNodeId);
});

document.getElementById('ctxDeleteNode').addEventListener('click', () => {
    contextMenu.classList.add('hidden');
    if (contextNodeId) {
        topology.deleteNode(contextNodeId);
    }
});

document.getElementById('ctxRenameNode').addEventListener('click', async () => {
    contextMenu.classList.add('hidden');
    if (contextNodeId) {
        const newName = await openInputModal({
            title: 'Renomear Nó',
            description: `Renomear o nó "${contextNodeId}" para um novo identificador.`,
            label: 'Novo Nome:',
            defaultValue: contextNodeId,
            placeholder: 'Ex: R1, PC-Admin, WEB2'
        });
        if (newName !== null && newName.trim() !== '') {
            topology.renameNode(contextNodeId, newName.trim());
        }
    }
});

// Alterar IP dos links conectados ao nó
document.getElementById('ctxChangeIp').addEventListener('click', async () => {
    contextMenu.classList.add('hidden');
    if (!contextNodeId) return;

    // Encontrar links conectados ao nó selecionado
    const connectedLinks = linksData.filter(l => {
        const sid = typeof l.source === 'object' ? l.source.id : l.source;
        const tid = typeof l.target === 'object' ? l.target.id : l.target;
        return sid === contextNodeId || tid === contextNodeId;
    });

    if (connectedLinks.length === 0) {
        topology.showStatus('Este nó não possui conexões.', 'warn');
        return;
    }

    // Se houver mais de um link, deixar o usuário escolher qual
    let targetLink = connectedLinks[0];
    if (connectedLinks.length > 1) {
        const options = connectedLinks.map(l => {
            const sid = typeof l.source === 'object' ? l.source.id : l.source;
            const tid = typeof l.target === 'object' ? l.target.id : l.target;
            return { value: l.id, label: `${sid} ↔ ${tid} (${l.label || 'sem IP'})` };
        });
        const chosenId = await openInputModal({
            title: 'Selecionar Conexão',
            description: `O nó "${contextNodeId}" possui múltiplos links. Escolha qual alterar.`,
            label: 'Link:',
            mode: 'select',
            selectOptions: options,
            selectedValue: options[0].value
        });
        if (chosenId === null) return;
        targetLink = connectedLinks.find(l => l.id === chosenId);
    }

    const newIp = await openInputModal({
        title: 'Alterar IP do Link',
        description: `Alterar o endereço IP/label do link selecionado.`,
        label: 'Novo IP:',
        defaultValue: targetLink.label || '',
        placeholder: 'Ex: 192.168.1.0/24'
    });
    if (newIp !== null) {
        targetLink.label = newIp.trim() || targetLink.label;
        topology.updateGraph();
        topology.showStatus('IP do link atualizado!', 'info');
    }
});

document.addEventListener("DOMContentLoaded", () => {
    topology.updateGraph('all');

    document.getElementById('filterSelect').addEventListener('change', (e) => {
        topology.updateGraph(e.target.value);
    });

    // Simulador e Stress Test
    const sourceSelect = document.getElementById('sourceSelect');
    const targetSelect = document.getElementById('targetSelect');
    
    let continuousRouteTimer = null;
    document.getElementById('simulateBtn').addEventListener('click', () => {
        const btn = document.getElementById('simulateBtn');
        
        if (continuousRouteTimer) {
            clearInterval(continuousRouteTimer);
            continuousRouteTimer = null;
            btn.innerHTML = `<i data-lucide="play"></i> Simular Rota`;
            if(window.lucide) window.lucide.createIcons({root: btn});
            return;
        }

        const isContinuous = document.getElementById('continuousRouteCheck').checked;
        simulation.run(sourceSelect.value, targetSelect.value, false);
        
        if (isContinuous) {
            btn.innerHTML = `<i data-lucide="square"></i> Parar Repetição`;
            if(window.lucide) window.lucide.createIcons({root: btn});
            
            continuousRouteTimer = setInterval(() => {
                if(!document.getElementById('continuousRouteCheck').checked) {
                    clearInterval(continuousRouteTimer);
                    continuousRouteTimer = null;
                    btn.innerHTML = `<i data-lucide="play"></i> Simular Rota`;
                    if(window.lucide) window.lucide.createIcons({root: btn});
                    return;
                }
                simulation.run(sourceSelect.value, targetSelect.value, false);
            }, 2500); // Envia um pacote novo a cada 2.5s
        }
    });
    
    document.getElementById('broadcastBtn').addEventListener('click', () => {
        simulation.runBroadcast(sourceSelect.value);
    });
    
    // Configuração de Estresse
    document.getElementById('stressTestBtn').addEventListener('click', () => simulation.toggleStressTest());

    // Toggle de Protocolo (OSPF / RIPv2)
    const protocolDescriptions = {
        ospf: 'O caminho é definido pela Velocidade (Largura de Banda) do cabo (Fibra é mais rápido que Rádio).',
        rip: 'O caminho é definido pela contagem de saltos (hops). O menor número de roteadores até o destino vence, independente da velocidade do cabo.'
    };

    document.getElementById('ospfToggle').addEventListener('change', (e) => {
        const title = document.getElementById('protocolTitle');
        const isOspf = e.target.checked;
        title.textContent = isOspf ? 'OSPF' : 'RIPv2';
        title.style.color = isOspf ? 'var(--secondary)' : 'var(--primary)';

        // Atualizar "Como Funciona?"
        document.getElementById('infoProtocolName').textContent = isOspf ? 'OSPF' : 'RIPv2';
        document.getElementById('infoProtocolDesc').textContent = isOspf ? protocolDescriptions.ospf : protocolDescriptions.rip;
    });

    // Configurações do Stress Test
    const settingsModal = document.getElementById('settingsModal');
    document.getElementById('stressSettingsBtn').addEventListener('click', () => {
        settingsModal.classList.remove('hidden');
    });
    document.getElementById('closeSettingsBtn').addEventListener('click', () => {
        settingsModal.classList.add('hidden');
    });
    
    // Sliders
    ['speed', 'volume', 'interval'].forEach(id => {
        const slider = document.getElementById(`${id}Slider`);
        const valDisp = document.getElementById(`${id}Value`);
        slider.addEventListener('input', (e) => {
            valDisp.textContent = `${e.target.value}${id === 'volume' ? ' pacote(s)' : 'ms'}`;
            simulation.settings[id] = parseInt(e.target.value);
        });
    });

    // Lógica do Accordion
    const accHeader = document.querySelector('.accordion-header');
    if(accHeader) {
        accHeader.addEventListener('click', function() {
            const item = this.parentElement;
            item.classList.toggle('active');
            const content = item.querySelector('.accordion-content');
            if (item.classList.contains('active')) {
                content.style.display = 'block';
            } else {
                content.style.display = 'none';
            }
        });
    }
});
