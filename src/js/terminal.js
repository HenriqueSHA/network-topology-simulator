export class Terminal {
    constructor() {
        this.output = document.getElementById('terminalOutput');
        this.container = document.getElementById('terminalContainer');
        this.toggleBtn = document.getElementById('toggleTerminal');

        this.toggleBtn.addEventListener('click', () => {
            this.container.classList.toggle('minimized');
            const isMin = this.container.classList.contains('minimized');
            document.getElementById('iconTermDown').style.display = isMin ? 'none' : 'inline-block';
            document.getElementById('iconTermUp').style.display = isMin ? 'inline-block' : 'none';
        });

        this.input = document.getElementById('terminalInput');
        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const cmd = this.input.value.trim();
                if (cmd) {
                    this.log(`user@simulador:~$ ${cmd}`, "normal");
                    if (this.onCommand) this.onCommand(cmd);
                    this.input.value = '';
                }
            }
        });

        this.onCommand = null;

        this.log("Terminal interativo pronto. Comandos: ping <nó>, traceroute <nó>", "info");
    }

    log(message, type = "normal") {
        const time = new Date().toLocaleTimeString('pt-BR', { hour12: false });
        const line = document.createElement('div');
        line.className = `log-line log-${type}`;
        line.textContent = `[${time}] ${message}`;
        this.output.appendChild(line);
        
        // Auto scroll to bottom
        this.output.scrollTop = this.output.scrollHeight;

        // Keep maximum 100 lines to avoid memory bloat
        if(this.output.children.length > 100) {
            this.output.removeChild(this.output.firstChild);
        }
    }
}
