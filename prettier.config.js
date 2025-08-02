export default {
    arrowParens: 'avoid',
    bracketSpacing: true,
    endOfLine: 'auto',
    printWidth: 150,
    semi: true,
    singleQuote: true,
    tabWidth: 4,
    trailingComma: 'all',
    useTabs: false,
    vueIndentScriptAndStyle: false,

    // Import sorting configuration
    importOrder: [
        // `<THIRD_PARTY_MODULES>` is implicity and first by default
        '^(@/|[./])(?!.*\\.vue$)', // Local non-component imports (@ alias or relative paths excluding .vue)
        '(@/.*|.*)\\.vue$', // Local component imports (.vue files with @ alias or relative paths)
    ],
    importOrderSeparation: true,
    importOrderSortSpecifiers: true,

    plugins: ['@trivago/prettier-plugin-sort-imports'],
};
