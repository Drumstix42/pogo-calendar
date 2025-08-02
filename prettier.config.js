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
        '^[./](?!.*\\.vue$)', // Local non-component imports (relative paths excluding .vue)
        '\\.vue$', // Local component imports (.vue files)
    ],
    importOrderSeparation: true,
    importOrderSortSpecifiers: true,

    plugins: ['@trivago/prettier-plugin-sort-imports'],
};
