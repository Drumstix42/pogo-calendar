import { ref } from 'vue';

export interface PokemonRow {
    id: number;
    name: string;
}

/** A free-form, add/remove-able list of named Pokemon rows, each with a stable `:key` id. */
export function usePokemonRowList() {
    let nextRowId = 1;
    const rows = ref<PokemonRow[]>([]);

    function setNames(names: string[]) {
        rows.value = names.map(name => ({ id: nextRowId++, name }));
    }

    function addRow(name = '') {
        rows.value.push({ id: nextRowId++, name });
    }

    function removeRow(id: number) {
        rows.value = rows.value.filter(row => row.id !== id);
    }

    return { rows, addRow, removeRow, setNames };
}
