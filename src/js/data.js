export const nodesData = [
    { id: "R1", type: "router", desc: "Roteador Core 1" }, 
    { id: "R2", type: "router", desc: "Roteador Core 2" }, 
    { id: "R3", type: "router", desc: "Roteador Core 3" }, 
    { id: "R4", type: "router", desc: "Roteador Core 4" }, 
    { id: "R5", type: "router", desc: "Roteador Core 5" },
    { id: "WEB1", type: "device", desc: "Servidor Web Principal" }, 
    { id: "DNS1", type: "device", desc: "Servidor DNS Primário" },
    { id: "WEB2", type: "device", desc: "Servidor Web Secundário" },
    { id: "WEB3", type: "device", desc: "Servidor Web Terciário" },
    { id: "DNS2", type: "device", desc: "Servidor DNS Secundário" }, 
    { id: "PC-A", type: "device", desc: "Estação de Trabalho A" },
    { id: "PC-B", type: "device", desc: "Estação de Trabalho B" }, 
    { id: "PC-C", type: "device", desc: "Estação de Trabalho C" }
];

export const linksData = [
    // WAN (Rede Core)
    { id: "l-r1-r2", source: "R1", target: "R2", type: "wan", label: "10.1.1.0/30", broken: false },
    { id: "l-r2-r3", source: "R2", target: "R3", type: "wan", label: "10.1.2.0/30", broken: false },
    { id: "l-r3-r4", source: "R3", target: "R4", type: "wan", label: "10.1.3.0/30", broken: false },
    { id: "l-r4-r5", source: "R4", target: "R5", type: "wan", label: "10.1.4.0/30", broken: false },
    { id: "l-r5-r1", source: "R5", target: "R1", type: "wan", label: "10.1.5.0/30", broken: false },
    { id: "l-r2-r5", source: "R2", target: "R5", type: "wan", label: "10.1.6.0/30", broken: false }, // Redundância original
    { id: "l-r1-r4", source: "R1", target: "R4", type: "wan", label: "Wireguard", broken: false }, // Wireguard VPN
    
    // LAN
    { id: "l-r1-w1", source: "R1", target: "WEB1", type: "lan", label: "192.168.1.10", broken: false },
    { id: "l-r1-d1", source: "R1", target: "DNS1", type: "lan", label: "192.168.1.5", broken: false },
    { id: "l-r2-w2", source: "R2", target: "WEB2", type: "lan", label: "192.168.2.10", broken: false },
    { id: "l-r3-w3", source: "R3", target: "WEB3", type: "lan", label: "192.168.3.10", broken: false },
    { id: "l-r4-d2", source: "R4", target: "DNS2", type: "lan", label: "192.168.4.5", broken: false },
    { id: "l-r4-pa", source: "R4", target: "PC-A", type: "lan", label: "192.168.4.10", broken: false },
    { id: "l-r5-pb", source: "R5", target: "PC-B", type: "lan", label: "192.168.5.10", broken: false },
    { id: "l-r5-pc", source: "R5", target: "PC-C", type: "lan", label: "192.168.5.11", broken: false }
];
