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

// === Dashboard: função global de atualização ===
function updateDashboard() {
    const totalNodes = nodesData.length;
    const totalLinks = linksData.length;
    const brokenLinks = linksData.filter(l => l.broken).length;
    const totalRouters = nodesData.filter(n => n.type === 'router').length;
    const onlineRouters = nodesData.filter(n => n.type === 'router' && !n.offline).length;
    const fiberCount = linksData.filter(l => l.bandwidth === 'fast').length;
    const copperCount = linksData.filter(l => !l.bandwidth || l.bandwidth === 'normal').length;
    const radioCount = linksData.filter(l => l.bandwidth === 'slow').length;

    const set = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
    set('dashTotalNodes', totalNodes);
    set('dashTotalLinks', totalLinks);
    set('dashBrokenLinks', brokenLinks);
    set('dashOnlineRouters', `${onlineRouters}/${totalRouters}`);
    set('dashFiberCount', fiberCount);
    set('dashCopperCount', copperCount);
    set('dashRadioCount', radioCount);
    set('dashActiveTraff', simulation.activeTrafficCount || 0);
}

// Encadear onGraphUpdated ANTES do primeiro updateGraph
const originalOnGraphUpdated = topology.onGraphUpdated;
topology.onGraphUpdated = () => {
    if (originalOnGraphUpdated) originalOnGraphUpdated();
    updateDashboard();
};

// Timer para tráfego ativo (atualiza a cada 500ms)
setInterval(updateDashboard, 500);

// Menu de contexto customizado
const contextMenu = document.getElementById('contextMenu');
let contextNodeId = null;
let contextNodeType = null;

topology.onNodeContextMenu = (event, nodeData) => {
    event.preventDefault();
    contextNodeId = nodeData.id;
    contextNodeType = nodeData.type;
    
    contextMenu.style.left = `${event.pageX}px`;
    contextMenu.style.top = `${event.pageY}px`;
    contextMenu.classList.remove('hidden');
    
    const tableBtn = document.getElementById('ctxRoutingTable');
    tableBtn.style.display = 'flex';
};

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

    const connectedLinks = linksData.filter(l => {
        const sid = typeof l.source === 'object' ? l.source.id : l.source;
        const tid = typeof l.target === 'object' ? l.target.id : l.target;
        return sid === contextNodeId || tid === contextNodeId;
    });

    if (connectedLinks.length === 0) {
        topology.showStatus('Este nó não possui conexões.', 'warn');
        return;
    }

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
    // Primeiro render (já vai disparar updateDashboard via onGraphUpdated)
    topology.updateGraph('all');

    document.getElementById('filterSelect').addEventListener('change', (e) => {
        topology.updateGraph(e.target.value);
    });

    // === Sidebar Toggle ===
    const mainSidebar = document.getElementById('mainSidebar');
    const miniToolbar = document.getElementById('miniToolbar');
    const hideSidebarBtn = document.getElementById('hideSidebarBtn');
    const showSidebarBtn = document.getElementById('showSidebarBtn');

    if (hideSidebarBtn && mainSidebar && miniToolbar) {
        hideSidebarBtn.addEventListener('click', () => {
            mainSidebar.classList.add('hidden');
            setTimeout(() => {
                miniToolbar.style.display = 'flex';
            }, 300);
        });

        showSidebarBtn.addEventListener('click', () => {
            miniToolbar.style.display = 'none';
            mainSidebar.classList.remove('hidden');
        });
    }

    // === Simulador e Stress Test ===
    const sourceSelect = document.getElementById('sourceSelect');
    const targetSelect = document.getElementById('targetSelect');
    
    const runSimulation = () => {
        simulation.run(sourceSelect.value, targetSelect.value, false);
    };

    const runBroadcast = () => {
        simulation.runBroadcast(sourceSelect.value);
    };

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
        runSimulation();
        
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
                runSimulation();
            }, 2500);
        }
    });
    
    document.getElementById('broadcastBtn').addEventListener('click', runBroadcast);
    
    // Mini Toolbar Bindings
    document.getElementById('miniSimulateBtn').addEventListener('click', runSimulation);
    document.getElementById('miniBroadcastBtn').addEventListener('click', runBroadcast);
    document.getElementById('miniSaveBtn').addEventListener('click', () => {
        document.getElementById('saveBtn').click();
    });
    document.getElementById('miniLoadBtn').addEventListener('click', () => {
        document.getElementById('loadBtn').click();
    });

    // Configuração de Estresse
    document.getElementById('stressTestBtn').addEventListener('click', () => simulation.toggleStressTest());

    // Toggle de Protocolo (OSPF / RIPv2) - Sincroniza TUDO
    const protocolDescriptions = {
        ospf: 'O caminho é definido pela Velocidade (Largura de Banda) do cabo (Fibra é mais rápido que Rádio).',
        rip: 'O caminho é definido pela contagem de saltos (hops). O menor número de roteadores até o destino vence, independente da velocidade do cabo.'
    };

    document.getElementById('ospfToggle').addEventListener('change', (e) => {
        const isOspf = e.target.checked;
        const protocolName = isOspf ? 'OSPF' : 'RIPv2';

        // 1. Título da sidebar
        const title = document.getElementById('protocolTitle');
        title.textContent = protocolName;
        title.style.color = isOspf ? 'var(--secondary)' : 'var(--primary)';

        // 2. Label da checkbox
        const toggleLabel = document.getElementById('ospfToggleLabel');
        if (toggleLabel) {
            toggleLabel.innerHTML = isOspf
                ? 'Caminho mais veloz — <strong>OSPF</strong>'
                : 'Menor nº de saltos — <strong>RIPv2</strong>';
        }

        // 3. Accordion "Como Funciona?"
        const infoName = document.getElementById('infoProtocolName');
        const infoDesc = document.getElementById('infoProtocolDesc');
        if (infoName) infoName.textContent = protocolName;
        if (infoDesc) infoDesc.textContent = isOspf ? protocolDescriptions.ospf : protocolDescriptions.rip;

        // 4. Badge do Dashboard
        const badge = document.getElementById('dashProtocolBadge');
        if (badge) {
            badge.textContent = protocolName;
            badge.style.background = isOspf ? 'rgba(139, 92, 246, 0.2)' : 'rgba(59, 130, 246, 0.2)';
            badge.style.color = isOspf ? 'var(--secondary)' : 'var(--primary)';
            badge.style.borderColor = isOspf ? 'rgba(139, 92, 246, 0.3)' : 'rgba(59, 130, 246, 0.3)';
        }
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
