# 🌐 Network Topology Simulator (Dark Premium)

Um simulador profissional, responsivo e interativo de topologias de rede baseado em grafos (D3.js), focando na demonstração visual de protocolos de roteamento (OSPF/RIP), gargalos de tráfego, resiliência estrutural e gerenciamento de largura de banda.

## 🚀 Funcionalidades Principais

*   **Roteamento OSPF:** Simulação real do algoritmo de Dijkstra, onde pacotes encontram a rota mais rápida não pela menor quantidade de nós, mas pela **Largura de Banda** dos cabos (Fibra = Rápido, Rádio = Lento).
*   **Terminal Linux Embutido:** Envie comandos interativos como `ping PC-A` ou `traceroute R3` pelo terminal web com logs precisos.
*   **Dashboard e Heatmap (Gargalos):** Submeta a rede a *Stress Tests* configuráveis e visualize roteadores mudando para cores de alerta (Amarelo/Vermelho) conforme ficam sobrecarregados.
*   **Gestão de Arquitetura (Save/Load):** Monte sua topologia, arraste roteadores e dispositivos, ligue-os com `SHIFT+Click`, configure os links e salve seu projeto em formato `.json` direto no navegador.
*   **Resiliência ao Vivo:** O protocolo encontra rotas alternativas de forma autônoma no exato instante em que você desliga ou quebra um link WAN.
*   **Interface Premium:** Design em Glassmorphism, ícones Lucide dinâmicos, Dark Mode avançado, animações assíncronas e Canvas otimizado.

## 🛠️ Tecnologias Utilizadas
*   HTML5 / CSS3 Avançado (Variáveis de CSS, Glassmorphism, Tooltips)
*   Vanilla JavaScript (ES6+ Modular)
*   **[D3.js](https://d3js.org/)** (Force Simulation, Drag, SVG Render)
*   **[Lucide Icons](https://lucide.dev/)**
*   **Vite** (Module Bundler)

## 📦 Como Executar Localmente

### 1. Pré-requisitos
Certifique-se de ter o **Node.js** (v18+) instalado na máquina.

### 2. Instalação
Clone o repositório e instale as dependências:
```bash
git clone https://github.com/HenriqueSHA/network-topology-simulator.git
cd network-topology-simulator
npm install
```

### 3. Rodando o Servidor de Desenvolvimento
Inicie a aplicação utilizando o servidor de desenvolvimento do Vite:
```bash
npm run dev
```
Abra `http://localhost:5173` no seu navegador.

---
*Projeto de simulação de redes concebido para experimentação acadêmica e profissional de fluxos de pacotes.*
