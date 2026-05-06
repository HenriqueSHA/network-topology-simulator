import { nodesData, linksData } from './data.js';

export class HistoryManager {
    constructor(topology) {
        this.topology = topology;
        this.undoStack = [];
        this.redoStack = [];
        this.undoBtn = document.getElementById('undoBtn');
        this.redoBtn = document.getElementById('redoBtn');

        this.undoBtn.addEventListener('click', () => this.undo());
        this.redoBtn.addEventListener('click', () => this.redo());

        // Save initial state
        this.saveState();
    }

    // Deep clone array of objects
    cloneState() {
        return {
            nodes: JSON.parse(JSON.stringify(nodesData)),
            links: JSON.parse(JSON.stringify(linksData))
        };
    }

    saveState() {
        this.undoStack.push(this.cloneState());
        // Limit history to 50
        if(this.undoStack.length > 50) this.undoStack.shift();
        
        this.redoStack = []; // Clear redo on new action
        this.updateButtons();
    }

    restoreState(state) {
        // Clear original arrays without losing reference
        nodesData.length = 0;
        linksData.length = 0;

        // Push restored data
        state.nodes.forEach(n => nodesData.push(n));
        state.links.forEach(l => linksData.push(l));

        this.topology.updateGraph();
    }

    undo() {
        if(this.undoStack.length > 1) { // > 1 because current state is top of undoStack
            const currentState = this.undoStack.pop();
            this.redoStack.push(currentState);
            
            const previousState = this.undoStack[this.undoStack.length - 1];
            this.restoreState(JSON.parse(JSON.stringify(previousState)));
            
            this.topology.showStatus("Ação Desfeita", "warn");
            this.updateButtons();
        }
    }

    redo() {
        if(this.redoStack.length > 0) {
            const stateToRestore = this.redoStack.pop();
            this.undoStack.push(stateToRestore);
            
            this.restoreState(JSON.parse(JSON.stringify(stateToRestore)));
            
            this.topology.showStatus("Ação Refeita", "info");
            this.updateButtons();
        }
    }

    updateButtons() {
        this.undoBtn.disabled = this.undoStack.length <= 1;
        this.redoBtn.disabled = this.redoStack.length === 0;
    }
}
