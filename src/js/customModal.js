/**
 * Custom Modal - Substitui prompt() nativo por modais estilizados glassmorphism.
 * Suporta modo "text" (input de texto) e modo "select" (dropdown).
 */

const modal = () => document.getElementById('customInputModal');
const titleEl = () => document.getElementById('customInputTitle');
const descEl = () => document.getElementById('customInputDescription');
const labelEl = () => document.getElementById('customInputLabel');
const inputEl = () => document.getElementById('customInputField');
const textGroup = () => document.getElementById('customInputTextGroup');
const selectGroup = () => document.getElementById('customInputSelectGroup');
const selectLabel = () => document.getElementById('customSelectLabel');
const selectEl = () => document.getElementById('customSelectField');
const confirmBtn = () => document.getElementById('customInputConfirmBtn');
const cancelBtn = () => document.getElementById('customInputCancelBtn');
const closeBtn = () => document.getElementById('customInputCloseBtn');

/**
 * Abre um modal estilizado para entrada de dados.
 * 
 * @param {Object} options
 * @param {string} options.title - Título do modal
 * @param {string} [options.description] - Descrição/instrução abaixo do título
 * @param {string} [options.label] - Label do campo de input
 * @param {string} [options.defaultValue] - Valor padrão do input
 * @param {string} [options.placeholder] - Placeholder do input
 * @param {'text'|'select'} [options.mode='text'] - Modo: 'text' para input, 'select' para dropdown
 * @param {Array<{value: string, label: string}>} [options.selectOptions] - Opções para o select
 * @param {string} [options.selectedValue] - Valor selecionado por padrão no select
 * @returns {Promise<string|null>} - Valor informado, ou null se cancelou
 */
export function openInputModal(options = {}) {
    return new Promise((resolve) => {
        const {
            title = 'Entrada',
            description = '',
            label = 'Valor:',
            defaultValue = '',
            placeholder = '',
            mode = 'text',
            selectOptions = [],
            selectedValue = ''
        } = options;

        // Configurar título e descrição
        titleEl().textContent = title;
        descEl().textContent = description;
        descEl().style.display = description ? 'block' : 'none';

        // Modo Text
        if (mode === 'text') {
            textGroup().style.display = 'flex';
            selectGroup().style.display = 'none';
            labelEl().textContent = label;
            inputEl().value = defaultValue;
            inputEl().placeholder = placeholder;
        }
        // Modo Select
        else if (mode === 'select') {
            textGroup().style.display = 'none';
            selectGroup().style.display = 'flex';
            selectLabel().textContent = label;
            selectEl().innerHTML = '';
            selectOptions.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt.value;
                option.textContent = opt.label;
                if (opt.value === selectedValue) option.selected = true;
                selectEl().appendChild(option);
            });
        }

        // Abrir modal
        modal().classList.remove('hidden');

        // Focus automático
        setTimeout(() => {
            if (mode === 'text') inputEl().focus();
            else selectEl().focus();
        }, 100);

        // Cleanup listeners
        const cleanup = () => {
            confirmBtn().removeEventListener('click', onConfirm);
            cancelBtn().removeEventListener('click', onCancel);
            closeBtn().removeEventListener('click', onCancel);
            inputEl().removeEventListener('keydown', onKeydown);
            modal().classList.add('hidden');
        };

        const onConfirm = () => {
            const value = mode === 'text' ? inputEl().value : selectEl().value;
            cleanup();
            resolve(value);
        };

        const onCancel = () => {
            cleanup();
            resolve(null);
        };

        const onKeydown = (e) => {
            if (e.key === 'Enter') onConfirm();
            if (e.key === 'Escape') onCancel();
        };

        confirmBtn().addEventListener('click', onConfirm);
        cancelBtn().addEventListener('click', onCancel);
        closeBtn().addEventListener('click', onCancel);
        inputEl().addEventListener('keydown', onKeydown);
    });
}
