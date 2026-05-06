# 🌐 Network Topology Simulator (Dark Premium)

![Apresentação do Simulador](https://img.shields.io/badge/Status-Ativo-success) ![Versão](https://img.shields.io/badge/Vers%C3%A3o-4.0-blue) ![D3.js](https://img.shields.io/badge/Renderiza%C3%A7%C3%A3o-D3.js-orange)

## 📖 O que é este projeto?

O **Network Topology Simulator** é uma aplicação web interativa desenvolvida para simular, desenhar e analisar topologias de redes de computadores em tempo real. Diferente de simuladores estáticos convencionais, esta ferramenta utiliza um motor de grafos dinâmico que permite construir infraestruturas arrastando cabos e nós na tela, visualizando o trajeto físico que pacotes de dados percorrem do ponto A ao ponto B.

## 🎯 Para que serve?

A ferramenta foi idealizada tanto para o ambiente **educacional/acadêmico** quanto para o **profissional**. Ela serve para:
- **Estudantes de Redes (CCNA, CompTIA):** Entender na prática como protocolos de roteamento (OSPF/RIP) tomam decisões matemáticas baseadas em peso, saltos ou largura de banda.
- **Engenheiros e Arquitetos:** Rascunhar arquiteturas de rede de alta disponibilidade (HA) e testar visualmente onde ocorreriam gargalos ou o que aconteceria se o "Cabo principal de fibra rompesse".
- **Demonstrações Técnicas:** Validar os conceitos de latência e "inundação" (broadcast) visualmente.

## ⚙️ Como ele funciona?

Por debaixo dos panos, o simulador funciona construindo um "Grafo de Forças" (usando a biblioteca D3.js) que representa computadores e roteadores interconectados.

1. **Construção:** O usuário desenha a rede usando os ícones do menu à esquerda (`SHIFT + Arrastar`). Ele pode escolher se a conexão é por Fibra (Rápida), Cabo Normal, ou Rádio/Satélite (Lento).
2. **Lógica de Roteamento (OSPF):** Quando o usuário "Dispara um Ping" através do Terminal ou clica em "Simular Rota", o algoritmo de Dijkstra analisa todos os cabos vivos na tela. Ele calcula o "custo" de passar por cada cabo (sendo que cabos de Rádio custam muito mais caro na rota do que cabos de Fibra) e define o melhor trajeto.
3. **Animação Assíncrona:** A bolinha (pacote de dados) viaja nó a nó seguindo essa rota ótima.
4. **Resiliência e Heatmap:** Se muitos pacotes passarem pelo mesmo roteador, o algoritmo incrementa a "Carga de Processamento" dele. Se passar de 5 pacotes simultâneos, o roteador superaquece visualmente para sinalizar um **gargalo**. Ao quebrar um cabo ativo clicando nele, o roteamento imediatamente recalcula e envia os pacotes pela rota alternativa, validando o conceito de resiliência.

---

## 🚀 Funcionalidades Principais

*   **Roteamento OSPF:** Simulação real do algoritmo de Dijkstra.
*   **Terminal Linux Embutido:** Envie comandos como `ping PC-A` ou `traceroute R3` pelo console web.
*   **Dashboard e Heatmap (Gargalos):** Submeta a rede a *Stress Tests* e visualize equipamentos sobrecarregados em alerta (Amarelo/Vermelho).
*   **Gestão de Arquitetura (Save/Load):** Salve sua infraestrutura na máquina e carregue projetos `.json` com um clique.
*   **Interface Premium:** Design Glassmorphism, ícones vetorizados e Dark Mode inteligente.

## 📦 Como Executar Localmente

### 1. Pré-requisitos
Certifique-se de ter o **Node.js** (versão 18 ou superior) instalado em sua máquina.

### 2. Clonando o Repositório
Faça o download do código-fonte para sua máquina através do terminal:
```bash
git clone https://github.com/HenriqueSHA/network-topology-simulator.git
cd network-topology-simulator
```

### 3. Instalação de Dependências
Instale as bibliotecas base do projeto (como o D3.js e o Vite):
```bash
npm install
```

### 4. Rodando o Servidor de Desenvolvimento
Inicie a aplicação utilizando o servidor do Vite (hot-reload habilitado):
```bash
npm run dev
```
> O terminal informará uma URL local (geralmente `http://localhost:5173/`). Abra este endereço em qualquer navegador moderno para começar a simular suas redes!
