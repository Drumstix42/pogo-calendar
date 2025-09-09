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
        '^./styles/bootstrap-custom.scss$', // Specific style import first
        `<THIRD_PARTY_MODULES>`, // this is first by default, can be commented out if already first
        '^(@/|[./])(?!.*\\.vue$)', // Local non-component imports (@ alias or relative paths excluding .vue)
        '(@/.*|.*)\\.vue$', // Local component imports (.vue files with @ alias or relative paths)
    ],
    importOrderSeparation: true,
    importOrderSortSpecifiers: true,

    plugins: ['@trivago/prettier-plugin-sort-imports'],
};
